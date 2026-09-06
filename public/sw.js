self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || "Tapicería Automotriz by NOVO";
  const options = {
    body: data.body || "",
    icon: "/images/icon-192.png",
    badge: "/images/icon-192.png",
    data: { url: data.url || "/portal" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/portal";
  event.waitUntil(clients.openWindow(url));
});