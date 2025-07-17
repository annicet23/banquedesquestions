import axios from 'axios';

// 1. On lit l'URL de base de l'API depuis les variables d'environnement (.env.development ou .env.production)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// On vérifie si la variable est bien définie, sinon on affiche une erreur claire.
if (!API_BASE_URL) {
  console.error(
    "La variable d'environnement VITE_API_BASE_URL n'est pas définie." +
    " Assurez-vous d'avoir un fichier .env.development ou .env.production."
  );
}

// 2. On crée une instance d'axios avec la configuration de base
const apiClient = axios.create({
  baseURL: API_BASE_URL, // Toutes les requêtes utiliseront cette base
});

// 3. On utilise un "intercepteur" pour ajouter AUTOMATIQUEMENT le token JWT à chaque requête
//    Ceci nous évite d'avoir à ajouter le header "Authorization" manuellement partout.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Si un token est trouvé dans le localStorage, on l'ajoute aux headers de la requête
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config; // On retourne la configuration mise à jour
  },
  (error) => {
    // En cas d'erreur lors de la configuration de la requête
    return Promise.reject(error);
  }
);

// 4. On exporte notre client pré-configuré pour l'utiliser dans nos composants
export default apiClient;