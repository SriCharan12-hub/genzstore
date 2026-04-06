import { MetadataRoute } from 'next';

const WEBSITE_URL = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/account', '/checkout'],
    },
    sitemap: `${WEBSITE_URL}/sitemap.xml`,
  };
}
