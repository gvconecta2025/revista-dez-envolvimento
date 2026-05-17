// Importa as funções do Firebase diretamente da internet (CDN) para funcionar sem bundlers
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Suas chaves reais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD4Ag5LEioFxlseyQmWWu5ov64sgK04F2M",
  authDomain: "revista-dez-envolvimento.firebaseapp.com",
  projectId: "revista-dez-envolvimento",
  storageBucket: "revista-dez-envolvimento.firebasestorage.app",
  messagingSenderId: "845251441976",
  appId: "1:845251441976:web:dc41c681ed0f3d475a3dcd",
  measurementId: "G-2TW9RJP2LC"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Prepara e exporta a autenticação (Login) e o Banco de Dados (Firestore) para o app.js e admin.js usarem
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
