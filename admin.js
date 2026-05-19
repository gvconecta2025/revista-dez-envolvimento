import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

console.log("DEZ-ENVOLVE: admin.js carregado com sucesso.");

// =========================================================================
// 1. INICIALIZAÇÃO DO EDITOR DE TEXTO (Quill)
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
        placeholder: 'Escreva o conteúdo do post aqui...'
    });
} catch (error) {
    console.error("Erro na inicialização do Quill:", error);
}

// =========================================================================
// 2. SISTEMA DE NAVEGAÇÃO DE ABAS
// =========================================================================
const btnShowForm = document.getElementById("btn-show-form");
const btnShowManage = document.getElementById("btn-show-manage");
const btnShowDash = document.getElementById("btn-show-dash");
const btnShowNotify = document.getElementById("btn-show-notify");

const adminFormSection = document.getElementById("admin-form-section");
const adminManageSection = document.getElementById("admin-manage-section");
const adminDashSection = document.getElementById("admin-dash-section");
const adminNotifySection = document.getElementById("admin-notify-section");

function switchTab(activeBtn, activeSection) {
    // Resetar estilos dos botões
    [btnShowForm, btnShowManage, btnShowDash, btnShowNotify].forEach(btn => {
        btn.className = "btn-secondary";
        btn.style.backgroundColor = "";
        btn.style.color = "";
    });
    
    // Ocultar seções
    [adminFormSection, adminManageSection, adminDashSection, adminNotifySection].forEach(sec => sec.classList.add("hidden"));
    
    // Ativar botão e seção
    activeBtn.className = "btn-primary";
    if(activeBtn === btnShowNotify) {
        activeBtn.style.backgroundColor = "#10b981";
        activeBtn.style.color = "white";
    }
    activeSection.classList.remove("hidden");
}

btnShowForm.addEventListener("click", () => switchTab(btnShowForm, adminFormSection));
btnShowManage.addEventListener("click", () => { switchTab(btnShowManage, adminManageSection); carregarGerenciamento(); });
btnShowDash.addEventListener("click", () => { switchTab(btnShowDash, adminDashSection); carregarDashboard(); });
btnShowNotify.addEventListener("click", () => switchTab(btnShowNotify, adminNotifySection));

// =========================================================================
// 3. GESTÃO DE ARTIGOS (CRUD)
// =========================================================================
const manageList = document.getElementById("manage-list");
let memoriaPosts = {}; 

async function carregarGerenciamento() {
    manageList.innerHTML = "<p style='text-align:center;'>A carregar artigos...</p>";
    try {
        const q = query(collection(db, "posts"), orderBy("dataCriacao", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) { manageList.innerHTML = "<p style='text-align:center;'>Nenhum artigo encontrado.</p>"; return; }

        let html = "";
        memoriaPosts = {}; 

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            memoriaPosts[id] = data; 
            const dataFormatada = new Date(data.dataCriacao).toLocaleDateString('pt-BR');
            const cat = data.categoria ? data.categoria.toUpperCase() : "GERAL";

            html += `
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div>
                    <span style="font-size: 0.7rem; background: #e2e8f0; padding: 3px 8px; border-radius: 12px;">${cat}</span>
                    <h3 style="font-size: 1rem;">${data.titulo}</h3>
                </div>
                <div>
                    <button data-action="edit" data-id="${id}" style="background: #3b82f6; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Editar</button>
                    <button data-action="delete" data-id="${id}" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Excluir</button>
                </div>
            </div>`;
        });
        manageList.innerHTML = html;
    } catch (e) { manageList.innerHTML = "<p style='color:red;'>Erro ao carregar.</p>"; }
}

manageList.addEventListener("click", async (e) => {
    const action = e.target.getAttribute("data-action");
    const id = e.target.getAttribute("data-id");
    if (!action || !id) return;

    if (action === "delete") {
        if (confirm("Deseja apagar este artigo?")) {
            await deleteDoc(doc(db, "posts", id));
            carregarGerenciamento();
        }
    } else if (action === "edit") {
        const post = memoriaPosts[id];
        document.getElementById("edit-post-id").value = id;
        document.getElementById("titulo").value = post.titulo;
        document.getElementById("categoria").value = post.categoria;
        quill.root.innerHTML = post.conteudo;
        document.getElementById("form-title").textContent = "A Editar Artigo";
        document.getElementById("btn-submit-post").textContent = "Atualizar Artigo";
        document.getElementById("btn-cancel-edit").classList.remove("hidden");
        switchTab(btnShowForm, adminFormSection);
    }
});

// =========================================================================
// 4. SALVAR / ATUALIZAR
// =========================================================================
const formPost = document.getElementById("form-post");
formPost.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-post-id").value;
    const dados = {
        titulo: document.getElementById("titulo").value,
        categoria: document.getElementById("categoria").value,
        conteudo: quill.root.innerHTML,
        dataCriacao: new Date().toISOString()
    };
    
    if (id) {
        await updateDoc(doc(db, "posts", id), dados);
    } else {
        await addDoc(collection(db, "posts"), dados);
    }
    document.getElementById("status-msg").classList.remove("hidden");
    resetarFormulario();
});

function resetarFormulario() {
    document.getElementById("edit-post-id").value = "";
    document.getElementById("titulo").value = "";
    document.getElementById("categoria").value = "";
    quill.root.innerHTML = "";
    document.getElementById("form-title").textContent = "Criar Novo Post";
    document.getElementById("btn-submit-post").textContent = "Publicar";
    document.getElementById("btn-cancel-edit").classList.add("hidden");
}

document.getElementById("btn-cancel-edit").addEventListener("click", resetarFormulario);

// =========================================================================
// 5. DISPARAR NOTIFICAÇÃO PUSH
// =========================================================================
document.getElementById("btn-send-push").addEventListener("click", async () => {
    const titulo = document.getElementById("push-title").value;
    const mensagem = document.getElementById("push-body").value;
    const status = document.getElementById("push-status-msg");
    
    status.textContent = "A enviar...";
    try {
        const res = await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo, mensagem })
        });
        const data = await res.json();
        status.textContent = data.message || data.error;
    } catch (e) { status.textContent = "Erro na conexão."; }
});

// =========================================================================
// 6. DASHBOARD
// =========================================================================
async function carregarDashboard() {
    const dashList = document.getElementById("dash-list");
    const q = query(collection(db, "interacoes"), orderBy("data", "desc"));
    const snap = await getDocs(q);
    let html = "";
    snap.forEach(d => {
        const data = d.data();
        html += `<div style="padding:10px; border-bottom:1px solid #eee;"><strong>${data.pergunta}</strong><br><small>${data.respostaIA}</small></div>`;
    });
    dashList.innerHTML = html || "Sem dados.";
}
