import admin from 'firebase-admin';

// Inicializa o Firebase Admin usando a variável de ambiente (Chave Mestra)
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('DEZ-ENVOLVE CRÍTICO: Erro ao carregar a FIREBASE_SERVICE_ACCOUNT.', error);
    }
}

export default async function handler(req, res) {
    // Apenas aceita requisições do tipo POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const { titulo, mensagem } = req.body;

    if (!titulo || !mensagem) {
        return res.status(400).json({ error: 'Título e mensagem são obrigatórios.' });
    }

    try {
        const db = admin.firestore();
        
        // Vai à coleção 'tokens_push' recolher os telemóveis/computadores guardados
        const tokensSnapshot = await db.collection('tokens_push').get();
        const tokens = [];
        
        tokensSnapshot.forEach(doc => {
            tokens.push(doc.id);
        });

        if (tokens.length === 0) {
            return res.status(200).json({ success: false, message: 'Nenhum utilizador registou-se para receber notificações ainda.' });
        }

        // Prepara o pacote da notificação
        const payload = {
            notification: {
                title: titulo,
                body: mensagem
            },
            tokens: tokens
        };

        // Dispara o Multicast (envia para todos de uma vez)
        const response = await admin.messaging().sendEachForMulticast(payload);

        res.status(200).json({ 
            success: true, 
            message: `Disparo concluído! Entregue a ${response.successCount} utilizador(es). Falharam: ${response.failureCount}.` 
        });

    } catch (error) {
        console.error('DEZ-ENVOLVE ERRO PUSH:', error);
        res.status(500).json({ error: 'Erro interno ao tentar disparar as notificações.' });
    }
}
