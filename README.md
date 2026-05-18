# Revista Dez-envolvimento (PWA + IA)

Aplicativo web em formato de revista digital com foco em conteúdo de valor. O diferencial estratégico é a substituição da seção de comentários tradicional por um assistente de Inteligência Artificial contextualizado.

## Arquitetura e Stack
Este projeto foi construído sobre o **tripé** de desenvolvimento:
1. **GitHub:** Versionamento e gestão de código.
2. **Vercel:** Hospedagem contínua e Serverless Functions (Back-end protegido).
3. **Firebase:** Authentication (Login Google) e Firestore (Banco de Dados NoSQL blindado).

*O projeto foi projetado utilizando HTML, CSS e Vanilla JS puro para manter a simplicidade e a curva de aprendizado acelerada, permitindo fácil duplicação.*

## Estrutura de Repositório Único
Esta pasta (`/revista-dez-envolvimento`) faz parte de uma arquitetura de repositório único com pastas em camadas. Para criar um novo projeto (ex: `revista-pet-shops`), basta duplicar esta pasta, atualizar o arquivo `firebase-config.js` com as chaves do novo banco e alterar o `manifest.json`.

## Fluxo Principal de Funcionamento
1. Usuário acessa o PWA e consome o post (`post.html`).
2. Ao enviar uma dúvida sobre o texto, o frontend aciona a rota Serverless da Vercel (`/api/chat.js`).
3. A Vercel injeta a chave de API (protegida via variáveis de ambiente) e se comunica com a **DeepSeek API**.
4. A resposta é renderizada na tela e a interação completa é salva no Firestore na coleção `interacoes`.
5. O usuário gerencia seu histórico de aprendizado pela tela de `perfil.html`.
