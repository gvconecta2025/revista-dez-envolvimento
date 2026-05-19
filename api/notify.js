import admin from 'firebase-admin';

// Inicialização segura para Vercel
if (!admin.apps.length) {
    try {
        // Remove quebras de linha caso existam na string da Vercel
        const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT.replace(/\\n/g, '\n');
        const serviceAccount = JSON.parse(serviceAccountString);
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('ERRO INICIALIZAÇÃO ADMIN:', error);
    }
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

    const { titulo, mensagem } = req.body;
    if (!titulo || !mensagem) return res.status(400).json({ error: 'Dados incompletos.' });

    try {
        const db = admin.firestore();
        const tokensSnapshot = await db.collection('tokens_push').get();
        const tokens = tokensSnapshot.docs.map(doc => doc.id);
        
        if (tokens.length === 0) return res.status(200).json({ message: 'Nenhum token encontrado.' });

        const payload = { notification: { title: titulo, body: mensagem }, tokens: tokens };
        const response = await admin.messaging().sendEachForMulticast(payload);

        res.status(200).json({ success: true, message: `Disparado para ${response.successCount} aparelhos.` });
    } catch (error) {
        console.error('ERRO DISPARO:', error);
        res.status(500).json({ error: 'Erro interno no servidor de notificações.' });
    }
}
