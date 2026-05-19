import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

console.log("DEZ-ENVOLVE: admin.js carregado.");

// =========================================================================
// 1. INICIALIZAÇÃO DO EDITOR
// =========================================================================
let quill = null;
try {
    quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'align': [] }],
                ['link', 'image'],
                ['clean']
            ]
        },
        placeholder: 'Cole seu texto com formatação aqui...'
    });
} catch (error) {
    console.error("Erro ao carregar o Quill.js:", error);
}

// =========================================================================
// 2. LÓGICA DE ABAS
// =========================================================================
const btnShowForm = document.getElementById("btn-show-form");
const btnShowManage = document.getElementById("btn-show-manage");
const btnShowDash = document.getElementById("btn-show-dash");

const adminFormSection = document.getElementById("admin-form-section");
const adminManageSection = document.getElementById("admin-manage-section");
const adminDashSection = document.getElementById("admin-dash-section");

function switchTab(activeBtn, activeSection) {
    [btnShowForm, btnShowManage, btnShowDash].forEach(btn => btn.className = "btn-secondary");
    [adminFormSection, adminManageSection, adminDashSection].forEach(sec => sec.classList.add("hidden"));
    
    activeBtn.className = "btn-primary";
    activeSection.classList.remove("hidden");
}

btnShowForm.addEventListener("click", () => switchTab(btnShowForm, adminFormSection));
btnShowManage.addEventListener("click", () => {
    switchTab(btnShowManage, adminManageSection);
    carregarGerenciamento();
});
btnShowDash.addEventListener("click", () => {
    switchTab(btnShowDash, adminDashSection);
    carregarDashboard();
});

// =========================================================================
// 3. GESTÃO DE ARTIGOS (Editar e Excluir)
// =========================================================================
const manageList = document.getElementById("manage-list");
let memoriaPosts = {}; // Guarda os dados para edição rápida

async function carregarGerenciamento() {
    manageList.innerHTML = "<p style='text-align:center;'>Buscando artigos...</p>";
    try {
        const q = query(collection(db, "posts"), orderBy("dataCriacao", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            manageList.innerHTML = "<p style='text-align:center;'>Nenhum artigo publicado ainda.</p>";
            return;
        }

        let html = "";
        memoriaPosts = {}; // Reseta a memória

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            memoriaPosts[id] = data; // Salva na memória

            const dataFormatada = new Date(data.dataCriacao).toLocaleDateString('pt-BR');
            const cat = data.categoria ? data.categoria.toUpperCase() : "GERAL";

            html += `
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div style="flex: 1; min-width: 200px;">
                    <span style="font-size: 0.7rem; background: #e2e8f0; color: #334155; padding: 3px 8px; border-radius: 12px;">${cat} - ${dataFormatada}</span>
                    <h3 style="font-size: 1.1rem; color: #0f172a; margin-top: 5px;">${data.titulo}</h3>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button data-action="edit" data-id="${id}" style="background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">Editar</button>
                    <button data-action="delete" data-id="${id}" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">Excluir</button>
                </div>
            </div>`;
        });
        manageList.innerHTML = html;

    } catch (error) {
        console.error("Erro Gestão:", error);
        manageList.innerHTML = "<p style='color:red; text-align:center;'>Erro ao carregar artigos.</p>";
    }
}

// Escutador de cliques para os botões Editar e Excluir
manageList.addEventListener("click", async (e) => {
    const btn = e.target;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");

    if (!action || !id) return;

    if (action === "delete") {
        const confirmacao = confirm("Tem certeza que deseja EXCLUIR este artigo definitivamente?");
        if (confirmacao) {
            btn.textContent = "Apagando...";
            try {
                await deleteDoc(doc(db, "posts", id));
                carregarGerenciamento(); // Recarrega a lista
            } catch (error) {
                alert("Erro ao excluir: " + error.message);
                btn.textContent = "Excluir";
            }
        }
    }

    if (action === "edit") {
        const post = memoriaPosts[id];
        prepararEdicao(id, post);
    }
});

// =========================================================================
// 4. LÓGICA DE SALVAMENTO (Criar e Atualizar)
// =========================================================================
const formPost = document.getElementById("form-post");
const formTitle = document.getElementById("form-title");
const btnSubmitPost = document.getElementById("btn-submit-post");
const btnCancelEdit = document.getElementById("btn-cancel-edit");
const inputEditId = document.getElementById("edit-post-id");
const statusMsg = document.getElementById("status-msg");

