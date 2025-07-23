// --- START OF FILE UserManagementPage.jsx (CORRIGÉ) ---

import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // <-- MODIFIÉ
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/api'; // <-- MODIFIÉ

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            // <-- MODIFIÉ : Utilisation de apiClient
            const response = await apiClient.get('/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Erreur lors de la récupération des utilisateurs:', err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                navigate('/login');
            } else {
                setError('Impossible de charger les utilisateurs.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
            return;
        }
        try {
            // <-- MODIFIÉ : Utilisation de apiClient
            await apiClient.delete(`/users/${userId}`);
            setMessage('Utilisateur supprimé avec succès !');
            fetchUsers();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Erreur lors de la suppression de l\'utilisateur:', err);
            if (err.response && err.response.status === 403) {
                setMessage('Vous n\'êtes pas autorisé à supprimer cet utilisateur (ou vous ne pouvez pas supprimer votre propre compte).');
            } else if (err.response && err.response.status === 404) {
                 setMessage('Utilisateur non trouvé.');
            } else {
                setMessage('Erreur lors de la suppression.');
            }
            setTimeout(() => setMessage(''), 3000);
        }
    };

    if (loading) {
        return <p>Chargement des utilisateurs...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    // ... Le JSX est déjà correct ...
    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Gestion des Comptes Utilisateurs</h2>
            {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{message}</div>}

            <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
                onClick={() => navigate('/register')}
            >
                Ajouter un Nouvel Utilisateur
            </button>

            <table className="min-w-full bg-white border border-gray-300">
                <thead>
                    <tr>
                        <th className="py-2 px-4 border-b text-left">ID</th>
                        <th className="py-2 px-4 border-b text-left">Nom d'utilisateur</th>
                        <th className="py-2 px-4 border-b text-left">Rôle</th>
                        <th className="py-2 px-4 border-b text-left">Date de création</th>
                        <th className="py-2 px-4 border-b text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-100">
                            <td className="py-2 px-4 border-b">{user.id}</td>
                            <td className="py-2 px-4 border-b">{user.username}</td>
                            <td className="py-2 px-4 border-b">{user.role}</td>
                            <td className="py-2 px-4 border-b">{new Date(user.created_at).toLocaleDateString()}</td>
                            <td className="py-2 px-4 border-b">
                                <button
                                    className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded text-sm mr-2"
                                    onClick={() => alert('Fonctionnalité de modification à venir !')}
                                >
                                    Modifier
                                </button>
                                <button
                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                                    onClick={() => handleDeleteUser(user.id)}
                                >
                                    Supprimer
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagementPage;
