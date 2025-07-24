// Contenu de /var/www/bdquestions/banquedesquestions/frontend/vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // Cette option que vous avez déjà permet d'accéder au site depuis
    // d'autres appareils sur le même réseau.
    host: true, // <-- CONSERVER CETTE LIGNE

    // ==========================================================
    // === AJOUTER CE BLOC 'proxy' DANS LA SECTION 'server' ===
    // ==========================================================
    proxy: {
      // Redirige les requêtes qui commencent par /api
      '/api': {
        target: 'http://localhost:5000', // L'adresse de votre backend Node.js
        changeOrigin: true, // Nécessaire pour les hôtes virtuels
      },
      // Redirige les requêtes pour les images qui commencent par /uploads
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
