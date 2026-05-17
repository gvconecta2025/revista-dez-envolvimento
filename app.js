import { auth, provider } from "./firebase-config.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const loginSection = document.getElementById("login-section");
const userSection = document.getElementById("user-section");
const userNameSpan = document.getElementById("user-name");

// Ação de clique para Login
if(btnLogin) {
    btnLogin.addEventListener("click", () => {
        signInWithPopup(auth, provider).catch((error) => {
            console.error("Erro no login: ", error);
        });
    });
}

// Ação de clique para Logout
if(btnLogout) {
    btnLogout.addEventListener("click", () => {
        signOut(auth);
    });
}

// Observador: Verifica o tempo todo se a pessoa logou ou deslogou
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuário está logado
        loginSection.classList.add("hidden");
        userSection.classList.remove("hidden");
        userNameSpan.textContent = user.displayName;
    } else {
        // Usuário deslogado
        loginSection.classList.remove("hidden");
        userSection.classList.add("hidden");
    }
});
