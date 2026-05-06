import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { buildSchemaOrgGraph } from './src/seo/jsonLdGraph'
import {
  GEO_REGION_META,
  KEYWORDS_META,
  META_DESCRIPTION,
  META_TITLE,
} from './src/seo/siteContent'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function escapeJsonForScript(json: string) {
  return json.replace(/</g, '\\u003c')
}

function seoInjectPlugin(siteOrigin: string) {
  const jsonLd = escapeJsonForScript(JSON.stringify(buildSchemaOrgGraph(siteOrigin)))
  const lastmod = new Date().toISOString().slice(0, 10)

  return {
    name: 'acnow-seo',
    transformIndexHtml(html: string) {
      return html
        .replace(/%SITE_ORIGIN%/g, siteOrigin)
        .replace(/%META_TITLE%/g, META_TITLE)
        .replace(/%META_DESCRIPTION%/g, META_DESCRIPTION)
        .replace(/%KEYWORDS%/g, KEYWORDS_META)
        .replace(/%GEO_REGION%/g, GEO_REGION_META)
        .replace('%JSON_LD%', jsonLd)
    },
    closeBundle() {
      const dir = path.resolve(__dirname, 'dist')
      if (!fs.existsSync(dir)) return
      let host = ''
      try {
        host = new URL(siteOrigin).host
      } catch {
        host = ''
      }
      fs.writeFileSync(
        path.join(dir, 'robots.txt'),
        [
          '# 에이씨나우',
          'User-agent: *',
          'Allow: /',
          host ? `Host: ${host}` : '',
          '',
          `Sitemap: ${siteOrigin}/sitemap.xml`,
          '',
        ]
          .filter(Boolean)
          .join('\n'),
      )
      fs.writeFileSync(
        path.join(dir, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
          `  <url>\n` +
          `    <loc>${siteOrigin}/</loc>\n` +
          `    <lastmod>${lastmod}</lastmod>\n` +
          `    <changefreq>weekly</changefreq>\n` +
          `    <priority>1.0</priority>\n` +
          `  </url>\n` +
          `</urlset>\n`,
      )
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteOrigin = (env.VITE_SEO_ORIGIN || 'http://localhost:5173').replace(/\/$/, '')
  const proxyRaw =
    env.VITE_DEV_API_PROXY_TARGET || env.VITE_API_BASE_URL || 'http://127.0.0.1:4000';
  let apiProxyTarget = proxyRaw.replace(/\/$/, '');
  try {
    const u = new URL(proxyRaw);
    apiProxyTarget = u.origin;
  } catch {
    apiProxyTarget = apiProxyTarget.replace(/\/?api\/?$/i, '');
  }

  return {
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
    seoInjectPlugin(siteOrigin),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'pwa-192.png',
        'pwa-512.png',
        'favicon-16.png',
        'favicon-32.png',
        'apple-touch-icon.png',
        'branding/icon-app.png',
        'branding/icon-mark.png',
        'favicon.svg',
      ],
      manifest: {
        id: '/',
        name: '에이씨나우',
        short_name: '에이씨나우',
        description: META_DESCRIPTION.slice(0, 110),
        theme_color: '#2563eb',
        background_color: '#f9fafb',
        display: 'standalone',
        display_override: ['standalone', 'browser'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'ko',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,xml}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
  // dev·preview 공통: /api → Nest (`npm run preview` 에는 preview.proxy 가 없으면 POST /api/... 가
  // 정적 호스트로만 가서 `Cannot POST /api/...` 가 난다.)
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
}
})
