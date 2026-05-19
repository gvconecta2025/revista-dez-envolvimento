importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Configuração básica do Firebase dentro do SW
firebase.initializeApp({
    apiKey: "SUA_API_KEY_AQUI", // Use os mesmos dados do seu firebase-config.js
    projectId: "SEU_PROJECT_ID",
    messagingSenderId: "SEU_SENDER_ID"
});

const messaging = firebase.messaging();

// Exibe a notificação na tela quando o site estiver em segundo plano
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
