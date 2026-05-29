// NOTA DE SEGURANÇA: Rode o comando `npx web-push generate-vapid-keys` 
// ou `node -e "console.log(require('web-push').generateVAPIDKeys())"` 
// uma única vez e salve no seu arquivo .env.local

export const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
  subject: process.env.NEXT_PUBLIC_APP_URL || 'https://aresfit.vercel.app'
};