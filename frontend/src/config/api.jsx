// 1. Lire l'URL de base depuis les variables d'environnement.
//    Vite expose les variables via `import.meta.env`.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 2. Créer un objet qui contient TOUTES les routes de votre API.
//    C'est la SEULE et UNIQUE source de vérité pour vos URLs d'API.
export const apiUrls = {
  // Authentification
  login: `${API_BASE_URL}/login`,
  register: `${API_BASE_URL}/register`,

  // Utilisateurs
  users: {
    getAll: `${API_BASE_URL}/users`,
    deleteById: (userId) => `${API_BASE_URL}/users/${userId}`,
  },

  // Matières
  matieres: {
    getAll: `${API_BASE_URL}/matieres`,
    // etc.
  },

  // Ajoutez ici toutes vos autres routes...
};

// 3. (Optionnel mais recommandé) Créer un client Axios pré-configuré
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_BASE_URL, // La base est déjà définie ici !
});

// On ajoute le token JWT à chaque requête automatiquement
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

export default apiClient;