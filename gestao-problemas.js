// gestao-problemas.js

document.addEventListener('DOMContentLoaded', () => {

    /* --- Referências aos elementos do DOM --- */
    const navButtons = document.querySelectorAll('.nav-btn');
    const toolPanels = document.querySelectorAll('.tool-panel');

    // Seção Análise do Problema (Ishikawa)
    const problemaIshikawaInput = document.getElementById('problema-ishikawa');
    const ishikawaFactors = document.querySelectorAll('.factor-input');
    const saveIshikawaBtn = document.getElementById('save-ishikawa');
    const ishikawaStatus = document.getElementById('ishikawa-status');

    // Seção Plano de Ação (5W2H)
    const planoProblemaInput = document.getElementById('plano-problema');
    const save5w2hBtn = document.getElementById('save-5w2h');
    const planoStatus = document.getElementById('plano-status');
    const w2hInputs = {
        what: document.getElementById('5w2h-what'),
        why: document.getElementById('5w2h-why'),
        where: document.getElementById('5w2h-where'),
        who: document.getElementById('5w2h-who'),
        when: document.getElementById('5w2h-when'),
        how: document.getElementById('5w2h-how'),
        how_much: document.getElementById('5w2h-how-much')
    };

    // Seção Ciclo PDCA (DO, CHECK, ACT)
    const execucaoPlanoInput = document.getElementById('execucao-plano');
    const saveExecucaoBtn = document.getElementById('save-execucao');
    const execucaoStatus = document.getElementById('execucao-status');
    const paretoInputsContainer = document.getElementById('pareto-inputs-container');
    const addParetoItemBtn = document.getElementById('add-pareto-item');
    const generateParetoBtn = document.getElementById('generate-pareto');
    const paretoCanvas = document.getElementById('pareto-chart');
    const paretoOutput = document.getElementById('pareto-output');
    const acoesCorretivasInput = document.getElementById('acoes-corretivas');
    const saveAcoesBtn = document.getElementById('save-acoes');
    const acoesStatus = document.getElementById('acoes-status');
    let paretoChart = null;

    // Seção Relatório Geral
    const relatorioContent = document.getElementById('relatorio-content');
    const generateFullReportBtn = document.getElementById('generate-full-report');
    const printReportBtn = document.getElementById('print-report');

    /* --- Lógica de Navegação entre Seções --- */
    function showPanel(target) {
        navButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-tool="${target}"]`).classList.add('active');

        toolPanels.forEach(panel => panel.classList.remove('active'));
        document.getElementById(target).classList.add('active');
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            showPanel(btn.dataset.tool);
        });
    });

    /* --- Lógica para o PLAN (Ishikawa) --- */
    saveIshikawaBtn.addEventListener('click', () => {
        const analise = {
            problema: problemaIshikawaInput.value,
            causas: {}
        };
        ishikawaFactors.forEach(factor => {
            analise.causas[factor.dataset.factor] = factor.value.split('\n').filter(line => line.trim() !== '');
        });

        localStorage.setItem('ishikawa-analise', JSON.stringify(analise));
        ishikawaStatus.textContent = 'Análise de causa-raiz salva com sucesso!';

        // Sincroniza o campo de problema do 5W2H
        planoProblemaInput.value = analise.problema;
    });

    /* --- Lógica para o PLAN (5W2H) --- */
    save5w2hBtn.addEventListener('click', () => {
        const plano = {
            problema: planoProblemaInput.value,
            what: w2hInputs.what.value,
            why: w2hInputs.why.value,
            where: w2hInputs.where.value,
            who: w2hInputs.who.value,
            when: w2hInputs.when.value,
            how: w2hInputs.how.value,
            how_much: w2hInputs.how_much.value
        };

        let planosExistentes = JSON.parse(localStorage.getItem('planos-5w2h')) || [];
        planosExistentes.push(plano);
        localStorage.setItem('planos-5w2h', JSON.stringify(planosExistentes));

        planoStatus.textContent = 'Plano de ação salvo com sucesso!';
    });

    /* --- Lógica para o DO (Execução) --- */
    saveExecucaoBtn.addEventListener('click', () => {
        const execucao = execucaoPlanoInput.value;
        localStorage.setItem('pdca-execucao', execucao);
        execucaoStatus.textContent = 'Execução salva com sucesso!';
    });

    /* --- Lógica para o CHECK (Pareto) --- */
    function addParetoItem() {
        const newItem = document.createElement('div');
        newItem.classList.add('pareto-item');
        newItem.innerHTML = `
            <input type="text" class="problema" placeholder="Problema">
            <input type="number" class="frequencia" placeholder="Frequência" min="1">
            <button class="remove-item">X</button>
        `;
        paretoInputsContainer.appendChild(newItem);

        newItem.querySelector('.remove-item').addEventListener('click', () => {
            newItem.remove();
        });
    }

    addParetoItemBtn.addEventListener('click', addParetoItem);

    generateParetoBtn.addEventListener('click', () => {
        const inputs = Array.from(paretoInputsContainer.children);
        const data = inputs.map(item => ({
            problema: item.querySelector('.problema').value,
            frequencia: parseInt(item.querySelector('.frequencia').value) || 0
        })).filter(item => item.problema && item.frequencia > 0);

        if (data.length === 0) {
            paretoOutput.textContent = 'Adicione problemas e frequências para gerar a análise.';
            return;
        }

        data.sort((a, b) => b.frequencia - a.frequencia);
        const totalFrequencia = data.reduce((sum, item) => sum + item.frequencia, 0);

        let cumulativeFrequencia = 0;
        const processedData = data.map(item => {
            cumulativeFrequencia += item.frequencia;
            return {
                ...item,
                porcentagemAcumulada: (cumulativeFrequencia / totalFrequencia) * 100
            };
        });

        // Gerar Gráfico
        const labels = processedData.map(item => item.problema);
        const frequencies = processedData.map(item => item.frequencia);
        const cumulativePercentages = processedData.map(item => item.porcentagemAcumulada);

        if (paretoChart) {
            paretoChart.destroy();
        }

        paretoChart = new Chart(paretoCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    { label: 'Frequência', data: frequencies, backgroundColor: 'rgba(0, 123, 255, 0.7)', yAxisID: 'y' },
                    { label: 'Porcentagem Acumulada', data: cumulativePercentages, type: 'line', borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.2)', fill: false, yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { title: { display: true, text: 'Frequência' } },
                    y1: {
                        type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false },
                        title: { display: true, text: 'Porcentagem Acumulada (%)' },
                        max: 100, ticks: { callback: (value) => value + '%' }
                    }
                }
            }
        });

        // Análise de Pareto (Regra 80/20)
        let analysisText = 'Análise de Problemas:\n\n';
        const eightyPercentPoint = processedData.find(item => item.porcentagemAcumulada >= 80);

        if (eightyPercentPoint) {
            const index = processedData.indexOf(eightyPercentPoint);
            const keyProblems = processedData.slice(0, index + 1).map(p => p.problema).join(', ');
            analysisText += `Os ${index + 1} problemas mais frequentes (${keyProblems}) representam ${eightyPercentPoint.porcentagemAcumulada.toFixed(2)}% do total. Concentrar a solução nesses problemas gerará o maior impacto.`;
        } else {
            analysisText += 'A regra 80/20 pode não se aplicar diretamente a este conjunto de dados. Foque nos problemas de maior frequência para obter as maiores melhorias.';
        }
        paretoOutput.textContent = analysisText;

        // Salva os dados do Pareto para o relatório final
        localStorage.setItem('pareto-data', JSON.stringify(processedData));
        localStorage.setItem('pareto-analysis', analysisText);
    });

    // Adiciona o primeiro item de Pareto na inicialização
    addParetoItem();

    /* --- Lógica para o ACT (Ações Corretivas) --- */
    saveAcoesBtn.addEventListener('click', () => {
        const acoes = acoesCorretivasInput.value;
        localStorage.setItem('pdca-acoes', acoes);
        acoesStatus.textContent = 'Ações corretivas e padronização salvas com sucesso!';
    });

    /* --- Lógica para o Relatório Geral --- */
    generateFullReportBtn.addEventListener('click', () => {
        let reportHtml = '';

        // 1. Coleta dados do Ishikawa (PLAN)
        const ishikawaData = JSON.parse(localStorage.getItem('ishikawa-analise'));
        if (ishikawaData && ishikawaData.problema) {
            reportHtml += `
                <div class="relatorio-ishikawa">
                    <h3>1. Análise de Causa-Raiz (Ishikawa)</h3>
                    <p><strong>Problema Analisado:</strong> ${ishikawaData.problema}</p>
                    <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString()}</p>
                    <h4>Causas Encontradas:</h4>
                    <ul>
                        ${Object.keys(ishikawaData.causas).map(factor => {
                            if (ishikawaData.causas[factor].length > 0) {
                                return `<li><strong>${factor}:</strong> ${ishikawaData.causas[factor].join('; ')}</li>`;
                            }
                            return '';
                        }).join('')}
                    </ul>
                </div><hr>
            `;
        } else {
            reportHtml += `<p>Nenhum dado de Ishikawa encontrado. Por favor, preencha a seção de "Análise do Problema".</p><hr>`;
        }

        // 2. Coleta dados do 5W2H (PLAN)
        const planos = JSON.parse(localStorage.getItem('planos-5w2h'));
        if (planos && planos.length > 0) {
            reportHtml += `
                <div class="relatorio-5w2h">
                    <h3>2. Plano de Ação (5W2H)</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Problema</th>
                                <th>O quê?</th>
                                <th>Por quê?</th>
                                <th>Onde?</th>
                                <th>Quem?</th>
                                <th>Quando?</th>
                                <th>Como?</th>
                                <th>Custo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${planos.map(plano => `
                                <tr>
                                    <td>${plano.problema}</td>
                                    <td>${plano.what}</td>
                                    <td>${plano.why}</td>
                                    <td>${plano.where}</td>
                                    <td>${plano.who}</td>
                                    <td>${plano.when}</td>
                                    <td>${plano.how}</td>
                                    <td>${plano.how_much ? 'R$ ' + plano.how_much : 'N/A'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div><hr>
            `;
        } else {
            reportHtml += `<p>Nenhum plano de ação (5W2H) encontrado. Por favor, preencha a seção de "Plano de Ação".</p><hr>`;
        }

        // 3. Coleta dados de Execução (DO)
        const execucaoData = localStorage.getItem('pdca-execucao');
        if (execucaoData) {
            reportHtml += `
                <div class="relatorio-execucao">
                    <h3>3. Execução (Do)</h3>
                    <p>${execucaoData}</p>
                </div><hr>
            `;
        } else {
            reportHtml += `<p>Nenhuma informação de execução encontrada. Por favor, preencha a seção "Execução e Verificação".</p><hr>`;
        }

        // 4. Coleta dados do Pareto (CHECK)
        const paretoData = localStorage.getItem('pareto-data');
        const paretoAnalysis = localStorage.getItem('pareto-analysis');
        if (paretoData && paretoAnalysis) {
            const parsedParetoData = JSON.parse(paretoData);
            reportHtml += `
                <div class="relatorio-pareto">
                    <h3>4. Análise de Resultados (Pareto)</h3>
                    <p><strong>Análise:</strong> ${paretoAnalysis}</p>
                    <p><strong>Dados:</strong></p>
                    <ul>
                        ${parsedParetoData.map(item => `<li>${item.problema}: ${item.frequencia} ocorrências (${item.porcentagemAcumulada.toFixed(2)}% acumulado)</li>`).join('')}
                    </ul>
                </div><hr>
            `;
        } else {
            reportHtml += `<p>Nenhum dado de Pareto encontrado. Por favor, preencha a seção "Execução e Verificação" e gere o gráfico.</p><hr>`;
        }

        // 5. Coleta dados de Ações Corretivas (ACT)
        const acoesData = localStorage.getItem('pdca-acoes');
        if (acoesData) {
            reportHtml += `
                <div class="relatorio-acoes">
                    <h3>5. Ações Corretivas e Padronização (Act)</h3>
                    <p>${acoesData}</p>
                </div><hr>
            `;
        } else {
            reportHtml += `<p>Nenhuma ação corretiva ou padronização registrada. Por favor, preencha a seção "Execução e Verificação".</p><hr>`;
        }


        relatorioContent.innerHTML = reportHtml;
        printReportBtn.style.display = 'inline-block';
        generateFullReportBtn.style.display = 'none';
    });

    printReportBtn.addEventListener('click', () => {
        window.print();
    });
});