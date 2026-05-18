import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Inicializa o Editor Rico (Quill.js) com as ferramentas necessárias
var quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'align': [] }],
            ['link', 'image'],
            ['clean']
        ]
    },
    placeholder: 'Cole seu texto com formatação aqui...'
});

const formPost = document.getElementById("form-post");
const statusMsg = document.getElementById("status-msg");

if(formPost) {
    formPost.addEventListener("submit", async (e) => {
        e.preventDefault(); 
        
        const titulo = document.getElementById("titulo").value;
        
        // Extrai o HTML com toda a formatação e imagens gerado pelo editor
        const conteudoFormatado = quill.root.innerHTML;
        
        // Prevenção contra envio vazio (o Quill vazio ainda tem uma tag <p><br></p>)
        if (quill.getText().trim().length === 0 && !conteudoFormatado.includes('<img')) {
            alert("O conteúdo do post não pode estar vazio.");
            return;
        }
        
        const btnSubmit = formPost.querySelector("button");
        btnSubmit.disabled = true;
        btnSubmit.textContent = "Salvando...";

        try {
            const docRef = await addDoc(collection(db, "posts"), {
                titulo: titulo,
                conteudo: conteudoFormatado,
                dataCriacao: new Date().toISOString()
            });
            
            statusMsg.classList.remove("hidden");
            document.getElementById("titulo").value = "";
            quill.setContents([]); // Limpa o editor
            
            setTimeout(() => { statusMsg.classList.add("hidden"); }, 3000);
            
        } catch (error) {
            console.error("Erro ao salvar post: ", error);
            alert("Erro ao salvar. Verifique se as imagens não são muito grandes (limite do banco: 1MB/post).");
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = "Publicar Artigo";
        }
    });
}
