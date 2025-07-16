// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import LoadingScreen from '../components/LoadingScreen';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        // Au premier chargement de l'app, on vérifie si un token valide existe
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const decodedToken = jwtDecode(token);
                // Vérifier si le token est expiré
                if (decodedToken.exp * 1000 > Date.now()) {
                    setUser({
                        username: decodedToken.username,
                        role: decodedToken.role
                    });
                } else {
                    // Le token est expiré, on nettoie
                    localStorage.clear();
                }
            }
        } catch (error) {
            console.error("Erreur lors de la vérification initiale du token:", error);
            localStorage.clear();
        } finally {
            // Quoi qu'il arrive, la vérification est terminée
            setIsAuthLoading(false);
        }
    }, []);

    const login = (token) => {
        const decodedToken = jwtDecode(token);
        localStorage.setItem('token', token);
        // Stockez aussi username et role pour la compatibilité avec votre ancien code si besoin, mais la source de vérité sera le token
        localStorage.setItem('username', decodedToken.username);
        localStorage.setItem('userRole', decodedToken.role);
        setUser({
            username: decodedToken.username,
            role: decodedToken.role
        });
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    // Pendant que l'on vérifie l'état de connexion, on affiche le loader
    if (isAuthLoading) {
        return <LoadingScreen />;
    }

    const value = { user, login, logout, isLoggedIn: !!user };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personnalisé pour utiliser facilement le contexte
export const useAuth = () => {
    return useContext(AuthContext);
};