import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const formPost = document.getElementById("form-post");
const statusMsg = document.getElementById("status-msg");

if(formPost) {
    formPost.addEventListener("submit", async (e) => {
        e.preventDefault(); // Impede a página de recarregar
        
        const titulo = document.getElementById("titulo").value;
        const conteudo = document.getElementById("conteudo").value;
        
        try {
            // Adiciona um documento na coleção 'posts'
            const docRef = await addDoc(collection(db, "posts"), {
                titulo: titulo,
                conteudo: conteudo,
                dataCriacao: new Date().toISOString()
            });
            
            // Sucesso!
            statusMsg.classList.remove("hidden");
            formPost.reset(); // Limpa o formulário
            
            // Esconde a mensagem depois de 3 segundos
            setTimeout(() => {
                statusMsg.classList.add("hidden");
            }, 3000);
            
            console.log("Post salvo com ID: ", docRef.id);
            
        } catch (error) {
            console.error("Erro ao salvar post: ", error);
            alert("Erro ao salvar. Verifique o console.");
        }
    });
}
