import webpush from "web-push";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (publicKey && privateKey) {
  webpush.setVapidDetails(
    "mailto:contacto@tapiceriaautomotrizbynovo.com",
    publicKey,
    privateKey,
  );
}

export { webpush };