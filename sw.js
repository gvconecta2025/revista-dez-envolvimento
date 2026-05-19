importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// 1. Configuração do Firebase
firebase.initializeApp({
  apiKey: "AIzaSyD4Ag5LEioFxlseyQmWWu5ov64sgK04F2M",
  projectId: "revista-dez-envolvimento",
  messagingSenderId: "845251441976",
  appId: "1:845251441976:web:dc41c681ed0f3d475a3dcd"
});

const messaging = firebase.messaging();

// 2. Lógica para receber a notificação em segundo plano
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

// 3. EVENTOS OBRIGATÓRIOS PARA INSTALAÇÃO PWA
self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalado');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Ativado');
    return self.clients.claim();
});

// A presença deste evento 'fetch' é o que libera o botão "Instalar App" no telemóvel
self.addEventListener('fetch', (event) => {
    // Comportamento simples: tenta ir à internet, se falhar devolve erro offline
    event.respondWith(
        fetch(event.request).catch(() => {
            return new Response('Você está offline. Verifique sua conexão de rede.');
        })
    );
});
