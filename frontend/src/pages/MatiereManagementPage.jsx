// --- START OF FILE MatiereManagementPage.jsx (CORRIGÉ) ---

import React, { useState, useEffect, Fragment, useRef } from 'react';
// import axios from 'axios'; // <-- MODIFIÉ
import { useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Pencil, Trash, BookOpen, PlusCircle } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import apiClient from '../config/api'; // <-- MODIFIÉ

const MatiereManagementPage = () => {
    const [matieres, setMatieres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMatiere, setEditingMatiere] = useState(null);

    const [formState, setFormState] = useState({ nom_matiere: '', abreviation: '', description: '' });

    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchMatieres();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                if (!event.target.closest('.actions-trigger-button')) {
                    setOpenDropdownId(null);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchMatieres = async () => {
        setLoading(true);
        try {
            // <-- MODIFIÉ : Utilisation de apiClient
            const response = await apiClient.get('/matieres');
            setMatieres(response.data);
        } catch (err) {
            setError('Impossible de charger les matières.');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (matiere = null) => {
        setEditingMatiere(matiere);
        if (matiere) {
            setFormState({
                nom_matiere: matiere.nom_matiere,
                abreviation: matiere.abreviation || '',
                description: matiere.description || ''
            });
        } else {
            setFormState({ nom_matiere: '', abreviation: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMatiere(null);
        setError('');
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const url = editingMatiere ? `/matieres/${editingMatiere.id}` : '/matieres'; // <-- MODIFIÉ
        const method = editingMatiere ? 'put' : 'post';

        try {
            // <-- MODIFIÉ : Utilisation de apiClient[method]
            await apiClient[method](url, formState);
            setMessage(`Matière ${editingMatiere ? 'modifiée' : 'ajoutée'} avec succès !`);
            closeModal();
            fetchMatieres();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue.');
        }
    };

    const handleDelete = async (matiereId) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cette matière et tous ses chapitres ?')) return;
        try {
            // <-- MODIFIÉ : Utilisation de apiClient
            await apiClient.delete(`/matieres/${matiereId}`);
            setMessage('Matière supprimée avec succès !');
            fetchMatieres();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression.');
        }
    };

    const handleNavigateToAddChapter = (matiereId) => {
        navigate('/chapitres', { state: { prefilledMatiereId: matiereId } });
    };

    const handleViewChapters = (matiereId) => {
        navigate('/chapitres', { state: { prefilledMatiereId: matiereId } });
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    // ... Le JSX est déjà correct et ne change pas ...
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Gestion des Matières</h1>
                    <button onClick={() => openModal()} className="flex items-center bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90 transition">
                        <Plus size={20} className="mr-2" />
                        Ajouter une Matière
                    </button>
                </div>

                {message && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">{message}</div>}

                <div className="bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom de la matière</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abréviation</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Chapitres</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {matieres.map((matiere) => (
                                <tr key={matiere.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{matiere.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{matiere.nom_matiere}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{matiere.abreviation || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{matiere.description || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{matiere.nombre_chapitres}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                        <button onClick={() => setOpenDropdownId(openDropdownId === matiere.id ? null : matiere.id)} className="actions-trigger-button text-gray-500 hover:text-primary p-1 rounded-full hover:bg-gray-100">
                                            <MoreVertical size={20} />
                                        </button>
                                        {openDropdownId === matiere.id && (
                                            <div ref={dropdownRef} className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                                                <div className="py-1">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); openModal(matiere); setOpenDropdownId(null); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                        <Pencil size={16} className="mr-3" /> Modifier
                                                    </a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigateToAddChapter(matiere.id); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                        <PlusCircle size={16} className="mr-3" /> Ajouter un chapitre
                                                    </a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleViewChapters(matiere.id); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                                        <BookOpen size={16} className="mr-3" /> Voir les chapitres
                                                    </a>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleDelete(matiere.id); setOpenDropdownId(null); }} className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                                        <Trash size={16} className="mr-3" /> Supprimer
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-30" onClose={closeModal}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black bg-opacity-30" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        {editingMatiere ? 'Modifier la Matière' : 'Ajouter une nouvelle Matière'}
                                    </Dialog.Title>
                                    <form onSubmit={handleFormSubmit} className="mt-4">
                                        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
                                        <div className="space-y-4">
                                            <input name="nom_matiere" value={formState.nom_matiere} onChange={handleFormChange} placeholder="Nom de la matière" required className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-primary focus:border-primary" />
                                            <input name="abreviation" value={formState.abreviation} onChange={handleFormChange} placeholder="Abréviation (ex: MTH)" className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-primary focus:border-primary" />
                                            <textarea name="description" value={formState.description} onChange={handleFormChange} placeholder="Description" rows="3" className="w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-primary focus:border-primary" />
                                        </div>
                                        <div className="mt-6 flex justify-end space-x-2">
                                            <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Annuler</button>
                                            <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all">{editingMatiere ? 'Mettre à jour' : 'Ajouter'}</button>
                                        </div>
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default MatiereManagementPage;
