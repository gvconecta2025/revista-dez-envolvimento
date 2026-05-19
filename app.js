import { auth, provider, db } from "./firebase-config.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// =========================================================================
// 1. BANNER PWA
// =========================================================================
let deferredPrompt;
const installBanner = document.getElementById('install-banner');
const btnInstall = document.getElementById('btn-install');
const btnCloseInstall = document.getElementById('btn-close-install');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBanner) installBanner.classList.remove('hidden');
});

if (btnInstall) {
    btnInstall.addEventListener('click', async () => {
        installBanner.classList.add('hidden');
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
        }
    });
}
if (btnCloseInstall) btnCloseInstall.addEventListener('click', () => installBanner.classList.add('hidden'));

// =========================================================================
// 2. AUTENTICAÇÃO
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

if(btnLogin) btnLogin.addEventListener("click", () => signInWithPopup(auth, provider).catch(console.error));
if(btnLogout) btnLogout.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
    if (user) {
        if(loginSection) loginSection.classList.add("hidden");
        if(userSection) userSection.classList.remove("hidden");
        if(userNameSpan) userNameSpan.textContent = user.displayName;
        if(btnLogin) btnLogin.classList.add("hidden");
        if(userSectionNav) { userSectionNav.classList.remove("hidden"); userSectionNav.style.display = 'flex'; }
    } else {
        if(loginSection) loginSection.classList.remove("hidden");
        if(userSection) userSection.classList.add("hidden");
        if(btnLogin) btnLogin.classList.remove("hidden");
        if(userSectionNav) { userSectionNav.classList.add("hidden"); userSectionNav.style.display = 'none'; }
    }
});

// =========================================================================
// 3. MOTOR DO PORTAL DE NOTÍCIAS (GRID)
// =========================================================================
const categoriasMap = {
    c1: "Organização", c2: "Tempo", c3: "Estudo", c4: "Digital",
    c5: "Finanças", c6: "Decisão", c7: "Leitura", c8: "Disciplina",
    c9: "Autoconhecimento", c10: "Comunicação", e1: "Profissão"
};

function renderizarPosts(posts) {
    if(!feedPosts) return;
    feedPosts.innerHTML = ""; 
    
    if(posts.length === 0) {
        feedPosts.innerHTML = "<p style='color: #6b7280;'>Nenhuma atualização nesta editoria.</p>";
        return;
    }

    // Geração do layout de portal (Cards em Grid)
    posts.forEach((item) => {
        const catId = item.post.categoria;
        const catTag = categoriasMap[catId] ? categoriasMap[catId] : 'GERAL';
        const dataStr = new Date(item.post.dataCriacao).toLocaleDateString('pt-BR');
        
        const card = `
            <article class="news-card">
                <span class="news-category">${catTag}</span>
                <a href="post.html?id=${item.id}" class="news-title">${item.post.titulo}</a>
                <div class="news-date">${dataStr}</div>
            </article>
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
        feedPosts.innerHTML = "<p>Erro ao carregar as notícias.</p>";
    }
}

if(categoryFilters) {
    categoryFilters.addEventListener("click", (e) => {
        if(e.target.classList.contains("filter-btn")) {
            // Remove active de todos
            Array.from(categoryFilters.children).forEach(btn => btn.classList.remove("active"));
            // Ativa o clicado
            e.target.classList.add("active");

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
