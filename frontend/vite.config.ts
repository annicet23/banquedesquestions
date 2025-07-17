import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ========================================================
  // === AJOUTER CETTE SECTION POUR LE TEST SUR LE RÉSEAU ===
  // ========================================================
  server: {
    // Cette option dit à Vite de s'exposer sur toutes les adresses réseau
    // disponibles, y compris votre IP locale (192.168.123.21).
    host: true
  }
})