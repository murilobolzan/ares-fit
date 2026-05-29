import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aresfit.vercel.app';
  
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register'],
      disallow: ['/home', '/fichas', '/evolucao', '/perfil', '/admin', '/api/']
    },
    sitemap: `${APP_URL}/sitemap.xml`
  };
}