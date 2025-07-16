// src/pages/PromotionManagementPage.jsx

import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';

const PromotionManagementPage = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);

    const [formState, setFormState] = useState({ nom_promotion: '', annee_debut: new Date().getFullYear(), description: '' });

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/promotions', { headers: { Authorization: `Bearer ${token}` } });
            setPromotions(response.data);
        } catch (err) {
            setError('Impossible de charger les promotions.');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (promotion = null) => {
        setEditingPromotion(promotion);
        if (promotion) {
            setFormState({ nom_promotion: promotion.nom_promotion, annee_debut: promotion.annee_debut, description: promotion.description || '' });
        } else {
            setFormState({ nom_promotion: '', annee_debut: new Date().getFullYear(), description: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPromotion(null);
        setError('');
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editingPromotion
            ? `http://localhost:5000/api/promotions/${editingPromotion.id}`
            : 'http://localhost:5000/api/promotions';
        const method = editingPromotion ? 'put' : 'post';
        try {
            await axios[method](url, formState, { headers: { Authorization: `Bearer ${token}` } });
            setMessage(`Promotion ${editingPromotion ? 'modifiée' : 'créée'} avec succès !`);
            closeModal();
            fetchPromotions();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue.');
        }
    };

    const handleDelete = async (promotionId) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cette promotion ? Les examens liés ne seront pas supprimés mais ne seront plus associés.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/promotions/${promotionId}`, { headers: { Authorization: `Bearer ${token}` } });
            setMessage('Promotion supprimée avec succès.');
            fetchPromotions();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression.');
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Gestion des Promotions</h1>
                    <button onClick={() => openModal()} className="flex items-center bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90 transition">
                        <Plus size={20} className="mr-2" />
                        Ajouter une Promotion
                    </button>
                </div>

                {message && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">{message}</div>}
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">{error}</div>}

                <div className="bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom de la Promotion</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Année</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {promotions.map((promo) => (
                                <tr key={promo.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{promo.nom_promotion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{promo.annee_debut}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openModal(promo)} className="text-indigo-600 hover:text-indigo-900 mr-3"><Pencil size={18}/></button>
                                        <button onClick={() => handleDelete(promo.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal pour Ajouter/Modifier */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    <div className="fixed inset-0 bg-black bg-opacity-30" />
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                    {editingPromotion ? 'Modifier la Promotion' : 'Ajouter une Promotion'}
                                </Dialog.Title>
                                <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
                                    <input name="nom_promotion" value={formState.nom_promotion} onChange={handleFormChange} placeholder="Nom (ex: Promo 80)" required className="w-full border-gray-300 rounded-md p-2"/>
                                    <input type="number" name="annee_debut" value={formState.annee_debut} onChange={handleFormChange} placeholder="Année de début" required className="w-full border-gray-300 rounded-md p-2" />
                                    <textarea name="description" value={formState.description} onChange={handleFormChange} placeholder="Description (optionnel)" rows="3" className="w-full border-gray-300 rounded-md p-2" />
                                    <div className="mt-6 flex justify-end space-x-2">
                                        <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg">Annuler</button>
                                        <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg">{editingPromotion ? 'Mettre à jour' : 'Ajouter'}</button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default PromotionManagementPage;