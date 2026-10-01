import { APP_IDS } from '../src/lib/apps-meta.js';
import { LOCALES } from '../src/i18n/locales.js';

/**
 * Gera `sitemap.xml` e `robots.txt` no build e injeta as URLs absolutas
 * (canonical, hreflang, Open Graph) no index.html a partir de VITE_SITE_URL.
 */
export function seo({ siteUrl }) {
  const base = (siteUrl || 'http://localhost:5173').replace(/\/$/, '');

  return {
    name: 'portifolio:seo',
    transformIndexHtml(html) {
      return html.replaceAll('%SITE_URL%', base);
    },
    generateBundle() {
      const paths = ['', ...APP_IDS.map((id) => `/${id}`)];
      const urls = paths.flatMap((p) =>
        LOCALES.map((locale) => {
          const alternates = LOCALES.map(
            (alt) =>
              `    <xhtml:link rel="alternate" hreflang="${alt}" href="${base}/${alt}${p}"/>`,
          ).join('\n');
          return `  <url>\n    <loc>${base}/${locale}${p}</loc>\n${alternates}\n  </url>`;
        }),
      );
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`,
      });
    },
  };
}
