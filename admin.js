import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

console.log("DEZ-ENVOLVE: admin.js carregado com sucesso.");

// =========================================================================
// 1. INICIALIZAÇÃO DO EDITOR DE TEXTOS (Com Isolamento de Falhas)
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
    console.log("DEZ-ENVOLVE: Editor Quill.js inicializado.");
} catch (error) {
    console.error("DEZ-ENVOLVE CRÍTICO: Falha ao carregar o Quill.js:", error);
}

// =========================================================================
// 2. LÓGICA DE ALTERNÂNCIA DE ABAS (Segura)
// =========================================================================
const btnShowForm = document.getElementById("btn-show-form");
const btnShowDash = document.getElementById("btn-show-dash");
const adminFormSection = document.getElementById("admin-form-section");
const adminDashSection = document.getElementById("admin-dash-section");

if (btnShowForm && btnShowDash && adminFormSection && adminDashSection) {
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
        carregarDashboard(); // Dispara a leitura do Firestore
    });
    console.log("DEZ-ENVOLVE: Sistema de Abas configurado.");
} else {
    console.error("DEZ-ENVOLVE CRÍTICO: Elementos de interface do Admin ausentes no HTML.");
}

// =========================================================================
// 3. MOTOR DO DASHBOARD ANALÍTICO (O "Raio-X" Blindado)
// =========================================================================
const dashList = document.getElementById("dash-list");

async function carregarDashboard() {
    if (!dashList) return;
    dashList.innerHTML = "<p style='text-align:center; color:#64748b;'>Buscando perguntas dos pais no Firebase...</p>";
    
    try {
        console.log("DEZ-ENVOLVE: Solicitando coleção 'interacoes' ao Firestore...");
        const q = query(collection(db, "interacoes"), orderBy("data", "desc"));
        const querySnapshot = await getDocs(q);
        console.log("DEZ-ENVOLVE: Resposta recebida. Registros encontrados:", querySnapshot.size);

        if (querySnapshot.empty) {
            dashList.innerHTML = "<p style='text-align:center; color: #64748b;'>Nenhuma pergunta registrada ainda. Quando um pai interagir com a IA Mentora, os dados aparecerão aqui.</p>";
            return;
        }

        let html = "";
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const cat = data.categoria ? data.categoria.toUpperCase() : "GERAL";
            
            // Tratamento preventivo para datas corrompidas ou ausentes
            let dataFormatada = "Data indisponível";
            if (data.data) {
                try {
                    dataFormatada = new Date(data.data).toLocaleString('pt-BR');
                } catch(e) {
                    console.error("Erro na conversão de data:", e);
                }
            }

            html += `
            <div style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
                    <span style="font-size: 0.7rem; font-weight: bold; background: #0f172a; color: white; padding: 4px 10px; border-radius: 12px;">${cat}</span>
                    <span style="font-size: 0.75rem; color: #64748b;">${dataFormatada}</span>
                </div>
                
                <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 5px;">A Dúvida do Pai/Mãe:</p>
                <p style="font-weight: bold; color: #0f172a; font-size: 1.05rem; margin-bottom: 15px;">"${data.pergunta || 'Sem texto de pergunta'}"</p>
                
                <details style="font-size: 0.9rem; color: #334155; background: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <summary style="cursor: pointer; font-weight: 600; color: #10b981; outline: none;">Ver como a IA respondeu</summary>
                    <p style="margin-top: 10px; line-height: 1.6; border-top: 1px dashed #cbd5e1; padding-top: 10px; white-space: pre-line;">${data.respostaIA || 'Sem resposta gerada'}</p>
                </details>
            </div>`;
        });

        dashList.innerHTML = html;

    } catch (error) {
        console.error("DEZ-ENVOLVE ERRO FLUXO FIRESTORE:", error);
        // Exposição explícita do erro na tela do usuário para auditoria técnica
        dashList.innerHTML = `
            <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 8px; color: #991b1b;">
                <p style="font-weight:bold; margin-bottom:5px;">⚠️ Falha de Conexão com o Banco de Dados</p>
                <p style="font-size:0.85rem; color:#b91c1c;">Motivo: ${error.message}</p>
                <p style="font-size:0.8rem; color:#475569; margin-top:10px;">Verifique se as Regras de Segurança (Security Rules) do Firestore permitem a leitura pública ou administrativa da coleção "interacoes".</p>
            </div>`;
    }
}

// =========================================================================
// 4. LÓGICA DE SALVAMENTO DE NOVOS POSTS (Mantida Protegida)
// =========================================================================
const formPost = document.getElementById("form-post");
const statusMsg = document.getElementById("status-msg");

if(formPost) {
    formPost.addEventListener("submit", async (e) => {
        e.preventDefault(); 
        
        const titulo = document.getElementById("titulo").value;
        const categoria = document.getElementById("categoria").value;
        
        if (!categoria) {
            alert("Por favor, selecione uma Trilha de Capacitação antes de publicar.");
            return;
        }

        if (!quill) {
            alert("Erro Técnico: O editor rico falhou na inicialização. Publicação abortada.");
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
            console.error("DEZ-ENVOLVE ERRO SALVAMENTO:", error);
            alert(`Erro ao salvar post: ${error.message}`);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Publicar Artigo";
        }
    });
}
