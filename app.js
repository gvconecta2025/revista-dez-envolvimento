import { auth, provider, db } from "./firebase-config.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const loginSection = document.getElementById("login-section");
const userSection = document.getElementById("user-section");
const userNameSpan = document.getElementById("user-name");
const feedPosts = document.getElementById("feed-posts");
const categoryFilters = document.getElementById("category-filters"); 

// Armazena todos os posts na memória do celular para filtro rápido
let allPosts = []; 

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

// Função para renderizar os cards na tela
function renderizarPosts(posts) {
    feedPosts.innerHTML = ""; 
    
    if(posts.length === 0) {
        feedPosts.innerHTML = "<p>Nenhum conteúdo encontrado para esta trilha no momento.</p>";
        return;
    }

    posts.forEach((item) => {
        // Pega a categoria para exibir no card (ou 'Geral' se não tiver)
        const catTag = item.post.categoria ? item.post.categoria.toUpperCase() : 'GERAL';
        
        const card = `
            <div class="post-card">
                <a href="post.html?id=${item.id}" style="display:block; font-weight:bold; margin-bottom: 5px;">${item.post.titulo}</a>
                <span style="font-size: 0.7rem; background: #e2e8f0; color: #334155; padding: 3px 8px; border-radius: 12px; display: inline-block; margin-bottom: 8px;">TRILHA: ${catTag}</span>
                <p style="font-size: 0.85rem; color: #64748b;">Postado em: ${new Date(item.post.dataCriacao).toLocaleDateString('pt-BR')}</p>
            </div>
        `;
        feedPosts.innerHTML += card;
    });
}

// Carregar Posts do Feed (Baixa do Firebase apenas 1 vez)
async function carregarFeed() {
    if(!feedPosts) return;
    
    try {
        const q = query(collection(db, "posts"), orderBy("dataCriacao", "desc"));
        const querySnapshot = await getDocs(q);
        
        allPosts = []; 
        querySnapshot.forEach((doc) => {
            allPosts.push({ id: doc.id, post: doc.data() });
        });

        renderizarPosts(allPosts); 
    } catch (error) {
        console.error("Erro ao carregar posts:", error);
        feedPosts.innerHTML = "<p>Erro ao carregar os conteúdos.</p>";
    }
}

// Lógica de Escuta dos Botões de Filtro
if(categoryFilters) {
    categoryFilters.addEventListener("click", (e) => {
        if(e.target.tagName === "BUTTON") {
            // Ajusta o visual do botão clicado
            Array.from(categoryFilters.children).forEach(btn => {
                btn.style.backgroundColor = "#f1f5f9";
                btn.style.color = "black";
            });
            e.target.style.backgroundColor = "#0f172a";
            e.target.style.color = "white";

            // Filtra os dados
            const categoriaSelecionada = e.target.getAttribute("data-categoria");
            
            if (categoriaSelecionada === "todas") {
                renderizarPosts(allPosts);
            } else {
                const postsFiltrados = allPosts.filter(item => item.post.categoria === categoriaSelecionada);
                renderizarPosts(postsFiltrados);
            }
        }
    });
}

carregarFeed();
