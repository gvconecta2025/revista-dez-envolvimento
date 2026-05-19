importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Configuração injetada com os seus dados reais
firebase.initializeApp({
    apiKey: "AIzaSyD4Ag5LEioFxlseyQmWWu5ov64sgK04F2M",
    projectId: "revista-dez-envolvimento",
    messagingSenderId: "845251441976",
    appId: "1:845251441976:web:dc41c681ed0f3d475a3dcd"
});

const messaging = firebase.messaging();

// Lógica para receber a notificação em segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Notificação recebida em segundo plano: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
