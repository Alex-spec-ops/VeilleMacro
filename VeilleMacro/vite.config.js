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
          rewrite: path => path.replace(/^\/api\/dust/, '/api/v1'),
          configure: proxy => {
            proxy.on('proxyReq', proxyReq => {
              proxyReq.setHeader('Authorization', `Bearer ${env.DUST_API_KEY}`);
            });
          },
        },
      },
    },
  };
});
