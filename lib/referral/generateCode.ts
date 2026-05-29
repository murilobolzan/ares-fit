export function generateReferralCode(userId: string, username: string): string {
  // Limpa hífens do UUID e pega os primeiros 6 caracteres em caixa alta
  const shortId = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
  
  // Limpa caracteres especiais do username, pega os primeiros 4 caracteres em caixa alta
  const cleanUsername = username
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase();
    
  return `${cleanUsername}${shortId}`;
}