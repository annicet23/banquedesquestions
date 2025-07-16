// --- START OF FILE ChapitreManagementPage.jsx ---

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const ChapitreManagementPage = () => {
    const [chapitres, setChapitres] = useState([]);
    const [matieres, setMatieres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    // --- NOUVEAUX ÉTATS POUR LA CRÉATION EN MASSE ---
    const [nombreChapitresACreer, setNombreChapitresACreer] = useState('12'); // Par défaut à 12
    const [selectedMatiereId, setSelectedMatiereId] = useState('');

    // --- ÉTATS CONSERVÉS POUR L'ÉDITION INDIVIDUELLE ---
    const [editingChapitre, setEditingChapitre] = useState(null);
    const [editChapitreName, setEditChapitreName] = useState('');
    const [editChapitreDescription, setEditChapitreDescription] = useState('');
    const [editSelectedMatiereId, setEditSelectedMatiereId] = useState('');


    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchData();
        if (location.state?.prefilledMatiereId) {
            setSelectedMatiereId(location.state.prefilledMatiereId);
        }
    }, [location.state]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/login'); return; }

            const [matieresResponse, chapitresResponse] = await Promise.all([
                axios.get('http://localhost:5000/api/matieres', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/chapitres', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setMatieres(matieresResponse.data);
            setChapitres(chapitresResponse.data);

        } catch (err) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                navigate('/login');
            } else {
                setError('Impossible de charger les données.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- NOUVELLE FONCTION POUR LA CRÉATION EN MASSE ---
    const handleBulkAddChapitres = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        if (!selectedMatiereId || !nombreChapitresACreer) {
            setError('Veuillez sélectionner une matière et spécifier un nombre de chapitres.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            // L'API attend maintenant `nombre_a_creer`
            const response = await axios.post('http://localhost:5000/api/chapitres', {
                id_matiere: selectedMatiereId,
                nombre_a_creer: nombreChapitresACreer
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage(response.data.message); // Affiche le message de succès du backend
            fetchData(); // Rafraîchit la liste
            setTimeout(() => setMessage(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout des chapitres.');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleEditClick = (chapitre) => {
        setEditingChapitre(chapitre);
        setEditChapitreName(chapitre.nom_chapitre);
        setEditChapitreDescription(chapitre.description || '');
        setEditSelectedMatiereId(chapitre.id_matiere);
    };

    const handleCancelEdit = () => {
        setEditingChapitre(null);
        setEditChapitreName('');
        setEditChapitreDescription('');
        setEditSelectedMatiereId('');
    };

    // La mise à jour reste individuelle, ce qui est logique
    const handleUpdateChapitre = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        if (!editSelectedMatiereId) {
            setError('Veuillez sélectionner une matière.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/chapitres/${editingChapitre.id}`, {
                id_matiere: editSelectedMatiereId,
                nom_chapitre: editChapitreName,
                description: editChapitreDescription
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Chapitre modifié avec succès !');
            handleCancelEdit();
            fetchData();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la modification.');
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleDeleteChapitre = async (chapitreId) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce chapitre ?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/chapitres/${chapitreId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('Chapitre supprimé avec succès !');
            fetchData();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression.');
            setTimeout(() => setError(''), 3000);
        }
    };

    if (loading) return <p className="p-4">Chargement des chapitres...</p>;

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestion des Chapitres</h1>

                {message && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">{message}</div>}
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}

                {/* --- LE FORMULAIRE EST MAINTENANT CONDITIONNEL --- */}
                {editingChapitre ? (
                    // --- FORMULAIRE D'ÉDITION (INCHANGÉ) ---
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold mb-4">Modifier le Chapitre</h2>
                        <form onSubmit={handleUpdateChapitre} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="editMatiereSelect">Matière</label>
                                <select id="editMatiereSelect" value={editSelectedMatiereId} onChange={(e) => setEditSelectedMatiereId(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2">
                                    {matieres.map((matiere) => <option key={matiere.id} value={matiere.id}>{matiere.nom_matiere}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="editChapitreName">Nom du chapitre</label>
                                <input type="text" id="editChapitreName" value={editChapitreName} onChange={(e) => setEditChapitreName(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="editChapitreDescription">Description</label>
                                <textarea id="editChapitreDescription" value={editChapitreDescription} onChange={(e) => setEditChapitreDescription(e.target.value)} rows="3" className="w-full border-gray-300 rounded-md shadow-sm p-2"></textarea>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90 transition">Mettre à jour</button>
                                <button type="button" onClick={handleCancelEdit} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg">Annuler</button>
                            </div>
                        </form>
                    </div>
                ) : (
                    // --- NOUVEAU FORMULAIRE DE CRÉATION EN MASSE ---
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold mb-4">Créer des Chapitres en Masse</h2>
                        <form onSubmit={handleBulkAddChapitres} className="space-y-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="matiereSelect">
                                    Matière (doit avoir une abréviation)
                                </label>
                                <select id="matiereSelect" value={selectedMatiereId} onChange={(e) => setSelectedMatiereId(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2">
                                    <option value="">Sélectionnez une matière</option>
                                    {matieres.map((matiere) => (
                                        <option key={matiere.id} value={matiere.id}>{matiere.nom_matiere} ({matiere.abreviation || 'Pas d\'abbr.'})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="chapitreCount">
                                    Créer les chapitres jusqu'au numéro
                                </label>
                                <input
                                    type="number"
                                    id="chapitreCount"
                                    value={nombreChapitresACreer}
                                    onChange={(e) => setNombreChapitresACreer(e.target.value)}
                                    required
                                    min="1"
                                    className="w-full border-gray-300 rounded-md shadow-sm p-2"
                                    placeholder="Ex: 12"
                                />
                            </div>
                            <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90 transition">Créer les chapitres</button>
                        </form>
                    </div>
                )}


                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matière</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom du chapitre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {chapitres.map((chapitre) => (
                                <tr key={chapitre.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{chapitre.nom_matiere}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{chapitre.nom_chapitre}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{chapitre.description || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEditClick(chapitre)} className="text-indigo-600 hover:text-indigo-900 mr-3">Modifier</button>
                                        <button onClick={() => handleDeleteChapitre(chapitre.id)} className="text-red-600 hover:text-red-900">Supprimer</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ChapitreManagementPage;