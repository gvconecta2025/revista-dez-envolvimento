import admin from 'firebase-admin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

    // Inicialização direta, sem JSON.parse (Mais robusto para variáveis da Vercel)
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                })
            });
        } catch (error) {
            return res.status(500).json({ error: 'Falha na autenticação: ' + error.message });
        }
    }

    const { titulo, mensagem } = req.body;
    if (!titulo || !mensagem) return res.status(400).json({ error: 'Dados incompletos.' });

    try {
        const db = admin.firestore();
        const tokensSnapshot = await db.collection('tokens_push').get();
        const tokens = tokensSnapshot.docs.map(doc => doc.id);
        
        if (tokens.length === 0) return res.status(200).json({ message: 'Nenhum utilizador registado.' });

        const payload = { notification: { title: titulo, body: mensagem }, tokens: tokens };
        const response = await admin.messaging().sendEachForMulticast(payload);

        res.status(200).json({ success: true, message: `Disparado para ${response.successCount} utilizadores.` });
    } catch (error) {
        res.status(500).json({ error: 'Erro no disparo: ' + error.message });
    }
}
