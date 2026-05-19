import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 1. INICIALIZAÇÃO DO EDITOR
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
        placeholder: 'Cole o seu texto aqui...'
    });
} catch (error) { console.error("Erro Quill.js:", error); }

// 2. LÓGICA DE ABAS (AGORA COM 4 ABAS)
const btnShowForm = document.getElementById("btn-show-form");
const btnShowManage = document.getElementById("btn-show-manage");
const btnShowDash = document.getElementById("btn-show-dash");
const btnShowNotify = document.getElementById("btn-show-notify");

const adminFormSection = document.getElementById("admin-form-section");
const adminManageSection = document.getElementById("admin-manage-section");
const adminDashSection = document.getElementById("admin-dash-section");
const adminNotifySection = document.getElementById("admin-notify-section");

function switchTab(activeBtn, activeSection) {
    [btnShowForm, btnShowManage, btnShowDash, btnShowNotify].forEach(btn => btn.className = "btn-secondary");
    // Mantém a cor original do botão de notificação quando não ativo
    btnShowNotify.style.backgroundColor = "white"; 
    btnShowNotify.style.color = "#0f172a";

    [adminFormSection, adminManageSection, adminDashSection, adminNotifySection].forEach(sec => sec.classList.add("hidden"));
    
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


// 3. DISPARO DE NOTIFICAÇÕES PUSH
const btnSendPush = document.getElementById("btn-send-push");
const pushTitle = document.getElementById("push-title");
const pushBody = document.getElementById("push-body");
const pushStatusMsg = document.getElementById("push-status-msg");

if(btnSendPush) {
    btnSendPush.addEventListener("click", async () => {
        const titulo = pushTitle.value.trim();
        const mensagem = pushBody.value.trim();

        if(!titulo || !mensagem) {
            pushStatusMsg.style.color = "#ef4444";
            pushStatusMsg.textContent = "Preencha o título e a mensagem.";
            return;
        }

        btnSendPush.disabled = true;
        btnSendPush.textContent = "A enviar...";
        pushStatusMsg.textContent = "";

        try {
            const resposta = await fetch('/api/notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo, mensagem })
            });

            const dados = await resposta.json();

            if (resposta.ok && dados.success !== false) {
                pushStatusMsg.style.color = "#10b981";
                pushStatusMsg.textContent = dados.message;
                pushTitle.value = "";
                pushBody.value = "";
            } else {
                pushStatusMsg.style.color = "#f59e0b";
                pushStatusMsg.textContent = dados.message || dados.error;
            }
        } catch (error) {
            pushStatusMsg.style.color = "#ef4444";
            pushStatusMsg.textContent = "Erro crítico ao contactar a Vercel.";
            console.error(error);
        } finally {
            btnSendPush.disabled = false;
            btnSendPush.textContent = "🚀 Enviar para Todos";
        }
    });
}

// 4. GESTÃO DE ARTIGOS (CRUD MANTIDO)
const manageList = document.getElementById("manage-list");
let memoriaPosts = {}; 

async function carregarGerenciamento() {
    manageList.innerHTML = "<p style='text-align:center;'>Buscando artigos...</p>";
    try {
        const q = query(collection(db, "posts"), orderBy("dataCriacao", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) { manageList.innerHTML = "<p style='text-align:center;'>Nenhum artigo publicado.</p>"; return; }

        let html = "";
        memoriaPosts = {}; 

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            memoriaPosts[id] = data; 
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
    } catch (error) { manageList.innerHTML = "<p style='color:red;'>Erro ao carregar artigos.</p>"; }
}

manageList.addEventListener("click", async (e) => {
    const btn = e.target;
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");

    if (!action || !id) return;

    if (action === "delete") {
        if (confirm("Tem certeza que deseja EXCLUIR este artigo?")) {
            btn.textContent = "A apagar...";
            try {
                await deleteDoc(doc(db, "posts", id));
                carregarGerenciamento(); 
            } catch (error) { alert("Erro: " + error.message); btn.textContent = "Excluir"; }
        }
    }

    if (action === "edit") {
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

// 5. SALVAR/EDITAR POSTS
const formPost = document.getElementById("form-post");
document.getElementById("btn-cancel-edit").addEventListener("click", () => {
    document.getElementById("edit-post-id").value = "";
    document.getElementById("titulo").value = "";
    document.getElementById("categoria").value = "";
    quill.root.innerHTML = "";
    document.getElementById("form-title").textContent = "Criar Novo Post";
    document.getElementById("btn-submit-post").textContent = "Publicar Artigo";
    document.getElementById("btn-cancel-edit").classList.add("hidden");
});

if(formPost) {
    formPost.addEventListener("submit", async (e) => {
        e.preventDefault(); 
        const editId = document.getElementById("edit-post-id").value;
        const titulo = document.getElementById("titulo").value;
        const categoria = document.getElementById("categoria").value;
        const conteudoFormatado = quill.root.innerHTML;
        
        if (!categoria) return alert("Selecione uma categoria.");
        const btnSubmit = document.getElementById("btn-submit-post");
        btnSubmit.disabled = true; btnSubmit.textContent = "A salvar...";

        try {
            if (editId) {
                await updateDoc(doc(db, "posts", editId), { titulo, categoria, conteudoFormatado });
            } else {
                await addDoc(collection(db, "posts"), { titulo, categoria, conteudo: conteudoFormatado, dataCriacao: new Date().toISOString() });
            }
            document.getElementById("status-msg").classList.remove("hidden");
            document.getElementById("btn-cancel-edit").click(); // Reseta
            setTimeout(() => { document.getElementById("status-msg").classList.add("hidden"); }, 3000);
        } catch (error) { alert(`Erro: ${error.message}`); } 
        finally { btnSubmit.disabled = false; btnSubmit.textContent = editId ? "Atualizar Artigo" : "Publicar Artigo"; }
    });
}

// 6. DASHBOARD
const dashList = document.getElementById("dash-list");
async function carregarDashboard() {
    if (!dashList) return;
    dashList.innerHTML = "<p style='text-align:center;'>A procurar perguntas...</p>";
    try {
        const q = query(collection(db, "interacoes"), orderBy("data", "desc"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) { dashList.innerHTML = "<p style='text-align:center;'>Nenhuma pergunta.</p>"; return; }
        let html = "";
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const cat = data.categoria ? data.categoria.toUpperCase() : "GERAL";
            let dataFormatada = data.data ? new Date(data.data).toLocaleString('pt-BR') : "";
            html += `
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <span style="font-size: 0.7rem; background: #0f172a; color: white; padding: 4px 10px; border-radius: 12px;">${cat}</span>
                <p style="font-weight: bold; margin-top:10px;">"${data.pergunta}"</p>
            </div>`;
        });
        dashList.innerHTML = html;
    } catch (error) { dashList.innerHTML = `<p style='color:red;'>Erro: ${error.message}</p>`; }
}
