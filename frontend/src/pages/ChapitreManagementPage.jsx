// --- START OF FILE ChapitreManagementPage.jsx (CORRIGÉ ET AMÉLIORÉ) ---

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../config/api';

const ChapitreManagementPage = () => {
    const [chapitres, setChapitres] = useState([]);
    const [matieres, setMatieres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    // --- NOUVEL ÉTAT POUR LES ONGLETS DE CRÉATION ---
    const [creationMode, setCreationMode] = useState('bulk'); // 'bulk' ou 'single'

    // --- ÉTATS POUR LA CRÉATION EN MASSE ---
    const [bulkMatiereId, setBulkMatiereId] = useState('');
    const [nombreChapitresACreer, setNombreChapitresACreer] = useState('12');
    
    // --- NOUVEAUX ÉTATS POUR LA CRÉATION INDIVIDUELLE ---
    const [singleMatiereId, setSingleMatiereId] = useState('');
    const [singleChapitreName, setSingleChapitreName] = useState('');
    const [singleChapitreDescription, setSingleChapitreDescription] = useState('');

    // --- ÉTATS POUR LE RENOMMAGE EN MASSE ---
    const [renameMatiereId, setRenameMatiereId] = useState('');
    const [renamePrefix, setRenamePrefix] = useState('Chapitre');
    const [renameStartNumber, setRenameStartNumber] = useState('1');

    // --- ÉTATS POUR L'ÉDITION/RENOMMAGE INDIVIDUEL ---
    const [editingChapitre, setEditingChapitre] = useState(null);
    const [editChapitreName, setEditChapitreName] = useState('');
    const [editChapitreDescription, setEditChapitreDescription] = useState('');
    const [editSelectedMatiereId, setEditSelectedMatiereId] = useState('');

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        fetchData();
        if (location.state?.prefilledMatiereId) {
            const prefilledId = location.state.prefilledMatiereId;
            setBulkMatiereId(prefilledId);
            setSingleMatiereId(prefilledId);
            setRenameMatiereId(prefilledId);
        }
    }, [location.state]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [matieresResponse, chapitresResponse] = await Promise.all([
                apiClient.get('/matieres'),
                apiClient.get('/chapitres')
            ]);
            setMatieres(matieresResponse.data);
            setChapitres(chapitresResponse.data);
        } catch (err) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) navigate('/login');
            else setError('Impossible de charger les données.');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAddChapitres = async (e) => {
        e.preventDefault();
        setMessage(''); setError('');
        if (!bulkMatiereId || !nombreChapitresACreer) {
            setError('Veuillez sélectionner une matière et un nombre.');
            return;
        }
        try {
            const response = await apiClient.post('/chapitres', {
                id_matiere: bulkMatiereId,
                nombre_a_creer: nombreChapitresACreer
            });
            setMessage(response.data.message);
            fetchData();
            setTimeout(() => setMessage(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout.');
            setTimeout(() => setError(''), 5000);
        }
    };

    // --- NOUVELLE FONCTION POUR L'AJOUT INDIVIDUEL ---
    const handleSingleAddChapitre = async (e) => {
        e.preventDefault();
        setMessage(''); setError('');
        if (!singleMatiereId || !singleChapitreName) {
            setError('Veuillez sélectionner une matière et entrer un nom.');
            return;
        }
        try {
            const response = await apiClient.post('/chapitres', {
                id_matiere: singleMatiereId,
                nom_chapitre: singleChapitreName,
                description: singleChapitreDescription,
            });
            setMessage(response.data.message);
            fetchData();
            // Réinitialiser le formulaire
            setSingleChapitreName('');
            setSingleChapitreDescription('');
            setTimeout(() => setMessage(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de l\'ajout.');
            setTimeout(() => setError(''), 5000);
        }
    };

    const handleBulkRename = async (e) => {
        e.preventDefault();
        setMessage(''); setError('');
        if (!renameMatiereId || !renamePrefix) {
            setError('Veuillez sélectionner une matière et un préfixe.');
            return;
        }
        try {
            const response = await apiClient.post('/chapitres/rename-bulk', {
                id_matiere: renameMatiereId,
                nouveau_prefixe: renamePrefix,
                commencer_a: renameStartNumber
            });
            setMessage(response.data.message);
            fetchData();
            setTimeout(() => setMessage(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du renommage.');
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
    };

    const handleUpdateChapitre = async (e) => {
        e.preventDefault();
        setMessage(''); setError('');
        if (!editSelectedMatiereId) {
            setError('Veuillez sélectionner une matière.');
            return;
        }
        try {
            await apiClient.put(`/chapitres/${editingChapitre.id}`, {
                id_matiere: editSelectedMatiereId,
                nom_chapitre: editChapitreName,
                description: editChapitreDescription
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
        if (!window.confirm('Êtes-vous sûr ?')) return;
        try {
            await apiClient.delete(`/chapitres/${chapitreId}`);
            setMessage('Chapitre supprimé avec succès !');
            fetchData();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression.');
            setTimeout(() => setError(''), 3000);
        }
    };

    if (loading) return <p className="p-4">Chargement...</p>;

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestion des Chapitres</h1>

                {message && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">{message}</div>}
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}

                {/* --- Formulaire d'édition/renommage individuel (déjà présent) --- */}
                {editingChapitre ? (
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold mb-4">Modifier le Chapitre "{editingChapitre.nom_chapitre}"</h2>
                        <form onSubmit={handleUpdateChapitre} className="space-y-4">
                            {/* ... (contenu du formulaire d'édition inchangé) ... */}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* --- BLOC DE GAUCHE : CRÉATION --- */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4">Créer un ou plusieurs chapitres</h2>
                            
                            {/* Onglets pour basculer de mode */}
                            <div className="flex border-b mb-4">
                                <button onClick={() => setCreationMode('bulk')} className={`py-2 px-4 -mb-px ${creationMode === 'bulk' ? 'border-b-2 border-primary text-primary font-semibold' : 'text-gray-500'}`}>
                                    En Masse
                                </button>
                                <button onClick={() => setCreationMode('single')} className={`py-2 px-4 -mb-px ${creationMode === 'single' ? 'border-b-2 border-primary text-primary font-semibold' : 'text-gray-500'}`}>
                                    Individuel
                                </button>
                            </div>

                            {/* Formulaire de création en masse */}
                            {creationMode === 'bulk' && (
                                <form onSubmit={handleBulkAddChapitres} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="bulkMatiereSelect">Matière (avec abréviation)</label>
                                        <select id="bulkMatiereSelect" value={bulkMatiereId} onChange={(e) => setBulkMatiereId(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2">
                                            <option value="">Sélectionnez</option>
                                            {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom_matiere} ({m.abreviation || 'N/A'})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="chapitreCount">Créer jusqu'au N°</label>
                                        <input type="number" id="chapitreCount" value={nombreChapitresACreer} onChange={(e) => setNombreChapitresACreer(e.target.value)} required min="1" className="w-full p-2 border-gray-300 rounded-md shadow-sm" />
                                    </div>
                                    <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90 transition">Créer en masse</button>
                                </form>
                            )}
                            
                            {/* NOUVEAU : Formulaire de création individuelle */}
                            {creationMode === 'single' && (
                                <form onSubmit={handleSingleAddChapitre} className="space-y-4">
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="singleMatiereSelect">Matière</label>
                                        <select id="singleMatiereSelect" value={singleMatiereId} onChange={(e) => setSingleMatiereId(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2">
                                            <option value="">Sélectionnez</option>
                                            {matieres.map((m) => <option key={m.id} value={m.id}>{m.nom_matiere}</option>)}
                                        </select>
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="singleChapitreName">Nom du chapitre</label>
                                        <input type="text" id="singleChapitreName" value={singleChapitreName} onChange={(e) => setSingleChapitreName(e.target.value)} required className="w-full p-2 border-gray-300 rounded-md shadow-sm" placeholder="Ex: Introduction à la POO"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="singleChapitreDesc">Description (optionnel)</label>
                                        <textarea id="singleChapitreDesc" value={singleChapitreDescription} onChange={(e) => setSingleChapitreDescription(e.target.value)} rows="2" className="w-full p-2 border-gray-300 rounded-md shadow-sm"></textarea>
                                    </div>
                                    <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90 transition">Créer ce chapitre</button>
                                </form>
                            )}
                        </div>

                        {/* --- BLOC DE DROITE : RENOMMAGE --- */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4">Renommer en masse</h2>
                            <form onSubmit={handleBulkRename} className="space-y-4">
                                {/* ... (contenu du formulaire de renommage inchangé) ... */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="renameMatiereSelect">Matière à renommer</label>
                                    <select id="renameMatiereSelect" value={renameMatiereId} onChange={(e) => setRenameMatiereId(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2">
                                        <option value="">Sélectionnez une matière</option>
                                        {matieres.map((matiere) => <option key={matiere.id} value={matiere.id}>{matiere.nom_matiere}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="renamePrefix">Nouveau préfixe</label>
                                        <input type="text" id="renamePrefix" value={renamePrefix} onChange={(e) => setRenamePrefix(e.target.value)} required className="w-full border-gray-300 rounded-md shadow-sm p-2" placeholder="Ex: Chapitre"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="renameStart">Début N°</label>
                                        <input type="number" id="renameStart" value={renameStartNumber} onChange={(e) => setRenameStartNumber(e.target.value)} required min="0" className="w-full border-gray-300 rounded-md shadow-sm p-2" />
                                    </div>
                                </div>
                                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition">Renommer en masse</button>
                            </form>
                        </div>
                    </div>
                )}
                
                {/* --- Tableau des chapitres --- */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        {/* ... (contenu du tableau inchangé) ... */}
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
