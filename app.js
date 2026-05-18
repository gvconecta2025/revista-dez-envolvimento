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
const userSectionNav = document.getElementById("user-section-nav");

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

// Escutador de estado de Login CORRIGIDO
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Exibe o conteúdo e oculta a tela inicial
        if(loginSection) loginSection.classList.add("hidden");
        if(userSection) userSection.classList.remove("hidden");
        if(userNameSpan) userNameSpan.textContent = user.displayName;
        
        // Esconde o botão Entrar e exibe o menu Sair/Admin/Perfil
        if(btnLogin) btnLogin.classList.add("hidden");
        if(userSectionNav) {
            userSectionNav.classList.remove("hidden");
            userSectionNav.style.display = 'flex';
        }
    } else {
        // Exibe tela inicial e oculta conteúdo
        if(loginSection) loginSection.classList.remove("hidden");
        if(userSection) userSection.classList.add("hidden");
        
        // Exibe o botão Entrar e oculta o menu Sair/Admin/Perfil
        if(btnLogin) btnLogin.classList.remove("hidden");
        if(userSectionNav) {
            userSectionNav.classList.add("hidden");
            userSectionNav.style.display = 'none';
        }
    }
});

// Função para renderizar os cards na tela
function renderizarPosts(posts) {
    if(!feedPosts) return;
    feedPosts.innerHTML = ""; 
    
    if(posts.length === 0) {
        feedPosts.innerHTML = "<p>Nenhum conteúdo encontrado para esta trilha no momento.</p>";
        return;
    }

    posts.forEach((item) => {
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

// Carregar Posts do Feed
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
            Array.from(categoryFilters.children).forEach(btn => {
                btn.style.backgroundColor = "#f1f5f9";
                btn.style.color = "black";
            });
            e.target.style.backgroundColor = "#0f172a";
            e.target.style.color = "white";

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
