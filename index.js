// URL do Google Apps Script configurada
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzavzMJiuJAgZEoixPnSWQPSz-_XwE2bZgWKznjAt3b0XK9d4uiOE6n6oBhWXw2JFn5hw/exec";

let setorCount = 0;
let dataSelecionada = new Date();

/* ---------------- SETORES COMUNS ---------------- */
const setoresComuns = [
    "RM HOSPITAL",
    "TC HOSPITAL",
    "USG HOSPITAL",
    "RM ANEXO 1 DE",
    "RM ANEXO 2 DE",
    "RM ANEXO 3 DE",
    "TC ANEXO DE",
    "USG ANEXO DE"
];

if (!localStorage.getItem("setoresSalvos")) {
    localStorage.setItem("setoresSalvos", JSON.stringify(setoresComuns));
}

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

/* ---------------- SETORES ---------------- */
function adicionarSetor() {
    setorCount++;
    const container = document.getElementById("setoresContainer");
    if (!container) return;

    const setorDiv = document.createElement("div");
    setorDiv.className = "setor";
    setorDiv.id = "setor-" + setorCount;

    let html = '<div class="setor-info">';
    html += '<label><strong>Setor:</strong></label>';
    html += '<input type="text" class="input-setor" placeholder="Nome do setor" list="setoresList" onchange="salvarSetor(this.value)">';
    html += '<div class="setor-horarios">';
    html += '<label>Entrada: <input type="time" class="input-entrada"></label>';
    html += '<label>Saída: <input type="time" class="input-saida"></label>';
    html += '</div></div>';
    html += '<div class="nomesContainer" id="nomes-' + setorCount + '"></div>';
    html += '<div style="display:flex; gap:8px; margin-top:10px;">';
    html += '<button onclick="adicionarNome(' + setorCount + ')">+ Adicionar Nome</button>';
    if (setorCount > 1) {
        html += '<button class="repetir" onclick="repetirNomes(' + setorCount + ')">↻ Repetir Nomes</button>';
    }
    html += '</div>';

    setorDiv.innerHTML = html;
    container.appendChild(setorDiv);
    adicionarNome(setorCount);
}

/* ---------------- NOMES ---------------- */
function adicionarNome(setorId, valor) {
    if (!valor) valor = "";
    const container = document.getElementById("nomes-" + setorId);
    if (!container) return;

    const div = document.createElement("div");
    div.className = "nome-proc";

    div.innerHTML = '<input type="text" class="input-nome" placeholder="Nome e Sobrenome" list="nomesSalvosList" value="' + valor + '" onchange="salvarNome(this.value)">' +
                    '<input type="number" class="input-proc" placeholder="Qtd" min="0">';

    container.appendChild(div);
}

function repetirNomes(setorId) {
    const primeiro = document.querySelector("#setor-1 .nomesContainer");
    if (!primeiro) return;

    const nomes = primeiro.querySelectorAll(".nome-proc");
    const container = document.getElementById("nomes-" + setorId);
    if (!container) return;

    container.innerHTML = "";

    nomes.forEach(function(n) {
        const nome = n.querySelector(".input-nome").value.trim().toUpperCase();
        if (nome) adicionarNome(setorId, nome);
    });
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

/* ---------------- LOCALSTORAGE ---------------- */
function salvarNome(nome) {
    const nomeLimpo = formatarCaixaAlta(nome);
    if (!nomeLimpo) return;

    let lista = JSON.parse(localStorage.getItem("nomesSalvos")) || [];
    if (!lista.includes(nomeLimpo)) {
        lista.push(nomeLimpo);
        localStorage.setItem("nomesSalvos", JSON.stringify(lista));
        atualizarDatalist("nomesSalvos", "nomesSalvosList");
    }
}

function salvarSetor(nome) {
    const setorLimpo = formatarCaixaAlta(nome);
    if (!setorLimpo) return;

    let lista = JSON.parse(localStorage.getItem("setoresSalvos")) || [];
    if (!lista.includes(setorLimpo)) {
        lista.push(setorLimpo);
        localStorage.setItem("setoresSalvos", JSON.stringify(lista));
        atualizarDatalist("setoresSalvos", "setoresList");
    }
}

function carregarNomesSalvos() {
    atualizarDatalist("nomesSalvos", "nomesSalvosList");
}

function carregarSetoresSalvos() {
    atualizarDatalist("setoresSalvos", "setoresList");
}

function atualizarDatalist(key, id) {
    const lista = JSON.parse(localStorage.getItem(key)) || [];
    const dl = document.getElementById(id);
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

    setoresDivs.forEach(function(setor) {
        const inputSetor = setor.querySelector(".input-setor");
        if (!inputSetor) return;

        const nomeSetor = formatarCaixaAlta(inputSetor.value);
        if (!nomeSetor) return;

        const entradaVal = setor.querySelector(".input-entrada") ? setor.querySelector(".input-entrada").value : "";
        const saidaVal = setor.querySelector(".input-saida") ? setor.querySelector(".input-saida").value : "";

        const nomesDivs = setor.querySelectorAll(".nome-proc");
        const funcionarios = [];

        nomesDivs.forEach(function(n) {
            const rawNome = n.querySelector(".input-nome").value;
            const nomeFormatado = formatarCaixaAlta(rawNome);
            const qtd = parseInt(n.querySelector(".input-proc").value);

            if (rawNome.trim().length > 0) {
                if (!validarNomeSobrenome(nomeFormatado)) {
                    dados.errosValidacao.push('O funcionário "' + rawNome.trim() + '" precisa conter NOME e SOBRENOME.');
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
        alert("Preencha pelo menos um setor com funcionários (Nome + Sobrenome) e quantidades de exames.");
        return;
    }

    let texto = "📅 Data: " + dados.data + "\n\n";

    dados.setores.forEach(function(setor) {
        let totalSetor = 0;
        let infoHorario = (setor.entrada || setor.saida) ? " (" + (setor.entrada || '--:--') + " às " + (setor.saida || '--:--') + ")" : '';
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
