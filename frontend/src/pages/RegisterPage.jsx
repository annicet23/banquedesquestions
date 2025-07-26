// --- START OF FILE src/pages/RegisterPage.jsx (AVEC MENU DÉROULANT) ---

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/api';
// NOUVEAU : Importer la liste des grades
import { GRADES_LIST } from '../config/constants';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('saisie');
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [grade, setGrade] = useState(''); // L'état initial vide est parfait pour un select
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        // ... la fonction reste identique
        setMessage('');
        setError('');

        try {
            await apiClient.post('/register', {
                username,
                password,
                role,
                nom,
                prenom,
                grade
            });

            setMessage('Utilisateur enregistré avec succès !');
            setUsername('');
            setPassword('');
            setRole('saisie');
            setNom('');
            setPrenom('');
            setGrade('');

            setTimeout(() => {
                setMessage('');
                navigate('/users');
            }, 2000);
        } catch (err) {
            console.error('Erreur lors de l\'enregistrement:', err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Erreur lors de l\'enregistrement de l\'utilisateur.');
            }
        }
    };

    return (
        <div className="container mx-auto p-4 flex justify-center items-center h-screen-minus-navbar">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Enregistrer un Nouvel Utilisateur</h2>
                {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
                <form onSubmit={handleRegister}>
                    
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="grade">
                            Grade:
                        </label>
                        {/* MODIFIÉ : Remplacement de l'input par un select */}
                        <select
                            id="grade"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                        >
                            <option value="">-- Sélectionner un grade --</option>
                            {GRADES_LIST.map(g => (
                                <option key={g} value={g}>{g}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nom">
                            Nom:
                        </label>
                        <input
                            type="text"
                            id="nom"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="prenom">
                            Prénom:
                        </label>
                        <input
                            type="text"
                            id="prenom"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={prenom}
                            onChange={(e) => setPrenom(e.target.value)}
                        />
                    </div>
                    {/* ... Le reste du formulaire ne change pas ... */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                            Nom d'utilisateur (requis):
                        </label>
                        <input
                            type="text"
                            id="username"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="new-username"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Mot de passe (requis):
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                            Rôle (requis):
                        </label>
                        <select
                            id="role"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            required
                        >
                            <option value="saisie">Saisie</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Enregistrer
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/users')}
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
