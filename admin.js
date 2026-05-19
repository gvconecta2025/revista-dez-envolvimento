import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// =========================================================================
// 1. INICIALIZAÇÃO DO EDITOR DE TEXTOS
// =========================================================================
var quill = new Quill('#editor-container', {
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

// =========================================================================
// 2. LÓGICA DE ALTERNÂNCIA DE ABAS (Formulário vs Dashboard)
// =========================================================================
const btnShowForm = document.getElementById("btn-show-form");
const btnShowDash = document.getElementById("btn-show-dash");
const adminFormSection = document.getElementById("admin-form-section");
const adminDashSection = document.getElementById("admin-dash-section");

if (btnShowForm && btnShowDash) {
    btnShowForm.addEventListener("click", () => {
        adminFormSection.classList.remove("hidden");
        adminDashSection.classList.add("hidden");
        btnShowForm.className = "btn-primary";
        btnShowDash.className = "btn-secondary";
    });

    btnShowDash.addEventListener("click", () => {
        adminDashSection.classList.remove("hidden");
        adminFormSection.classList.add("hidden");
        btnShowDash.className = "btn-primary";
        btnShowForm.className = "btn-secondary";
        carregarDashboard(); // Aciona a busca no banco de dados
    });
}

// =========================================================================
// 3. LÓGICA DO DASHBOARD ANALÍTICO (O "Raio-X")
// =========================================================================
const dashList = document.getElementById("dash-list");

async function carregarDashboard() {
    dashList.innerHTML = "<p style='text-align:center;'>Buscando perguntas dos pais...</p>";
    
    try {
        // Puxa da coleção "interacoes", ordenado da mais recente para a mais antiga
        const q = query(collection(db, "interacoes"), orderBy("data", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            dashList.innerHTML = "<p style='text-align:center; color: #64748b;'>Nenhuma pergunta registrada ainda. Quando um pai interagir com a IA, aparecerá aqui.</p>";
            return;
        }

        let html = "";
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const cat = data.categoria ? data.categoria.toUpperCase() : "GERAL";
            const dataFormatada = new Date(data.data).toLocaleString('pt-BR');

            // Cria um cartão de leitura rápida para cada pergunta feita
            html += `
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                    <span style="font-size: 0.7rem; font-weight: bold; background: #0f172a; color: white; padding: 4px 10px; border-radius: 12px;">${cat}</span>
                    <span style="font-size: 0.75rem; color: #64748b;">${dataFormatada}</span>
                </div>
                
                <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 5px;">A Dúvida do Pai/Mãe:</p>
                <p style="font-weight: bold; color: #0f172a; font-size: 1.05rem; margin-bottom: 15px;">"${data.pergunta}"</p>
                
                <details style="font-size: 0.9rem; color: #334155; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <summary style="cursor: pointer; font-weight: 600; color: #10b981; outline: none;">Ver como a IA respondeu</summary>
                    <p style="margin-top: 10px; line-height: 1.6; border-top: 1px dashed #cbd5e1; padding-top: 10px;">${data.respostaIA}</p>
                </details>
            </div>`;
        });

        dashList.innerHTML = html;

    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        dashList.innerHTML = "<p style='color: #ef4444; text-align:center;'>Erro de permissão ou falha ao buscar os dados. Verifique o banco.</p>";
    }
}

// =========================================================================
// 4. LÓGICA DE SALVAMENTO DE NOVOS POSTS (Mantida Intacta)
// =========================================================================
const formPost = document.getElementById("form-post");
const statusMsg = document.getElementById("status-msg");

if(formPost) {
    formPost.addEventListener("submit", async (e) => {
        e.preventDefault(); 
        
        const titulo = document.getElementById("titulo").value;
        const categoria = document.getElementById("categoria").value;
        
        if (!categoria) {
            alert("Por favor, selecione uma Trilha de Capacitação (Categoria) antes de publicar.");
            return;
        }

        const conteudoFormatado = quill.root.innerHTML;
        
        if (quill.getText().trim().length === 0 && !conteudoFormatado.includes('<img')) {
            alert("O conteúdo do post não pode estar vazio.");
            return;
        }
        
        const btnSubmit = formPost.querySelector("button");
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Salvando...";

        try {
            const docRef = await addDoc(collection(db, "posts"), {
                titulo: titulo,
                categoria: categoria,
                conteudo: conteudoFormatado,
                dataCriacao: new Date().toISOString()
            });
            
            statusMsg.classList.remove("hidden");
            
            document.getElementById("titulo").value = "";
            document.getElementById("categoria").value = ""; 
            quill.setContents([]); 
            
            setTimeout(() => { statusMsg.classList.add("hidden"); }, 3000);
            
        } catch (error) {
            console.error("Erro ao salvar post: ", error);
            alert("Erro ao salvar. Verifique se as imagens não são muito grandes.");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Publicar Artigo";
        }
    });
}