// Função que prepara a tela para editar
function prepararEdicao(id, postData) {
    inputEditId.value = id;
    document.getElementById("titulo").value = postData.titulo;
    document.getElementById("categoria").value = postData.categoria;
    quill.root.innerHTML = postData.conteudo;
    
    formTitle.textContent = "Editando Artigo";
    formTitle.style.color = "#3b82f6";
    btnSubmitPost.textContent = "Atualizar Artigo";
    btnCancelEdit.classList.remove("hidden");
    
    switchTab(btnShowForm, adminFormSection);
}

// Cancela a edição e volta ao modo "Criar"
function resetarFormulario() {
    inputEditId.value = "";
    document.getElementById("titulo").value = "";
    document.getElementById("categoria").value = "";
    quill.root.innerHTML = "";
    
    formTitle.textContent = "Criar Novo Post";
    formTitle.style.color = "#0f172a";
    btnSubmitPost.textContent = "Publicar Artigo";
    btnCancelEdit.classList.add("hidden");
}

btnCancelEdit.addEventListener("click", resetarFormulario);

if(formPost) {
    formPost.addEventListener("submit", async (e) => {
        e.preventDefault(); 
        
        const editId = inputEditId.value;
        const titulo = document.getElementById("titulo").value;
        const categoria = document.getElementById("categoria").value;
        const conteudoFormatado = quill.root.innerHTML;
        
        if (!categoria) return alert("Selecione uma categoria.");
        if (quill.getText().trim().length === 0 && !conteudoFormatado.includes('<img')) return alert("O post não pode estar vazio.");
        
        btnSubmitPost.disabled = true;
        btnSubmitPost.textContent = "Salvando...";

        try {
            if (editId) {
                // ATUALIZAR POST EXISTENTE
                const postRef = doc(db, "posts", editId);
                await updateDoc(postRef, {
                    titulo: titulo,
                    categoria: categoria,
                    conteudo: conteudoFormatado
                    // Não alteramos a data de criação para não bagunçar o feed
                });
                statusMsg.textContent = "Artigo atualizado com sucesso!";
            } else {
                // CRIAR NOVO POST
                await addDoc(collection(db, "posts"), {
                    titulo: titulo,
                    categoria: categoria,
                    conteudo: conteudoFormatado,
                    dataCriacao: new Date().toISOString()
                });
                statusMsg.textContent = "Artigo publicado com sucesso!";
            }
            
            statusMsg.classList.remove("hidden");
            resetarFormulario();
            setTimeout(() => { statusMsg.classList.add("hidden"); }, 3000);
            
        } catch (error) {
            console.error("Erro salvamento:", error);
            alert(`Erro ao salvar: ${error.message}`);
        } finally {
            btnSubmitPost.disabled = false;
            btnSubmitPost.textContent = editId ? "Atualizar Artigo" : "Publicar Artigo";
        }
    });
}

// =========================================================================
// 5. MOTOR DO DASHBOARD ANALÍTICO (Mantido Intacto)
// =========================================================================
const dashList = document.getElementById("dash-list");

async function carregarDashboard() {
    if (!dashList) return;
    dashList.innerHTML = "<p style='text-align:center;'>Buscando perguntas dos pais...</p>";
    try {
        const q = query(collection(db, "interacoes"), orderBy("data", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            dashList.innerHTML = "<p style='text-align:center;'>Nenhuma pergunta registrada.</p>";
            return;
        }

        let html = "";
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const cat = data.categoria ? data.categoria.toUpperCase() : "GERAL";
            let dataFormatada = data.data ? new Date(data.data).toLocaleString('pt-BR') : "";

            html += `
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                    <span style="font-size: 0.7rem; font-weight: bold; background: #0f172a; color: white; padding: 4px 10px; border-radius: 12px;">${cat}</span>
                    <span style="font-size: 0.75rem; color: #64748b;">${dataFormatada}</span>
                </div>
                <p style="font-weight: bold; color: #0f172a; font-size: 1.05rem; margin-bottom: 15px;">"${data.pergunta}"</p>
                <details style="font-size: 0.9rem; background: #f8fafc; padding: 12px; border-radius: 6px;">
                    <summary style="cursor: pointer; color: #10b981; font-weight: bold;">Ver resposta da IA</summary>
                    <p style="margin-top: 10px; white-space: pre-line;">${data.respostaIA}</p>
                </details>
            </div>`;
        });
        dashList.innerHTML = html;
    } catch (error) {
        dashList.innerHTML = `<p style='color:red;'>Erro ao ler Firebase: ${error.message}</p>`;
    }
}
