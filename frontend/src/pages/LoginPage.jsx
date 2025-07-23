// --- START OF FILE frontend/src/pages/LoginPage.jsx (VERSION FINALE AVEC CONTEXT) ---

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import apiClient from '../config/api';
import { useAuth } from '../context/AuthContext'; // <--- IMPORT CRUCIAL

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth(); // <--- ON RÉCUPÈRE LA FONCTION "login" DU CONTEXTE

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await apiClient.post('/login', {
                username,
                password,
            });

            // --- LA SEULE ACTION NÉCESSAIRE ---
            // On appelle la fonction `login` du contexte.
            // Elle s'occupera du localStorage ET de mettre à jour l'état global de l'app.
            login(response.data);

            navigate('/dashboard');

        } catch (err) {
            console.error('Erreur de connexion:', err);
            setError(err.response?.data?.message || 'Erreur de connexion. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    // Le JSX reste identique
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="flex w-full max-w-5xl mx-auto overflow-hidden bg-white rounded-2xl shadow-2xl">
                {/* --- Section Formulaire (Gauche) --- */}
                <div className="w-full md:w-1/2 p-8 md:p-12">
                    <div className="text-left mb-10">
                         <h1 className="text-4xl font-bold text-gray-800">Bienvenue</h1>
                         <p className="mt-2 text-gray-500">
                            Connectez-vous pour accéder à votre tableau de bord.
                         </p>
                    </div>

                    {error && <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm" role="alert">{error}</div>}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-700">Nom d'utilisateur</label>
                            <input
                                id="username"
                                type="text"
                                autoComplete="username"
                                required
                                className="block w-full px-4 py-3 text-base text-gray-900 placeholder-gray-400 bg-gray-100 border-2 border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-primary transition-all"
                                placeholder="Entrez votre nom d'utilisateur"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="password"className="block mb-2 text-sm font-medium text-gray-700">Mot de passe</label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="block w-full px-4 py-3 text-base text-gray-900 placeholder-gray-400 bg-gray-100 border-2 border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-primary transition-all"
                                placeholder="************"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-primary hover:bg-opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-primary/60 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg"
                            >
                                <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                                    <LogIn className="h-5 w-5 text-primary-foreground" />
                                </span>
                                {loading ? 'Connexion...' : 'Se connecter'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* --- Section Image (Droite) --- */}
                <div className="hidden md:block w-1/2">
                    <img
                        src="/eg.png"
                        alt="Illustration de concept de sécurité"
                        className="object-cover w-full h-full"
                    />
                </div>

            </div>
        </div>
    );
};

export default LoginPage;
