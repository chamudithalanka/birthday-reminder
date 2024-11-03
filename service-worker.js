self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: 'cake-icon.png',
        badge: 'badge-icon.png',
        vibrate: [200, 100, 200],
        tag: 'birthday-notification'
    };

    event.waitUntil(
        self.registration.showNotification('Birthday Reminder', options)
    );
}); 