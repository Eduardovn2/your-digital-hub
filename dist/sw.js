// public/sw.js
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.message,
    icon: '/icon-192x192.png', // Seu ícone de lojista
    badge: '/badge.png',
    vibrate: [200, 100, 200],
    data: { url: '/admin' }, // Link para abrir ao clicar
    tag: 'new-order' // Evita notificações duplicadas
  };

  // Tocar o som customizado (se o navegador permitir em segundo plano)
  event.waitUntil(
    self.registration.showNotification('🍔 Novo Pedido!', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});