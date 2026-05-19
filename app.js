import { auth, provider, db } from "./firebase-config.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// =========================================================================
// 1. LÓGICA DO BANNER DE INSTALAÇÃO DO PWA (A Mini Janela)
// =========================================================================
let deferredPrompt;
const installBanner = document.getElementById('install-banner');
const btnInstall = document.getElementById('btn-install');
const btnCloseInstall = document.getElementById('btn-close-install');

// Escuta o evento do navegador que permite a instalação
window.addEventListener('beforeinstallprompt', (e) => {
    // Impede o Chrome de mostrar o prompt nativo automático (que é confuso)
    e.preventDefault();
    // Guarda o evento para dispararmos depois
    deferredPrompt = e;
    // Mostra o nosso banner premium no topo da tela
    if (installBanner) installBanner.classList.remove('hidden');
});

if (btnInstall) {
    btnInstall.addEventListener('click', async () => {
        // Esconde o banner
        installBanner.classList.add('hidden');
        if (deferredPrompt) {
            // Mostra o prompt real de instalação do sistema operacional
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Resultado da instalação: ${outcome}`);
            deferredPrompt = null;
        }
    });
}

if (btnCloseInstall) {
    btnCloseInstall.addEventListener('click', () => {
        installBanner.classList.add('hidden');
    });
}

// =========================================================================
// 2. AUTENTICAÇÃO E NAVEGAÇÃO BÁSICA
// =========================================================================
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const loginSection = document.getElementById("login-section");
const userSection = document.getElementById("user-section");
const userNameSpan = document.getElementById("user-name");
const feedPosts = document.getElementById("feed-posts");
const categoryFilters = document.getElementById("category-filters"); 
const userSectionNav = document.getElementById("user-section-nav");

let allPosts = []; 

if(btnLogin) {
    btnLogin.addEventListener("click", () => { signInWithPopup(auth, provider).catch(console.error); });
}

if(btnLogout) {
    btnLogout.addEventListener("click", () => { signOut(auth); });
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        if(loginSection) loginSection.classList.add("hidden");
        if(userSection) userSection.classList.remove("hidden");
        if(userNameSpan) userNameSpan.textContent = user.displayName;
        if(btnLogin) btnLogin.classList.add("hidden");
        if(userSectionNav) {
            userSectionNav.classList.remove("hidden");
            userSectionNav.style.display = 'flex';
        }
    } else {
        if(loginSection) loginSection.classList.remove("hidden");
        if(userSection) userSection.classList.add("hidden");
        if(btnLogin) btnLogin.classList.remove("hidden");
        if(userSectionNav) {
            userSectionNav.classList.add("hidden");
            userSectionNav.style.display = 'none';
        }
    }
});

// =========================================================================
// 3. FEED DE CONTEÚDO E FILTROS
// =========================================================================
function renderizarPosts(posts) {
    if(!feedPosts) return;
    feedPosts.innerHTML = ""; 
    
    if(posts.length === 0) {
        feedPosts.innerHTML = "<p style='color: #64748b;'>Nenhum conteúdo encontrado para esta trilha no momento.</p>";
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
        feedPosts.innerHTML = "<p>Erro ao carregar os conteúdos.</p>";
    }
}

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
