import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': resolve(__dirname, './src') },
    },
    build: { outDir: 'dist' },
    server: {
      proxy: {
        '/api/dust': {
          target: 'https://eu.dust.tt',
          changeOrigin: true,
          // Les fichiers Dust (?action=view) renvoient un 302 vers une URL signée
          // GCS — on suit la redirection côté serveur pour rester same-origin.
          followRedirects: true,
          rewrite: path => path.replace(/^\/api\/dust/, '/api/v1'),
          configure: proxy => {
            proxy.on('proxyReq', proxyReq => {
              // Avec followRedirects, proxyReq se redéclenche sur la requête vers GCS
              // (headers déjà envoyés) → ne toucher que la requête initiale, sinon
              // ERR_HTTP_HEADERS_SENT plante le serveur. On NE veut de toute façon PAS
              // renvoyer l'auth Dust vers GCS.
              if (proxyReq.headersSent) return;
              try {
                proxyReq.setHeader('Authorization', `Bearer ${env.DUST_API_KEY}`);
                // Le navigateur envoie Origin/Referer même en same-origin sur les POST ;
                // le WAF de Dust renvoie 403 si une origine étrangère accompagne un POST.
                // (En prod, api/dust.js reconstruit des headers propres et ne les transmet pas.)
                proxyReq.removeHeader('origin');
                proxyReq.removeHeader('referer');
              } catch { /* requête redirigée : headers déjà envoyés */ }
            });
          },
        },
      },
    },
  };
});
