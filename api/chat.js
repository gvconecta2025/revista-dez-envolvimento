export default async function handler(req, res) {
    // Só aceita requisições do tipo POST (envio de dados)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { pergunta, contexto } = req.body;

    if (!pergunta) {
        return res.status(400).json({ error: 'Pergunta é obrigatória' });
    }

    // Puxa a chave da DeepSeek das variáveis de ambiente seguras da Vercel
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Chave da API não configurada no servidor' });
    }

    try {
        // Faz a chamada para a DeepSeek
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { 
                        role: 'system', 
                        content: `Você é uma IA assistente educacional da revista digital "Dez-envolvimento". Sua missão é responder às dúvidas do usuário de forma clara, prestativa e direta, baseando-se ESTRITAMENTE no contexto do artigo que o usuário acabou de ler. Se a pergunta fugir do tema do artigo, traga o foco de volta educadamente. Contexto do artigo lido: "${contexto}"` 
                    },
                    { 
                        role: 'user', 
                        content: pergunta 
                    }
                ],
                max_tokens: 800,
                temperature: 0.7
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Erro na API da DeepSeek');
        }

        // Extrai apenas o texto da resposta da IA
        const respostaIA = data.choices[0].message.content;
        
        // Devolve para o nosso site
        res.status(200).json({ resposta: respostaIA });

    } catch (error) {
        console.error("Erro na Vercel Function:", error);
        res.status(500).json({ error: 'Erro interno ao processar a requisição com a IA.' });
    }
}
