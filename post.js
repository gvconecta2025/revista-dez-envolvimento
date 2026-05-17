import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Pegar o ID do post na URL da página
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

const postTitle = document.getElementById("post-title");
const postBody = document.getElementById("post-body");
const btnShare = document.getElementById("btn-share");

async function carregarPost() {
    if (!postId) {
        postTitle.textContent = "Erro";
        postBody.textContent = "Nenhum post encontrado. A URL está incorreta.";
        return;
    }

    try {
        // Busca um único documento pelo ID
        const docRef = doc(db, "posts", postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const post = docSnap.data();
            
            // Preenche o HTML
            document.title = post.titulo + " - Dez-envolvimento"; // Muda o título da aba do navegador
            postTitle.textContent = post.titulo;
            postBody.textContent = post.conteudo;
            
            // Mostra o botão de compartilhamento
            btnShare.classList.remove("hidden");

            // Configura o Compartilhamento Nativo
            btnShare.addEventListener("click", async () => {
                const dadosCompartilhamento = {
                    title: post.titulo,
                    text: 'Confira este conteúdo de valor!',
                    url: window.location.href // A URL completa da página atual
                };

                // Verifica se o navegador/celular suporta a função nativa de compartilhar
                if (navigator.share) {
                    try {
                        await navigator.share(dadosCompartilhamento);
                    } catch (err) {
                        console.log("Compartilhamento cancelado ou falhou:", err);
                    }
                } else {
                    // Fallback para computadores antigos que não têm menu de compartilhar
                    navigator.clipboard.writeText(window.location.href);
                    alert("Link copiado para a área de transferência!");
                }
            });

        } else {
            postTitle.textContent = "Post não encontrado";
            postBody.textContent = "Este conteúdo foi apagado ou não existe.";
        }
    } catch (error) {
        console.error("Erro ao buscar o post:", error);
        postTitle.textContent = "Erro no servidor";
        postBody.textContent = "Houve um problema ao carregar o conteúdo.";
    }
}

// Executa a função
carregarPost();
