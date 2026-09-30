import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://logistgo.pro'
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/_next/',
        '/company/',
        '/profile/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
