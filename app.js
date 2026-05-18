import { auth, provider, db } from "./firebase-config.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const loginSection = document.getElementById("login-section");
const userSection = document.getElementById("user-section");
const userNameSpan = document.getElementById("user-name");
const feedPosts = document.getElementById("feed-posts");

// Autenticação
if(btnLogin) {
    btnLogin.addEventListener("click", () => {
        signInWithPopup(auth, provider).catch(console.error);
    });
}

if(btnLogout) {
    btnLogout.addEventListener("click", () => {
        signOut(auth);
    });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add("hidden");
        userSection.classList.remove("hidden");
        userNameSpan.textContent = user.displayName;
    } else {
        loginSection.classList.remove("hidden");
        userSection.classList.add("hidden");
    }
});

// Carregar Posts do Feed ordenados do mais recente para o mais antigo
async function carregarFeed() {
    if(!feedPosts) return;
    
    try {
        // Cria a regra para ordenar por dataCriacao (descendente)
        const q = query(collection(db, "posts"), orderBy("dataCriacao", "desc"));
        const querySnapshot = await getDocs(q);
        
        feedPosts.innerHTML = ""; 
        
        if(querySnapshot.empty) {
            feedPosts.innerHTML = "<p>Nenhum post publicado ainda.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const post = doc.data();
            const postId = doc.id;
            
            const card = `
                <div class="post-card">
                    <a href="post.html?id=${postId}">${post.titulo}</a>
                    <p>Postado em: ${new Date(post.dataCriacao).toLocaleDateString('pt-BR')}</p>
                </div>
            `;
            feedPosts.innerHTML += card;
        });
    } catch (error) {
        console.error("Erro ao carregar posts:", error);
        feedPosts.innerHTML = "<p>Erro ao carregar os conteúdos.</p>";
    }
}

carregarFeed();
