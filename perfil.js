import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const perfilNome = document.getElementById("perfil-nome");
const perfilEmail = document.getElementById("perfil-email");
const historicoContainer = document.getElementById("historico-container");

// Verifica se o usuário está logado
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Preenche os dados básicos
        perfilNome.textContent = user.displayName;
        perfilEmail.textContent = user.email;
        
        // Busca o histórico
        carregarHistorico(user.uid);
    } else {
        // Se não estiver logado, redireciona para a página inicial por segurança
        window.location.href = "index.html";
    }
});

async function carregarHistorico(userId) {
    try {
        // Cria uma regra (query) para buscar apenas as interações deste usuário específico
        const q = query(collection(db, "interacoes"), where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        historicoContainer.innerHTML = ""; // Limpa a mensagem de carregamento
        
        if (querySnapshot.empty) {
            historicoContainer.innerHTML = "<p>Você ainda não fez nenhuma pergunta para a IA.</p>";
            return;
        }

        // Transforma os dados em um array (lista) para podermos ordenar pela data (do mais recente para o mais antigo)
        const interacoes = [];
        querySnapshot.forEach((doc) => {
            interacoes.push(doc.data());
        });

        // Ordena pela data decrescente
        interacoes.sort((a, b) => new Date(b.data) - new Date(a.data));

        // Desenha na tela
        interacoes.forEach((interacao) => {
            const dataFormatada = new Date(interacao.data).toLocaleString('pt-BR');
            const card = `
                <div class="history-card">
                    <p class="history-question">Você perguntou: "${interacao.pergunta}"</p>
                    <div class="history-answer">${interacao.respostaIA}</div>
                    <p class="history-meta">Realizado em: ${dataFormatada}</p>
                </div>
            `;
            historicoContainer.innerHTML += card;
        });

    } catch (error) {
        console.error("Erro ao carregar histórico:", error);
        historicoContainer.innerHTML = "<p>Erro ao buscar o histórico. Tente novamente mais tarde.</p>";
    }
}
