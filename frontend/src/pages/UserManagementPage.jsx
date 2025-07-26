// --- START OF FILE UserManagementPage.jsx (COMPLET ET FONCTIONNEL) ---

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/api';
import { GRADES_LIST } from '../config/constants'; // Assurez-vous d'avoir ce fichier

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // NOUVEAU : État pour l'utilisateur en cours d'édition
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
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

    // NOUVEAU : Fonction pour mettre à jour un utilisateur
    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser) return;

        try {
            await apiClient.put(`/users/${editingUser.id}`, editingUser);
            setMessage('Utilisateur mis à jour avec succès !');
            setEditingUser(null); // Ferme le formulaire
            fetchUsers(); // Rafraîchit la liste
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour.';
            setError(errorMessage);
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
            return;
        }
        try {
            await apiClient.delete(`/users/${userId}`);
            setMessage('Utilisateur supprimé avec succès !');
            fetchUsers();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression.';
            setError(errorMessage);
            setTimeout(() => setError(''), 5000);
        }
    };
    
    // NOUVEAU : Gère le clic sur le bouton "Modifier"
    const handleEditClick = (user) => {
        setEditingUser({ ...user, password: '' }); // Pré-remplit le formulaire avec les données de l'utilisateur
        window.scrollTo(0, 0); // Fait remonter en haut de la page pour voir le formulaire
    };

    if (loading) return <p>Chargement des utilisateurs...</p>;

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Gestion des Comptes Utilisateurs</h2>
            
            {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{message}</div>}
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}

            {/* NOUVEAU : Formulaire de modification qui s'affiche conditionnellement */}
            {editingUser && (
                <div className="bg-gray-100 p-6 rounded-lg mb-6 shadow-md">
                    <h3 className="text-xl font-bold mb-4">Modifier l'utilisateur : {editingUser.username}</h3>
                    <form onSubmit={handleUpdateUser}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-grade">Grade</label>
                                <select id="edit-grade" value={editingUser.grade || ''} onChange={(e) => setEditingUser({...editingUser, grade: e.target.value})} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">
                                    <option value="">-- Sélectionner --</option>
                                    {GRADES_LIST.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-nom">Nom</label>
                                <input id="edit-nom" type="text" value={editingUser.nom || ''} onChange={(e) => setEditingUser({...editingUser, nom: e.target.value})} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"/>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-prenom">Prénom</label>
                                <input id="edit-prenom" type="text" value={editingUser.prenom || ''} onChange={(e) => setEditingUser({...editingUser, prenom: e.target.value})} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"/>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-username">Nom d'utilisateur</label>
                                <input id="edit-username" type="text" value={editingUser.username} onChange={(e) => setEditingUser({...editingUser, username: e.target.value})} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"/>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-password">Nouveau Mot de Passe (laisser vide si inchangé)</label>
                                <input id="edit-password" type="password" value={editingUser.password} onChange={(e) => setEditingUser({...editingUser, password: e.target.value})} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"/>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-role">Rôle</label>
                                <select id="edit-role" value={editingUser.role} onChange={(e) => setEditingUser({...editingUser, role: e.target.value})} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700">
                                    <option value="saisie">Saisie</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-end mt-4">
                            <button type="button" onClick={() => setEditingUser(null)} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2">
                                Annuler
                            </button>
                            <button type="submit" className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
                                Mettre à jour
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
                onClick={() => navigate('/register')}
            >
                Ajouter un Nouvel Utilisateur
            </button>

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b text-left">Nom d'utilisateur</th>
                            <th className="py-2 px-4 border-b text-left">Grade</th>
                            <th className="py-2 px-4 border-b text-left">Nom</th>
                            <th className="py-2 px-4 border-b text-left">Prénom</th>
                            <th className="py-2 px-4 border-b text-left">Rôle</th>
                            <th className="py-2 px-4 border-b text-left">Date de création</th>
                            <th className="py-2 px-4 border-b text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-100">
                                <td className="py-2 px-4 border-b">{user.username}</td>
                                <td className="py-2 px-4 border-b">{user.grade || 'N/A'}</td>
                                <td className="py-2 px-4 border-b">{user.nom || 'N/A'}</td>
                                <td className="py-2 px-4 border-b">{user.prenom || 'N/A'}</td>
                                <td className="py-2 px-4 border-b">{user.role}</td>
                                <td className="py-2 px-4 border-b">{new Date(user.created_at).toLocaleDateString()}</td>
                                <td className="py-2 px-4 border-b">
                                    <button
                                        className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded text-sm mr-2"
                                        onClick={() => handleEditClick(user)}
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
        </div>
    );
};

export default UserManagementPage;
