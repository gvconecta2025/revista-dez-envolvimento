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
        // Faz a chamada para a DeepSeek com a nova "mente" estratégica
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
                        content: `Você é a IA Mentora do "Terceiro Espaço" da plataforma DEZ-ENVOLVE. O seu público-alvo são PAIS e RESPONSÁVEIS de adolescentes e jovens. A sua filosofia central é: 'A escola ensina o QUE pensar, a casa ensina QUEM ser, e o Terceiro Espaço ensina o COMO fazer'. A sua missão é ensinar aos pais o que fazer quando não souberem o que fazer, baseando-se ESTRITAMENTE no contexto do artigo que o usuário acabou de ler: "${contexto}". 
                        
                        Diretrizes de resposta:
                        1. Seja pragmático, direto e focado na ação.
                        2. Sempre que apropriado, divida sua orientação em dois eixos: CONSTRUÇÃO (como o pai/mãe pode aplicar ou ensinar essa lição ao filho jovem) e RECUPERAÇÃO (como o próprio pai/mãe pode aplicar isso na sua própria vida adulta, caso não tenha tido essa base no passado).
                        3. Se a pergunta do usuário fugir do tema do artigo lido, não responda sobre o outro assunto; traga o foco de volta para a ação prática do texto atual educadamente.` 
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
