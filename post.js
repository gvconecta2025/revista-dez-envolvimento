import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, collection, addDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

const postTitle = document.getElementById("post-title");
const postBody = document.getElementById("post-body");
const shareContainer = document.getElementById("share-container");
const btnShareNative = document.getElementById("btn-share-native");
const btnShareWa = document.getElementById("btn-share-wa");

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

// O nosso espião de inteligência
const categoryTracker = document.getElementById("post-category-tracker");

let usuarioLogado = null;
let textoDoPostParaIA = "";
let notaPost = 0;
let interacaoAtualId = null;

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

async function carregarPost() {
    if (!postId) return;
    try {
        const docRef = doc(db, "posts", postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const post = docSnap.data();
            document.title = post.titulo;
            postTitle.textContent = post.titulo;
            
            // Grava a categoria secretamente para uso do Analytics
            if(categoryTracker) {
                categoryTracker.value = post.categoria || "Geral";
            }
            
            postBody.innerHTML = post.conteudo;
            textoDoPostParaIA = postBody.innerText; 
            
            shareContainer.classList.remove("hidden");
            
            btnShareNative.addEventListener("click", () => {
                if (navigator.share) {
                    navigator.share({ title: post.titulo, url: window.location.href });
                } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copiado!");
                }
            });

            btnShareWa.addEventListener("click", () => {
                const mensagem = encodeURIComponent(`Confira este artigo no Terceiro Espaço: ${post.titulo} - ${window.location.href}`);
                window.open(`https://api.whatsapp.com/send?text=${mensagem}`, "_blank");
            });
        }
    } catch (error) {
        console.error("Erro ao buscar o post:", error);
    }
}

stars.forEach(star => {
    star.addEventListener("click", () => {
        notaPost = parseInt(star.getAttribute("data-value"));
        stars.forEach(s => s.classList.remove("active"));
        for(let i = 0; i < notaPost; i++) { stars[i].classList.add("active"); }
        ratingMsg.classList.remove("hidden");
    });
});

btnAskIa.addEventListener("click", async () => {
    const pergunta = iaQuestion.value.trim();
    if (!pergunta) return alert("Digite uma pergunta sobre o texto.");

    btnAskIa.disabled = true;
    iaLoading.classList.remove("hidden");
    iaResponseContainer.classList.add("hidden");

    try {
        const respostaServidor = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pergunta: pergunta, contexto: textoDoPostParaIA })
        });
        const dados = await respostaServidor.json();
        if (!respostaServidor.ok) throw new Error(dados.error || "Erro na API.");

        iaResponseText.textContent = dados.resposta;
        iaResponseContainer.classList.remove("hidden");

        // Captura a categoria salva e envia para o banco de dados
        const postCategory = categoryTracker ? categoryTracker.value : "Geral";

        const docRef = await addDoc(collection(db, "interacoes"), {
            userId: usuarioLogado.uid,
            postId: postId,
            categoria: postCategory, // <--- NOVA INTELIGÊNCIA AQUI
            notaPost: notaPost,
            pergunta: pergunta,
            respostaIA: dados.resposta,
            avaliacaoIA: null,
            data: new Date().toISOString()
        });
        interacaoAtualId = docRef.id;
    } catch (error) {
        console.error(error);
        alert("Erro na IA: Verifique a conexão ou tente novamente mais tarde.");
    } finally {
        btnAskIa.disabled = false;
        iaLoading.classList.add("hidden");
    }
});

async function avaliarIA(avaliacao) {
    if (!interacaoAtualId) return;
    try {
        const docRef = doc(db, "interacoes", interacaoAtualId);
        await updateDoc(docRef, { avaliacaoIA: avaliacao });
        feedbackMsg.classList.remove("hidden");
        btnIaGood.disabled = true;
        btnIaBad.disabled = true;
    } catch(error) { console.error("Erro ao avaliar IA:", error); }
}

btnIaGood.addEventListener("click", () => avaliarIA("util"));
btnIaBad.addEventListener("click", () => avaliarIA("nao_util"));

carregarPost();
