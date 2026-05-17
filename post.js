import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, collection, addDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Pegar IDs
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

// Elementos do Post
const postTitle = document.getElementById("post-title");
const postBody = document.getElementById("post-body");
const btnShare = document.getElementById("btn-share");

// Elementos da IA e Autenticação
const loginPrompt = document.getElementById("login-prompt");
const iaTools = document.getElementById("ia-tools");
const stars = document.querySelectorAll(".star");
const ratingMsg = document.getElementById("rating-msg");
const iaQuestion = document.getElementById("ia-question");
const btnAskIa = document.getElementById("btn-ask-ia");
const iaLoading = document.getElementById("ia-loading");
const iaResponseContainer = document.getElementById("ia-response-container");
const iaResponseText = document.getElementById("ia-response-text");
const btnIaGood = document.getElementById("btn-ia-good");
const btnIaBad = document.getElementById("btn-ia-bad");
const feedbackMsg = document.getElementById("feedback-msg");

// Variáveis Globais de Estado
let usuarioLogado = null;
let textoDoPostParaIA = "";
let notaPost = 0;
let interacaoAtualId = null;

// 1. Observador de Login
onAuthStateChanged(auth, (user) => {
    if (user) {
        usuarioLogado = user;
        loginPrompt.classList.add("hidden");
        iaTools.classList.remove("hidden");
    } else {
        usuarioLogado = null;
        loginPrompt.classList.remove("hidden");
        iaTools.classList.add("hidden");
    }
});

// 2. Carrega o Post do Banco
async function carregarPost() {
    if (!postId) return;

    try {
        const docRef = doc(db, "posts", postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const post = docSnap.data();
            document.title = post.titulo;
            postTitle.textContent = post.titulo;
            postBody.textContent = post.conteudo;
            textoDoPostParaIA = post.conteudo; // Salva texto para a IA ler depois
            
            btnShare.classList.remove("hidden");
            btnShare.addEventListener("click", () => {
                if (navigator.share) {
                    navigator.share({ title: post.titulo, url: window.location.href });
                } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copiado!");
                }
            });
        }
    } catch (error) {
        console.error("Erro ao buscar o post:", error);
    }
}

// 3. Sistema Lógico das Estrelas
stars.forEach(star => {
    star.addEventListener("click", () => {
        notaPost = parseInt(star.getAttribute("data-value"));
        // Limpa todas as estrelas
        stars.forEach(s => s.classList.remove("active"));
        // Pinta até a estrela clicada
        for(let i = 0; i < notaPost; i++) {
            stars[i].classList.add("active");
        }
        ratingMsg.classList.remove("hidden");
    });
});

// 4. Fluxo de Pergunta para a IA
btnAskIa.addEventListener("click", async () => {
    const pergunta = iaQuestion.value.trim();
    if (!pergunta) {
        alert("Digite uma pergunta sobre o texto.");
        return;
    }

    // Bloqueia a interface enquanto processa
    btnAskIa.disabled = true;
    iaLoading.classList.remove("hidden");
    iaResponseContainer.classList.add("hidden");

    try {
        // Envia para o nosso servidor seguro na Vercel
        const respostaServidor = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pergunta: pergunta,
                contexto: textoDoPostParaIA
            })
        });

        const dados = await respostaServidor.json();

        if (!respostaServidor.ok) {
            throw new Error(dados.error || "Erro na API.");
        }

        // Exibe a resposta formatada
        iaResponseText.textContent = dados.resposta;
        iaResponseContainer.classList.remove("hidden");

        // Salva o registro completo da interação no banco de dados
        const docRef = await addDoc(collection(db, "interacoes"), {
            userId: usuarioLogado.uid,
            postId: postId,
            notaPost: notaPost, // 0 se o usuário não clicou nas estrelas
            pergunta: pergunta,
            respostaIA: dados.resposta,
            avaliacaoIA: null, // Fica nulo até o usuário clicar em Útil/Não Útil
            data: new Date().toISOString()
        });
        
        interacaoAtualId = docRef.id;

    } catch (error) {
        console.error(error);
        alert("Erro na IA: Verifique o console do navegador.");
    } finally {
        // Desbloqueia a interface
        btnAskIa.disabled = false;
        iaLoading.classList.add("hidden");
    }
});

// 5. Avaliação da Resposta da IA (Update no Banco)
async function avaliarIA(avaliacao) {
    if (!interacaoAtualId) return;
    try {
        const docRef = doc(db, "interacoes", interacaoAtualId);
        await updateDoc(docRef, {
            avaliacaoIA: avaliacao
        });
        feedbackMsg.classList.remove("hidden");
        btnIaGood.disabled = true;
        btnIaBad.disabled = true;
    } catch(error) {
        console.error("Erro ao avaliar IA:", error);
    }
}

btnIaGood.addEventListener("click", () => avaliarIA("util"));
btnIaBad.addEventListener("click", () => avaliarIA("nao_util"));

// Executa o carregamento inicial
carregarPost();
