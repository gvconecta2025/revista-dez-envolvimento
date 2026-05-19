import admin from 'firebase-admin';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

    // 1. Auditoria de Segurança: Verificar se a variável existe
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        console.error("ERRO CRÍTICO: Variável FIREBASE_SERVICE_ACCOUNT não encontrada na Vercel.");
        return res.status(500).json({ error: 'Configuração do servidor ausente.' });
    }

    // 2. Inicialização Segura
    if (!admin.apps.length) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (error) {
            console.error('ERRO DE PARSE DO JSON:', error);
            return res.status(500).json({ error: 'Formato da chave JSON inválido.' });
        }
    }

    const { titulo, mensagem } = req.body;
    if (!titulo || !mensagem) return res.status(400).json({ error: 'Dados incompletos.' });

    try {
        const db = admin.firestore();
        const tokensSnapshot = await db.collection('tokens_push').get();
        const tokens = tokensSnapshot.docs.map(doc => doc.id);
        
        if (tokens.length === 0) return res.status(200).json({ message: 'Nenhum token registado.' });

        const payload = { notification: { title: titulo, body: mensagem }, tokens: tokens };
        const response = await admin.messaging().sendEachForMulticast(payload);

        res.status(200).json({ success: true, message: `Disparo concluído! Entregue a ${response.successCount} utilizador(es).` });
    } catch (error) {
        console.error('ERRO DISPARO:', error);
        res.status(500).json({ error: 'Erro no envio da notificação.' });
    }
}
