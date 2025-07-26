// /var/www/bdquestions/banquedesquestions/frontend/vite.config.ts

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    host: true, 
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true, 
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },

  // ==========================================================
  // ===           AJOUTER TOUT CE BLOC 'build'             ===
  // ==========================================================
  build: {
    rollupOptions: {
      output: {
        // Crée des fichiers séparés pour les grosses bibliothèques
        // pour améliorer le caching et le chargement initial.
        manualChunks(id) {
          if (id.includes('jspdf')) {
            return 'jspdf';
          }
          if (id.includes('html2canvas')) {
            return 'html2canvas';
          }
          if (id.includes('docx')) {
            return 'docx';
          }
        }
      }
    }
  },

  // ==========================================================
  // ===         AJOUTER CETTE OPTION 'optimizeDeps'        ===
  // ==========================================================
  // Ceci empêche Vite de pré-compiler jspdf, ce qui est la cause
  // la plus probable de la suppression du module de cryptage.
  optimizeDeps: {
    exclude: ['jspdf']
  }
})
