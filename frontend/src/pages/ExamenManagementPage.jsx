// --- START OF FILE ExamenManagementPage.jsx (CORRIGÉ) ---

import React, { useState, useEffect, Fragment, useRef } from 'react';
// import axios from 'axios'; // <-- MODIFIÉ : On supprime axios
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, ListPlus, X } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import apiClient from '../config/api'; // <-- MODIFIÉ : On importe le client centralisé

const ExamenManagementPage = () => {
    const [examens, setExamens] = useState([]);
    const [allMatieres, setAllMatieres] = useState([]);
    const [allPromotions, setAllPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [selectedPromotionId, setSelectedPromotionId] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExamen, setEditingExamen] = useState(null);
    const [formState, setFormState] = useState({ titre: '', description: '', type_examen: 'Examen', id_promotion: '' });
    const [subjectsInExam, setSubjectsInExam] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                // <-- MODIFIÉ : Plus besoin du token, apiClient gère
                const [promotionsRes, matieresRes] = await Promise.all([
                    apiClient.get('/promotions'),
                    apiClient.get('/matieres'),
                ]);
                setAllPromotions(promotionsRes.data);
                setAllMatieres(matieresRes.data);
                if (promotionsRes.data.length > 0) {
                    setSelectedPromotionId(promotionsRes.data[0].id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                setError('Impossible de charger les données de base.');
                setLoading(false);
            }
        };
        fetchBaseData();
    }, []);

    useEffect(() => {
        if (!selectedPromotionId) return;
        const fetchExams = async () => {
            setLoading(true);
            try {
                // <-- MODIFIÉ : On utilise apiClient
                const response = await apiClient.get(`/examens?promotionId=${selectedPromotionId}`);
                setExamens(response.data);
            } catch (err) {
                setError('Impossible de charger les examens.');
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, [selectedPromotionId]);

    const openModal = async (examen = null) => {
        setEditingExamen(examen);
        if (examen) {
            // <-- MODIFIÉ : On utilise apiClient
            const { data } = await apiClient.get(`/examens/${examen.id}`);
            setFormState({ titre: data.titre, description: data.description || '', type_examen: data.type_examen, id_promotion: data.id_promotion });
            setSubjectsInExam(data.matieres.map(m => ({ id_matiere: m.id_matiere, nom_matiere: m.nom_matiere, coefficient: m.coefficient })));
        } else {
            setFormState({ titre: '', description: '', type_examen: 'Examen', id_promotion: selectedPromotionId });
            setSubjectsInExam([]);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);
    const handleFormChange = (e) => setFormState(p => ({ ...p, [e.target.name]: e.target.value }));
    const addSubjectToExam = (matiereId) => {
        if (!matiereId || subjectsInExam.some(s => s.id_matiere == matiereId)) return;
        const matiere = allMatieres.find(m => m.id == matiereId);
        setSubjectsInExam([...subjectsInExam, { id_matiere: matiere.id, nom_matiere: matiere.nom_matiere, coefficient: 1 }]);
    };
    const removeSubjectFromExam = (matiereId) => setSubjectsInExam(subjectsInExam.filter(s => s.id_matiere !== matiereId));
    const updateCoefficient = (matiereId, newCoeff) => setSubjectsInExam(subjectsInExam.map(s => s.id_matiere === matiereId ? { ...s, coefficient: parseInt(newCoeff, 10) || 1 } : s));

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (subjectsInExam.length === 0 || !formState.id_promotion) {
            setError('Promotion et au moins une matière sont requises.'); return;
        }
        const payload = { ...formState, matieres: subjectsInExam.map(({ id_matiere, coefficient }) => ({ id_matiere, coefficient })) };
        const url = editingExamen ? `/examens/${editingExamen.id}` : '/examens'; // <-- MODIFIÉ : URL relative
        const method = editingExamen ? 'put' : 'post';
        try {
            // <-- MODIFIÉ : On utilise apiClient[method]
            await apiClient[method](url, payload);
            setMessage(`Opération réussie !`);
            closeModal();
            // Refetch exams for the current promotion
            const response = await apiClient.get(`/examens?promotionId=${selectedPromotionId}`); // <-- MODIFIÉ
            setExamens(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue.');
        }
    };

    const handleDelete = async (examenId) => {
        if (!window.confirm('Voulez-vous vraiment supprimer cet examen ?')) return;
        // <-- MODIFIÉ : On utilise apiClient
        await apiClient.delete(`/examens/${examenId}`);
        // Refetch exams
        const response = await apiClient.get(`/examens?promotionId=${selectedPromotionId}`); // <-- MODIFIÉ
        setExamens(response.data);
    };

    // ... Le reste du JSX est déjà correct ...
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="sm:flex sm:justify-between sm:items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Gestion des Examens</h1>
                    <div className="mt-4 sm:mt-0 sm:flex sm:space-x-4">
                        <select id="promo-filter" value={selectedPromotionId} onChange={(e) => setSelectedPromotionId(e.target.value)} className="block w-full sm:w-56 border-gray-300 rounded-md p-2 shadow-sm">
                            {allPromotions.length === 0 && <option>Aucune promotion</option>}
                            {allPromotions.map(p => <option key={p.id} value={p.id}>{p.nom_promotion}</option>)}
                        </select>
                        <button onClick={() => openModal()} disabled={!selectedPromotionId || loading} className="w-full mt-2 sm:mt-0 sm:w-auto flex items-center justify-center bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            <Plus size={20} className="mr-2" /> Créer un Examen
                        </button>
                    </div>
                </div>

                {message && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">{message}</div>}

                <div className="bg-white rounded-lg shadow">
                    <div className="overflow-x-auto">
                        {loading ? <div className='p-6 text-center'>Chargement des examens...</div> : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Matières</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {examens.length > 0 ? examens.map((examen) => (
                                        <tr key={examen.id}>
                                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{examen.titre}</div><div className="text-xs text-gray-500">{new Date(examen.created_at).toLocaleDateString()}</div></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${examen.type_examen === 'Examen' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{examen.type_examen}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{examen.nombre_matieres}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">{examen.nombre_questions}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => { setEditingExamen(examen); openModal(examen); }} className="text-indigo-600 hover:text-indigo-900 mr-3"><Pencil size={18} /></button>
                                                <button onClick={() => navigate(`/examens/${examen.id}/questions`)} className="text-green-600 hover:text-green-900 mr-3"><ListPlus size={18} /></button>
                                                <button onClick={() => handleDelete(examen.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5" className="text-center py-8 text-gray-500">Aucun examen trouvé pour cette promotion.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            <Transition appear show={isModalOpen} as={Fragment}>
                 <Dialog as="div" className="relative z-30" onClose={closeModal}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto"><div className="flex min-h-full items-center justify-center p-4 text-center">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                        <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 mb-4">{editingExamen ? 'Modifier l\'Examen' : 'Créer un Examen'}</Dialog.Title>
                            <form onSubmit={handleFormSubmit} className="space-y-6">
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input name="titre" value={formState.titre} onChange={handleFormChange} placeholder="Titre de l'examen" required className="w-full border-gray-300 rounded-md p-3" />
                                    <select name="type_examen" value={formState.type_examen} onChange={handleFormChange} className="w-full border-gray-300 rounded-md p-3">
                                        <option>Examen</option><option>Test Journalier</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Promotion</label>
                                    <select name="id_promotion" value={formState.id_promotion} onChange={handleFormChange} required className="w-full mt-1 border-gray-300 rounded-md p-3">
                                        <option value="">-- Sélectionner --</option>
                                        {allPromotions.map(p => <option key={p.id} value={p.id}>{p.nom_promotion}</option>)}
                                    </select>
                                </div>
                                <textarea name="description" value={formState.description} onChange={handleFormChange} placeholder="Description (optionnel)" rows="2" className="w-full border-gray-300 rounded-md p-3" />
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold text-gray-700 mb-2">Matières & Coefficients</h4>
                                    <select onChange={(e) => {addSubjectToExam(e.target.value); e.target.value = "";}} value="" className="w-full mb-4 border-gray-300 rounded-md p-3">
                                        <option value="">-- Ajouter une matière --</option>
                                        {allMatieres.filter(m => !subjectsInExam.some(s => s.id_matiere === m.id)).map(m => <option key={m.id} value={m.id}>{m.nom_matiere}</option>)}
                                    </select>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                        {subjectsInExam.map(s => (<div key={s.id_matiere} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                                            <span className="font-medium text-gray-800">{s.nom_matiere}</span>
                                            <div className="flex items-center space-x-2">
                                                <label className="text-sm">Coeff:</label>
                                                <input type="number" min="1" value={s.coefficient} onChange={(e) => updateCoefficient(s.id_matiere, e.target.value)} className="w-16 text-center border-gray-300 rounded-md p-1" />
                                                <button type="button" onClick={() => removeSubjectFromExam(s.id_matiere)} className="text-red-500 hover:text-red-700 p-1"><X size={18}/></button>
                                            </div>
                                        </div>))}
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end space-x-2">
                                    <button type="button" onClick={closeModal} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300">Annuler</button>
                                    <button type="submit" className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-opacity-90">{editingExamen ? 'Mettre à jour' : 'Créer'}</button>
                                </div>
                            </form>
                        </Dialog.Panel>
                    </Transition.Child>
                    </div></div>
                 </Dialog>
            </Transition>
        </div>
    );
};

export default ExamenManagementPage;
