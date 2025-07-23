// --- START OF FILE frontend/src/config/api.jsx (VERSION CORRIGÉE) ---

import axios from 'axios';

// 1. Lire l'URL de base pour l'API depuis les variables d'environnement.
//    Exemple: http://localhost:5000/api
const API_URL = import.meta.env.VITE_API_BASE_URL;

// 2. NOUVEAU : Définir explicitement l'URL pour les ressources statiques (images).
//    C'est la même URL que l'API, mais SANS le suffixe '/api'.
//    Exemple: http://localhost:5000
const STATIC_RESOURCES_URL = API_URL.replace('/api', '');


// 3. Créer un client Axios pré-configuré pour les appels API.
const apiClient = axios.create({
  baseURL: API_URL, // La base pour les appels API (ex: /questions)
});


// 4. NOUVEAU : On attache notre URL statique à l'instance apiClient.
//    Ceci permet de l'importer et de l'utiliser facilement partout dans l'application.
apiClient.defaults.staticBaseURL = STATIC_RESOURCES_URL;


// 5. Intercepteur pour ajouter le token JWT à chaque requête automatiquement.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// 6. Exporter le client configuré.
export default apiClient;

// --- END OF FILE frontend/src/config/api.jsx ---
