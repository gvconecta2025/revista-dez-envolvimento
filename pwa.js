import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging.js";
import { db } from "./firebase-config.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Registro do PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
    .then(reg => {
        console.log("Service Worker registrado.");
        
        // Solicita permissão de notificação
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                const messaging = getMessaging();
                getToken(messaging, { vapidKey: 'SUA_VAPID_KEY_DO_FIREBASE' })
                .then((token) => {
                    // Salva o token no Firestore para podermos enviar a notificação depois
                    setDoc(doc(db, "tokens_push", token), { token: token, data: new Date() });
                });
            }
        });
    });
}
