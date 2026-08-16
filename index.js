// URL do Google Apps Script configurada
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzavzMJiuJAgZEoixPnSWQPSz-_XwE2bZgWKznjAt3b0XK9d4uiOE6n6oBhWXw2JFn5hw/exec";

let setorCount = 0;
let dataSelecionada = new Date();

/* ---------------- SETORES PRÉ-DEFINIDOS (FIXOS) ---------------- */
const setoresComuns = [
    "RESSONÂNCIA HOSPITAL",
    "RESSONÂNCIA EXPLORER",
    "RESSONÂNCIA VICTOR",
    "RESSONÂNCIA 3T",
    "TOMOGRAFIA HOSPITAL",
    "TOMOGRAFIA ANEXO",
    "ULTRASON HOSPITAL",
    "ULTRASON ANEXO"
];

/* ---------------- FUNÇÕES DE ARMAZENAMENTO SEGURO ---------------- */
function getStorage(key) {
    try {
        return localStorage.getItem(key) || "";
    } catch (e) {
        return "";
    }
}

function setStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn("Não foi possível salvar no localStorage:", e);
    }
}

/* ---------------- MAPEAMENTO DE TURNOS ---------------- */
const mapaTurnos = {
    "MANHA": { entrada: "07:00", saida: "13:00" },
    "TARDE": { entrada: "13:00", saida: "19:00" },
    "MANHA_TARDE": { entrada: "07:00", saida: "19:00" },
    "NOITE": { entrada: "19:00", saida: "07:00" },
    "COMERCIAL": { entrada: "08:00", saida: "17:00" }
};

