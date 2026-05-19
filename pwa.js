import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging.js";
import { db } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('Service Worker registado com sucesso.');
            
            // Pede permissão ao pai/mãe para enviar notificações
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    console.log('Permissão para notificações concedida.');
                    const messaging = getMessaging();
                    
                    // 👉 COLE A SUA VAPID KEY ENTRE AS ASPAS ABAIXO 👈
                    const vapidKey = "BN8Q4_eL2IIS7xHi_M9akfYCd8EWji2479gQjQIf_CX57bLxlAOH96tG9E76__-srpcDeYAucXgt6UZrHY0VlSM";
                    
                    getToken(messaging, { vapidKey: vapidKey, serviceWorkerRegistration: registration })
                    .then((currentToken) => {
                        if (currentToken) {
                            // Guarda o token silenciosamente no banco de dados (coleção tokens_push)
                            setDoc(doc(db, "tokens_push", currentToken), { 
                                token: currentToken, 
                                dataRegistro: new Date().toISOString() 
                            }, { merge: true });
                            console.log('Token guardado com sucesso.');
                        }
                    }).catch((err) => {
                        console.error('Erro ao recuperar o token de push:', err);
                    });
                } else {
                    console.log('Permissão para notificações negada pelo utilizador.');
                }
            });
        })
        .catch(error => {
            console.error('Falha ao registar o Service Worker:', error);
        });
    });
}
