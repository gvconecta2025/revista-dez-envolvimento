import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, query, orderBy, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Inicialização do Editor Quill
let quill = null;
try {
    quill = new Quill('#editor-container', { theme: 'snow', modules: { toolbar: [['bold', 'italic'], ['link', 'image'], [{ 'list': 'bullet' }]] } });
} catch (e) { console.error(e); }

// Sistema de Abas Simplificado
const sections = {
    form: document.getElementById("admin-form-section"),
    manage: document.getElementById("admin-manage-section"),
    dash: document.getElementById("admin-dash-section")
};

function show(id) {
    Object.values(sections).forEach(s => s.classList.add("hidden"));
    sections[id].classList.remove("hidden");
}

document.getElementById("btn-show-form").addEventListener("click", () => show("form"));
document.getElementById("btn-show-manage").addEventListener("click", () => { show("manage"); carregarGerenciamento(); });
document.getElementById("btn-show-dash").addEventListener("click", () => { show("dash"); carregarDashboard(); });

// Funções de Gerenciamento e Dashboard (Mantêm-se iguais para não perder o seu trabalho)
// ... (mantenha as funções carregarGerenciamento e carregarDashboard que já funcionam)