/* ---------------- INICIALIZAÇÃO ---------------- */
function init() {
    atualizarDataTitulo();
    carregarNomesSalvos();
    carregarSetoresSalvos();

    const container = document.getElementById("setoresContainer");
    if (container) {
        container.innerHTML = "";
    }

    adicionarSetor();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

/* ---------------- DATA ---------------- */
function atualizarDataTitulo() {
    const dataFormatada = dataSelecionada.toLocaleDateString("pt-BR");
    const elData = document.getElementById("dataHoje");
    if (elData) {
        elData.innerText = "📅 Data: " + dataFormatada;
    }
}

function alternarData() {
    document.getElementById("inputData").style.display = "inline-block";
    document.getElementById("btnConfirmarData").style.display = "inline-block";
    document.getElementById("btnAlterarData").style.display = "none";
}

function confirmarData() {
    const valor = document.getElementById("inputData").value;
    if (!valor) return;
    dataSelecionada = new Date(valor + "T00:00:00");
    atualizarDataTitulo();

    document.getElementById("inputData").style.display = "none";
    document.getElementById("btnConfirmarData").style.display = "none";
    document.getElementById("btnAlterarData").style.display = "inline-block";
}

/* ---------------- SETORES E TURNOS ---------------- */
function adicionarSetor() {
    // Coleta os nomes preenchidos no setor anterior para pré-preenchimento
    const ultimosNomes = [];
    const setoresExistentes = document.querySelectorAll(".setor");
    if (setoresExistentes.length > 0) {
        const ultimoSetor = setoresExistentes[setoresExistentes.length - 1];
        const inputsNome = ultimoSetor.querySelectorAll(".input-nome");
        inputsNome.forEach(input => {
            const val = input.value.trim().toUpperCase();
            if (val) {
                ultimosNomes.push(val);
            }
        });
    }

    setorCount++;
    const container = document.getElementById("setoresContainer");
    if (!container) return;

    const ultimoTurno = getStorage("ultimoTurno");
    const ultimaEntrada = getStorage("ultimaEntrada");
    const ultimaSaida = getStorage("ultimaSaida");

    const setorDiv = document.createElement("div");
    setorDiv.className = "setor";
    setorDiv.id = "setor-" + setorCount;

    setorDiv.innerHTML = `
        <div class="setor-info">
            <label><strong>Setor*:</strong></label>
            <input type="text" class="input-setor" placeholder="Pesquise e selecione o setor..." list="setoresList" required onchange="validarSetorDigitado(this)">
            
            <div class="setor-horarios">
                <label>Turno: 
                    <select class="select-turno" onchange="selecionarTurno(this)">
                        <option value="">-- Selecione --</option>
                        <option value="MANHA" ${ultimoTurno === "MANHA" ? 'selected' : ''}>Manhã</option>
                        <option value="TARDE" ${ultimoTurno === "TARDE" ? 'selected' : ''}>Tarde</option>
                        <option value="MANHA_TARDE" ${ultimoTurno === "MANHA_TARDE" ? 'selected' : ''}>Manhã e Tarde</option>
                        <option value="NOITE" ${ultimoTurno === "NOITE" ? 'selected' : ''}>Noite</option>
                        <option value="COMERCIAL" ${ultimoTurno === "COMERCIAL" ? 'selected' : ''}>Comercial</option>
                    </select>
                </label>

                <label>Entrada*: <input type="time" class="input-entrada" value="${ultimaEntrada}" required onchange="salvarHorariosSalvos(this)"></label>
                <label>Saída*: <input type="time" class="input-saida" value="${ultimaSaida}" required onchange="salvarHorariosSalvos(this)"></label>
            </div>
        </div>

        <div class="nomesContainer" id="nomes-${setorCount}"></div>

        <div style="display:flex; gap:8px; margin-top:10px;">
            <button type="button" onclick="adicionarNome(${setorCount})">+ Adicionar Nome</button>
        </div>
    `;

    container.appendChild(setorDiv);

    if (ultimosNomes.length > 0) {
        ultimosNomes.forEach(nome => adicionarNome(setorCount, nome));
    } else {
        adicionarNome(setorCount);
    }
}

function validarSetorDigitado(inputEl) {
    const valorDigitado = formatarCaixaAlta(inputEl.value);
    if (!valorDigitado) return;

    if (!setoresComuns.includes(valorDigitado)) {
        alert("⚠️ Setor inválido!\n\nPor favor, selecione um dos setores pré-definidos da lista.");
        inputEl.value = "";
    } else {
        inputEl.value = valorDigitado;
    }
}

function selecionarTurno(selectEl) {
    const valorTurno = selectEl.value;
    const setorDiv = selectEl.closest(".setor");
    if (!setorDiv) return;

    const inputEntrada = setorDiv.querySelector(".input-entrada");
    const inputSaida = setorDiv.querySelector(".input-saida");

    if (mapaTurnos[valorTurno]) {
        const entrada = mapaTurnos[valorTurno].entrada;
        const saida = mapaTurnos[valorTurno].saida;

        if (inputEntrada) inputEntrada.value = entrada;
        if (inputSaida) inputSaida.value = saida;

        setStorage("ultimoTurno", valorTurno);
        setStorage("ultimaEntrada", entrada);
        setStorage("ultimaSaida", saida);
    }
}

function salvarHorariosSalvos(inputEl) {
    const setorDiv = inputEl.closest(".setor");
    if (!setorDiv) return;

    const inputEntrada = setorDiv.querySelector(".input-entrada");
    const inputSaida = setorDiv.querySelector(".input-saida");

    if (inputEntrada && inputEntrada.value) {
        setStorage("ultimaEntrada", inputEntrada.value);
    }
    if (inputSaida && inputSaida.value) {
        setStorage("ultimaSaida", inputSaida.value);
    }
}

/* ---------------- NOMES ---------------- */
function adicionarNome(setorId, valor = "") {
    const container = document.getElementById("nomes-" + setorId);
    if (!container) return;

    const div = document.createElement("div");
    div.className = "nome-proc";

    div.innerHTML = `
        <input type="text" class="input-nome" placeholder="Nome e Sobrenome" list="nomesSalvosList" value="${valor}" onchange="salvarNome(this.value)">
        <input type="number" class="input-proc" placeholder="Qtd" min="0">
        <button type="button" class="btn-deletar-nome" onclick="removerNome(this)" title="Excluir funcionário">🗑️</button>
    `;

    container.appendChild(div);
}

function removerNome(btnEl) {
    const row = btnEl.closest(".nome-proc");
    if (row) {
        row.remove();
    }
}

/* ---------------- TRATAMENTO DE TEXTO ---------------- */
function formatarCaixaAlta(texto) {
    if (!texto) return "";
    return texto.trim().replace(/\s+/g, ' ').toUpperCase();
}

function validarNomeSobrenome(nome) {
    const partes = nome.split(" ");
    return partes.length >= 2 && partes.every(function(p) { return p.length >= 2; });
}

/* ---------------- LISTA DE SUGESTÕES E ARMAZENAMENTO ---------------- */
function salvarNome(nome) {
    const nomeLimpo = formatarCaixaAlta(nome);
    if (!nomeLimpo) return;

    let lista = [];
    try {
        lista = JSON.parse(getStorage("nomesSalvos")) || [];
    } catch (e) {
        lista = [];
    }

    if (!lista.includes(nomeLimpo)) {
        lista.push(nomeLimpo);
        setStorage("nomesSalvos", JSON.stringify(lista));
        atualizarDatalistNomes();
    }
}

function carregarNomesSalvos() {
    atualizarDatalistNomes();
}

function carregarSetoresSalvos() {
    const dl = document.getElementById("setoresList");
    if (!dl) return;

    dl.innerHTML = "";
    setoresComuns.forEach(function(setor) {
        const option = document.createElement("option");
        option.value = setor;
        dl.appendChild(option);
    });
}

function atualizarDatalistNomes() {
    let lista = [];
    try {
        lista = JSON.parse(getStorage("nomesSalvos")) || [];
    } catch (e) {
        lista = [];
    }

    const dl = document.getElementById("nomesSalvosList");
    if (!dl) return;

    dl.innerHTML = "";
    lista.forEach(function(v) {
        const o = document.createElement("option");
        o.value = v;
        dl.appendChild(o);
    });
}

/* ---------------- ESTRUTURA DOS DADOS ---------------- */
function extrairDadosFormulario() {
    const obsEl = document.getElementById("observacoes");
    const dados = {
        data: dataSelecionada.toLocaleDateString("pt-BR"),
        observacoes: obsEl ? obsEl.value.trim() : "",
        setores: [],
        errosValidacao: []
    };

    const setoresDivs = document.querySelectorAll(".setor");

    setoresDivs.forEach(function(setor, index) {
        const inputSetor = setor.querySelector(".input-setor");
        if (!inputSetor) return;

        const nomeSetor = formatarCaixaAlta(inputSetor.value);

        // VALIDAÇÃO DE SETOR OBRIGATÓRIO
        if (!nomeSetor) {
            dados.errosValidacao.push(`O Setor ${index + 1} está com o NOME em branco. Por favor, selecione um setor.`);
            return;
        }

        if (!setoresComuns.includes(nomeSetor)) {
            dados.errosValidacao.push('O setor "' + nomeSetor + '" não faz parte da lista de setores oficiais da clínica.');
            return;
        }

        const entradaVal = setor.querySelector(".input-entrada") ? setor.querySelector(".input-entrada").value : "";
        const saidaVal = setor.querySelector(".input-saida") ? setor.querySelector(".input-saida").value : "";

        if (!entradaVal || !saidaVal) {
            dados.errosValidacao.push('O setor "' + nomeSetor + '" precisa ter os horários de ENTRADA e SAÍDA preenchidos.');
        }

        const nomesDivs = setor.querySelectorAll(".nome-proc");
        const funcionarios = [];

        nomesDivs.forEach(function(n) {
            const rawNome = n.querySelector(".input-nome").value;
            const nomeFormatado = formatarCaixaAlta(rawNome);
            const qtd = parseInt(n.querySelector(".input-proc").value);

            if (rawNome.trim().length > 0) {
                if (!validarNomeSobrenome(nomeFormatado)) {
                    dados.errosValidacao.push('O funcionário "' + rawNome.trim() + '" no setor ' + nomeSetor + ' precisa conter NOME e SOBRENOME.');
                } else if (qtd > 0) {
                    funcionarios.push({ 
                        nome: nomeFormatado, 
                        qtd: qtd,
                        entrada: entradaVal,
                        saida: saidaVal
                    });
                }
            }
        });

        if (funcionarios.length > 0) {
            dados.setores.push({
                nome: nomeSetor,
                entrada: entradaVal,
                saida: saidaVal,
                funcionarios: funcionarios
            });
        }
    });

    return dados;
}

/* ---------------- RELATÓRIO ---------------- */
function gerarRelatorio() {
    const dados = extrairDadosFormulario();

    if (dados.errosValidacao.length > 0) {
        alert("⚠️ ATENÇÃO:\n\n" + dados.errosValidacao.join("\n") + "\n\nPor favor, corrija para continuar.");
        return;
    }

    if (dados.setores.length === 0) {
        alert("Preencha pelo menos um setor válido com funcionários (Nome + Sobrenome) e quantidades de exames.");
        return;
    }

    let texto = "📅 Data: " + dados.data + "\n\n";

    dados.setores.forEach(function(setor) {
        let totalSetor = 0;
        let infoHorario = " (" + setor.entrada + " às " + setor.saida + ")";
        let bloco = "*Setor: " + setor.nome + infoHorario + "*\n";

        setor.funcionarios.forEach(function(f) {
            bloco += "- " + f.nome + ": " + f.qtd + " Exames\n";
            totalSetor += f.qtd;
        });

        bloco += "*Total: " + totalSetor + " Exames*\n\n";
        texto += bloco;
    });

    if (dados.observacoes) {
        texto += "*📝 Observações:*\n*" + dados.observacoes + "*\n\n";
    }

    const relatorioEl = document.getElementById("relatorio");
    if (relatorioEl) {
        relatorioEl.innerText = texto.trim();
        relatorioEl.style.display = "block";
    }

    const acoesEl = document.getElementById("acoesRelatorio");
    if (acoesEl) {
        acoesEl.style.display = "flex";
    }
}

/* ---------------- ENVIAR WHATSAPP ---------------- */
function enviarParaWhatsApp() {
    const relatorio = encodeURIComponent(document.getElementById("relatorio").innerText);
    const url = "https://wa.me/?text=" + relatorio;
    window.open(url, "_blank");
}

/* ---------------- ENVIAR GOOGLE SHEETS ---------------- */
async function enviarParaGoogleSheets() {
    if (!GOOGLE_SCRIPT_URL) {
        alert("Por favor, configure a URL do seu Google Apps Script!");
        return;
    }

    const dados = extrairDadosFormulario();

    if (dados.errosValidacao.length > 0) {
        alert("⚠️ ATENÇÃO:\n\n" + dados.errosValidacao.join("\n") + "\n\nPor favor, corrija antes de salvar.");
        return;
    }

    const btnPlanilha = document.getElementById("btnEnviarPlanilha");

    try {
        btnPlanilha.disabled = true;
        btnPlanilha.innerText = "⏳ Enviando dados...";

        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        alert("✅ Dados salvos na planilha com sucesso!");
    } catch (error) {
        console.error("Erro ao enviar:", error);
        alert("❌ Ocorreu um erro ao salvar na planilha. Tente novamente.");
    } finally {
        btnPlanilha.disabled = false;
        btnPlanilha.innerText = "📊 Salvar no Google Sheets";
    }
}
