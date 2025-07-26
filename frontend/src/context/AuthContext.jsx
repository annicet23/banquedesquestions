// --- START OF FILE frontend/src/context/AuthContext.jsx (CORRIGÉ ET COMPLET) ---

import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Assurez-vous d'avoir installé jwt-decode
import apiClient from '../config/api';

// 1. Création du contexte
const AuthContext = createContext(null);

// 2. Création du Fournisseur (Provider) qui va gérer l'état
export const AuthProvider = ({ children }) => {
    // L'objet 'user' contiendra toutes les infos décodées du token (id, role, grade, etc.)
    const [user, setUser] = useState(null); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Au premier chargement de l'application, on vérifie le localStorage
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // On décode le token pour lire les informations
                const decodedUser = jwtDecode(token);

                // On vérifie que le token n'est pas expiré
                if (decodedUser.exp * 1000 > Date.now()) {
                    // Si le token est valide, on met à jour l'état de l'utilisateur
                    setUser(decodedUser);
                    // On configure l'en-tête pour tous les futurs appels API
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                } else {
                    // Le token est expiré, on nettoie
                    localStorage.removeItem('token');
                }
            } catch (error) {
                console.error("Token invalide ou corrompu.", error);
                localStorage.removeItem('token');
            }
        }
        // On a fini de vérifier, l'application peut s'afficher
        setLoading(false);
    }, []);

    const login = (authData) => {
        const { token } = authData;
        // On ne stocke QUE le token. C'est la seule chose nécessaire.
        localStorage.setItem('token', token);
        
        // On décode le token pour mettre à jour l'état immédiatement
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
        
        // On configure l'en-tête pour les appels API de cette session
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        delete apiClient.defaults.headers.common['Authorization'];
    };

    // On prépare la valeur à fournir à tous les composants enfants
    const value = { 
        user,               // L'objet utilisateur complet (ou null)
        login,              // La fonction de connexion
        logout,             // La fonction de déconnexion
        isAuthenticated: !!user, // Un booléen pratique pour savoir si on est connecté
        loading             // Pour savoir si l'authentification initiale est terminée
    };

    return (
        <AuthContext.Provider value={value}>
            {/* On n'affiche l'application que lorsque la vérification initiale est terminée */}
            {!loading && children}
        </AuthContext.Provider>
    );
};

// 3. Hook personnalisé pour utiliser le contexte plus facilement
export const useAuth = () => {
    return useContext(AuthContext);
};
