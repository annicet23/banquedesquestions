import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// AJOUT: Import de l'icône pour l'export et de la bibliothèque jsPDF
import { PlusCircle, List, Pencil, Trash2, XCircle, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';

const QuestionManagementPage = () => {
    // === ÉTATS ===
    const DEFAULT_REPONSES_COUNT = 6;
    const [nombreReponses, setNombreReponses] = useState(DEFAULT_REPONSES_COUNT);
    const [reponses, setReponses] = useState(Array(DEFAULT_REPONSES_COUNT).fill(''));

    const [allMatieres, setAllMatieres] = useState([]);
    const [chapitresForMatiere, setChapitresForMatiere] = useState([]);
    const [questionsInCurrentContext, setQuestionsInCurrentContext] = useState([]);
    const [selectedMatiereId, setSelectedMatiereId] = useState('');
    const [selectedChapitreId, setSelectedChapitreId] = useState('');
    const [enonce, setEnonce] = useState('');
    const [points, setPoints] = useState('1');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const formRef = useRef(null);

    // === EFFETS DE BORD (useEffect) ===

    useEffect(() => {
        const fetchMatieres = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get('http://localhost:5000/api/matieres', { headers: { Authorization: `Bearer ${token}` } });
                setAllMatieres(res.data);
            } catch (err) {
                setError('Impossible de charger les matières.');
            } finally {
                setLoading(false);
            }
        };
        fetchMatieres();
    }, []);

    useEffect(() => {
        if (!selectedMatiereId) {
            setChapitresForMatiere([]);
            setQuestionsInCurrentContext([]);
            return;
        }
        const fetchContextData = async () => {
            const token = localStorage.getItem('token');
            try {
                // AJOUT: Utilisation de Promise.allSettled pour une meilleure gestion des erreurs partielles
                const [chapitresRes, questionsRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/chapitres?matiereId=${selectedMatiereId}`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`http://localhost:5000/api/questions?matiereId=${selectedMatiereId}`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                // La logique de filtrage des chapitres est maintenant faite côté backend avec `?matiereId=...`
                // mais un filtrage client reste une bonne sécurité.
                setChapitresForMatiere(chapitresRes.data);
                setQuestionsInCurrentContext(questionsRes.data);
            } catch (err) {
                console.error("Erreur chargement contexte", err);
                setError("Erreur lors du chargement des données.");
            }
        };
        fetchContextData();
    }, [selectedMatiereId]);

    // === FONCTIONS ===

    const handleNombreReponsesChange = (e) => {
        const newSize = parseInt(e.target.value, 10) || 1;
        const clampedSize = Math.max(DEFAULT_REPONSES_COUNT, Math.min(10, newSize));
        setNombreReponses(clampedSize);
        setReponses(currentReponses => {
            const newReponses = Array(clampedSize).fill('');
            currentReponses.forEach((rep, i) => {
                if (i < clampedSize) newReponses[i] = rep;
            });
            return newReponses;
        });
    };

    const resetQuestionForm = () => {
        setEnonce('');
        setPoints('1');
        setNombreReponses(DEFAULT_REPONSES_COUNT);
        setReponses(Array(DEFAULT_REPONSES_COUNT).fill(''));
        setError('');
        setMessage('');
        setEditingQuestionId(null);
        setSelectedChapitreId('');
    };

    const handleStartEdit = (question) => {
        setEditingQuestionId(question.id);
        setSelectedChapitreId(question.id_chapitre || '');
        setEnonce(question.enonce);
        setPoints(String(question.points));

        let reponsesFromDb = [];
        const rawReponses = Array.isArray(question.reponses) ? question.reponses : [];

        if (rawReponses.length > 0) {
            if (typeof rawReponses[0] === 'string') {
                reponsesFromDb = rawReponses;
            } else if (typeof rawReponses[0] === 'object' && rawReponses[0] !== null) {
                reponsesFromDb = rawReponses
                    .filter(r => r.est_correcte === true || r.est_correcte === undefined)
                    .map(r => r.texte);
            }
        }

        const numFieldsToShow = Math.max(DEFAULT_REPONSES_COUNT, reponsesFromDb.length);
        setNombreReponses(numFieldsToShow);

        const newReponsesState = Array(numFieldsToShow).fill('');
        reponsesFromDb.forEach((repTexte, index) => {
            newReponsesState[index] = repTexte;
        });
        setReponses(newReponsesState);

        setMessage('');
        setError('');
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDelete = async (questionId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/questions/${questionId}`, { headers: { Authorization: `Bearer ${token}` } });
                setQuestionsInCurrentContext(prev => prev.filter(q => q.id !== questionId));
                setMessage('Question supprimée.');
                setTimeout(() => setMessage(''), 3000);
            } catch (err) {
                setError(err.response?.data?.message || 'Erreur lors de la suppression.');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!selectedMatiereId) {
            setError('Veuillez sélectionner une matière.'); return;
        }

        const filledReponsesText = reponses.map(r => String(r).trim()).filter(r => r !== '');

        if (filledReponsesText.length === 0) {
            setError('Veuillez fournir au moins une réponse valide.');
            return;
        }

        const reponsesPayload = filledReponsesText.map(texteReponse => ({
            texte: texteReponse,
            est_correcte: true
        }));

        const pointsAsNumber = parseFloat(String(points).replace(',', '.'));
        if (isNaN(pointsAsNumber) || pointsAsNumber <= 0) {
            setError('Veuillez entrer un nombre de points valide et positif (ex: 1.5 ou 1,5).');
            return;
        }

        const payload = {
            id_matiere: selectedMatiereId,
            id_chapitre: selectedChapitreId || null,
            enonce,
            type_question: 'QCM',
            points: pointsAsNumber,
            reponses: reponsesPayload
        };

        const token = localStorage.getItem('token');
        const headers = { headers: { Authorization: `Bearer ${token}` } };

        try {
            let updatedQuestion;
            if (editingQuestionId) {
                await axios.put(`http://localhost:5000/api/questions/${editingQuestionId}`, payload, headers);
                const nomChapitre = chapitresForMatiere.find(c => c.id == selectedChapitreId)?.nom_chapitre || null;
                updatedQuestion = { ...payload, id: editingQuestionId, nom_chapitre: nomChapitre };
                setQuestionsInCurrentContext(prev => prev.map(q =>
                    q.id === editingQuestionId ? updatedQuestion : q
                ));
                setMessage('Question modifiée avec succès !');
            } else {
                const response = await axios.post('http://localhost:5000/api/questions', payload, headers);
                const nomChapitre = chapitresForMatiere.find(c => c.id == selectedChapitreId)?.nom_chapitre || null;
                updatedQuestion = { ...response.data, ...payload, id: response.data.id, nom_chapitre: nomChapitre };
                setQuestionsInCurrentContext(prev => [updatedQuestion, ...prev]);
                setMessage('Question ajoutée avec succès !');
            }
            resetQuestionForm();
            setTimeout(() => setMessage(''), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue.');
        }
    };

    // AJOUT: Fonction pour exporter en PDF
    const handleExportPDF = () => {
        if (questionsInCurrentContext.length === 0) {
            alert("Aucune question à exporter.");
            return;
        }

        const doc = new jsPDF();
        const selectedMatiere = allMatieres.find(m => m.id == selectedMatiereId);
        const nomMatiere = selectedMatiere ? selectedMatiere.nom_matiere : 'Matière inconnue';
        const date = new Date().toLocaleDateString('fr-FR');

        // Constantes de mise en page
        const pageMargin = 15;
        const pageContentWidth = doc.internal.pageSize.getWidth() - (2 * pageMargin);
        let y = pageMargin; // Position verticale actuelle sur la page

        // Fonction pour ajouter un en-tête à chaque page
        const addHeader = (pageNumber) => {
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(`Export des Questions - ${nomMatiere}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
            y += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Généré le: ${date} | Total: ${questionsInCurrentContext.length} questions | Page ${pageNumber}`, doc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
            y += 5;
            doc.setLineWidth(0.5);
            doc.line(pageMargin, y, doc.internal.pageSize.getWidth() - pageMargin, y);
            y += 10;
        };

        let pageCounter = 1;
        addHeader(pageCounter);

        questionsInCurrentContext.forEach((q, index) => {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');

            const questionText = `Q.${q.id}: ${q.enonce}`;
            const questionPoints = `${q.points} pt(s)`;

            // Calcul de la hauteur du texte avec gestion des retours à la ligne
            const splitQuestionText = doc.splitTextToSize(questionText, pageContentWidth - 20); // -20 pour laisser de la place aux points
            const textHeight = doc.getTextDimensions(splitQuestionText).h;

            // Vérification du saut de page AVANT d'écrire la question
            if (y + textHeight + 20 > doc.internal.pageSize.getHeight() - pageMargin) { // +20 pour les réponses et l'espacement
                doc.addPage();
                pageCounter++;
                y = pageMargin;
                addHeader(pageCounter);
            }

            // Écrire la question et les points
            doc.text(splitQuestionText, pageMargin, y);
            doc.text(questionPoints, doc.internal.pageSize.getWidth() - pageMargin, y, { align: 'right' });
            y += textHeight + 2; // +2 pour un petit espace

            // Écrire le chapitre si existant
            if (q.nom_chapitre) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(100);
                doc.text(`Chapitre: ${q.nom_chapitre}`, pageMargin + 5, y);
                y += 5;
                doc.setTextColor(0);
            }

            // Écrire les réponses
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            if (Array.isArray(q.reponses)) {
                q.reponses.forEach(rep => {
                    const reponseText = `- ${rep.texte}`;
                    const splitReponseText = doc.splitTextToSize(reponseText, pageContentWidth - 10);
                    const reponseHeight = doc.getTextDimensions(splitReponseText).h;

                    if (y + reponseHeight > doc.internal.pageSize.getHeight() - pageMargin) {
                        doc.addPage();
                        pageCounter++;
                        y = pageMargin;
                        addHeader(pageCounter);
                    }
                    doc.text(splitReponseText, pageMargin + 5, y);
                    y += reponseHeight + 1;
                });
            }

            // Ligne de séparation entre les questions
            y += 5;
            doc.setDrawColor(200); // Couleur de ligne grise
            doc.setLineWidth(0.2);
            doc.line(pageMargin, y, doc.internal.pageSize.getWidth() - pageMargin, y);
            y += 8; // Espace après la ligne
        });

        const fileName = `Questions_${nomMatiere.replace(/\s+/g, '_')}_${date}.pdf`;
        doc.save(fileName);
    };


    // Calcul en temps réel
    const filledReponsesCount = reponses.filter(r => String(r).trim() !== '').length;
    const numericPointsValue = parseFloat(String(points).replace(',', '.'));
    const pointsPerAnswer = filledReponsesCount > 0 && !isNaN(numericPointsValue) ? (numericPointsValue / filledReponsesCount).toFixed(2) : '0.00';


    // === RENDER ===
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Atelier de Création de Questions</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-white rounded-lg shadow">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Matière (Obligatoire)</label>
                        <select
                            value={selectedMatiereId}
                            onChange={e => {
                                setSelectedMatiereId(e.target.value);
                                resetQuestionForm();
                            }}
                            className="w-full border-gray-300 rounded-md p-2 text-lg"
                        >
                            <option value="">-- Sélectionner une matière --</option>
                            {allMatieres.map(m => <option key={m.id} value={m.id}>{m.nom_matiere}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chapitre (Optionnel)</label>
                        <select value={selectedChapitreId} onChange={e => setSelectedChapitreId(e.target.value)} disabled={!selectedMatiereId} className="w-full border-gray-300 rounded-md p-2 text-lg disabled:bg-gray-100">
                            <option value="">-- Sans chapitre spécifique --</option>
                            {chapitresForMatiere.map(c => <option key={c.id} value={c.id}>{c.nom_chapitre}</option>)}
                        </select>
                    </div>
                </div>

                {selectedMatiereId && (
                    <form ref={formRef} onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow space-y-6">
                        <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
                            {editingQuestionId ? `Modification de la Question #${editingQuestionId}` : 'Nouvelle Question'}
                        </h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Énoncé</label>
                            <textarea value={enonce} onChange={e => setEnonce(e.target.value)} required rows="4" className="mt-1 w-full border-gray-300 rounded-md p-2"/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Points</label>
                                <input type="text" inputMode="decimal" value={points} onChange={e => setPoints(e.target.value)} required className="mt-1 w-full border-gray-300 rounded-md p-2"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre de réponses (si > 6)</label>
                                <input type="number" min="1" max="10" value={nombreReponses} onChange={handleNombreReponsesChange} required className="mt-1 w-full border-gray-300 rounded-md p-2"/>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Réponses (toutes correctes, remplir au moins une)</label>
                            <div className="space-y-3">
                                {reponses.map((rep, index) => (
                                    <input key={index} type="text" placeholder={`Réponse ${index + 1} (optionnel)`} value={rep} onChange={e => {const newReps = [...reponses]; newReps[index] = e.target.value; setReponses(newReps);}} className="w-full border-gray-300 rounded-md p-2"/>
                                ))}
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                <span className="font-semibold">{filledReponsesCount}</span> réponse(s) fournie(s). Valeur par bonne réponse : <span className="font-semibold">{pointsPerAnswer} pts</span>
                            </p>
                        </div>
                        {message && <div className="p-3 bg-green-100 text-green-800 rounded-md">{message}</div>}
                        {error && <div className="p-3 bg-red-100 text-red-800 rounded-md">{error}</div>}
                        <div className="flex justify-end items-center pt-4 border-t gap-4">
                            {editingQuestionId && (
                                <button type="button" onClick={resetQuestionForm} className="flex items-center bg-gray-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90">
                                    <XCircle size={20} className="mr-2" />
                                    Annuler
                                </button>
                            )}
                            <button type="submit" className="flex items-center bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90">
                                {editingQuestionId ? <Pencil size={20} className="mr-2" /> : <PlusCircle size={20} className="mr-2" />}
                                {editingQuestionId ? 'Mettre à jour' : 'Ajouter la question'}
                            </button>
                        </div>
                    </form>
                )}

                {selectedMatiereId && (
                    <div className="mt-10">
                        {/* AJOUT: Titre avec total et bouton d'export */}
                        <div className="flex justify-between items-center mb-3">
                             <h3 className="text-lg font-semibold text-gray-600 flex items-center">
                                <List size={20} className="mr-2"/>
                                Questions déjà créées
                                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                    Total : {questionsInCurrentContext.length}
                                </span>
                            </h3>
                            <button
                                onClick={handleExportPDF}
                                disabled={questionsInCurrentContext.length === 0}
                                className="flex items-center bg-green-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <FileDown size={18} className="mr-2" />
                                Exporter en PDF
                            </button>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 space-y-2 max-h-96 overflow-y-auto">
                            {questionsInCurrentContext.length > 0 ? questionsInCurrentContext.map(q => (
                                <div key={q.id} className="flex justify-between items-center text-sm text-gray-700 border-b pb-2 group">
                                    <div className="flex-grow pr-4">
                                      <span className="font-semibold text-gray-900">Q{q.id}:</span> {q.enonce}
                                      {q.nom_chapitre && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{q.nom_chapitre}</span>}
                                    </div>
                                    <div className="flex items-center gap-2 ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleStartEdit(q)} className="p-1 text-blue-600 hover:text-blue-800" title="Modifier">
                                            <Pencil size={16}/>
                                        </button>
                                        <button onClick={() => handleDelete(q.id)} className="p-1 text-red-600 hover:text-red-800" title="Supprimer">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                            )) : <p className="text-gray-500 text-center py-4">Aucune question pour cette matière pour l'instant.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionManagementPage;