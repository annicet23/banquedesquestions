// --- START OF FILE QuestionManagementPage.jsx (VERSION FINALE AVEC EXPORT PDF COMPLET) ---

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PlusCircle, List, Pencil, Trash2, XCircle, FileDown, Plus, Minus, Image as ImageIcon, X, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import apiClient from '../config/api';

// --- Fonctions utilitaires ---
const chunkArray = (array, size) => {
    const chunked_arr = [];
    for (let i = 0; i < array.length; i += size) {
        chunked_arr.push(array.slice(i, i + size));
    }
    return chunked_arr;
};

const convertImageToBase64 = (url) => {
    return new Promise((resolve) => {
        const fullUrl = url.startsWith('http') || url.startsWith('blob:') ? url : `${apiClient.defaults.staticBaseURL}${url}`;
        fetch(fullUrl)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok.');
                return response.blob();
            })
            .then(blob => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            })
            .catch(() => resolve(null));
    });
};

// --- Composant ImageInput ---
const ImageInput = ({ imageUrl, onFileChange, onRemoveImage }) => {
    const inputRef = useRef(null);
    const fullImageUrl = imageUrl && !imageUrl.startsWith('blob:')
        ? `${apiClient.defaults.staticBaseURL}${imageUrl}`
        : imageUrl;

    return (
        <div className="mt-2 flex items-center gap-3">
            <div className="relative w-24 h-24 rounded border border-dashed border-gray-400 flex items-center justify-center bg-gray-50 overflow-hidden">
                {imageUrl ? (
                    <>
                        <img src={fullImageUrl} alt="Prévisualisation" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={onRemoveImage}
                            className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded-bl-lg hover:bg-red-700 transition-colors"
                            title="Retirer l'image"
                        >
                            <X size={16} />
                        </button>
                    </>
                ) : (
                    <ImageIcon size={32} className="text-gray-400" />
                )}
            </div>
            <div>
                <button type="button" onClick={() => inputRef.current?.click()} className="text-sm bg-gray-200 text-gray-800 py-1 px-3 rounded hover:bg-gray-300">
                    {imageUrl ? 'Changer...' : 'Choisir...'}
                </button>
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        onFileChange(e.target.files[0]);
                    }
                    e.target.value = null;
                }} />
            </div>
        </div>
    );
};


const QuestionManagementPage = () => {
    const DEFAULT_REPONSES_COUNT = 6;
    const DEFAULT_TABLE_ROWS = 2;
    const DEFAULT_TABLE_COLS = 2;
    const emptyResponse = () => ({ texte: '', imageFile: null, imageUrl: null, image_url: null, est_correcte: true });

    // --- États ---
    const [enonce, setEnonce] = useState('');
    const [enonceImageFile, setEnonceImageFile] = useState(null);
    const [enonceImageUrl, setEnonceImageUrl] = useState(null);
    const [points, setPoints] = useState('1');
    const [inputType, setInputType] = useState('liste');
    const [nombreReponses, setNombreReponses] = useState(DEFAULT_REPONSES_COUNT);
    const [reponses, setReponses] = useState(Array(DEFAULT_REPONSES_COUNT).fill(null).map(emptyResponse));
    const [nombreLignes, setNombreLignes] = useState(DEFAULT_TABLE_ROWS);
    const [nombreColonnes, setNombreColonnes] = useState(DEFAULT_TABLE_COLS);
    const [reponsesTableau, setReponsesTableau] = useState(Array.from({ length: DEFAULT_TABLE_ROWS }, () => Array(DEFAULT_TABLE_COLS).fill(null).map(emptyResponse)));
    const [removedImages, setRemovedImages] = useState([]);
    const [allMatieres, setAllMatieres] = useState([]);
    const [chapitresForMatiere, setChapitresForMatiere] = useState([]);
    const [questionsInCurrentContext, setQuestionsInCurrentContext] = useState([]);
    const [selectedMatiereId, setSelectedMatiereId] = useState('');
    const [selectedChapitreId, setSelectedChapitreId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toast, setToast] = useState({ show: false, message: '' });
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const formRef = useRef(null);

    // --- useEffects ---
    useEffect(() => {
        const fetchMatieres = async () => {
            try {
                const res = await apiClient.get('/matieres');
                setAllMatieres(res.data);
            } catch (err) {
                setError('Erreur lors du chargement des matières.');
            } finally {
                setLoading(false);
            }
        };
        fetchMatieres();
    }, []);

    useEffect(() => {
        const fetchContextData = async () => {
            if (selectedMatiereId) {
                setLoading(true);
                try {
                    const [chapitresRes, questionsRes] = await Promise.all([
                        apiClient.get(`/matieres/${selectedMatiereId}/chapitres`),
                        apiClient.get(`/questions?matiereId=${selectedMatiereId}`)
                    ]);
                    setChapitresForMatiere(chapitresRes.data);
                    setQuestionsInCurrentContext(questionsRes.data);
                } catch (err) {
                    setError('Erreur lors du chargement des données.');
                } finally {
                    setLoading(false);
                }
            } else {
                setChapitresForMatiere([]);
                setQuestionsInCurrentContext([]);
            }
        };
        fetchContextData();
    }, [selectedMatiereId]);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => {
                setToast({ show: false, message: '' });
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const pointsPerAnswer = useMemo(() => {
        if (inputType === 'tableau' || !Array.isArray(reponses)) return 0;
        const validReponsesCount = reponses.filter(r => r && (r.texte.trim() !== '' || r.imageFile || r.imageUrl)).length;
        const totalPoints = parseFloat(String(points).replace(',', '.')) || 0;
        if (validReponsesCount > 0 && totalPoints > 0) {
            return (totalPoints / validReponsesCount).toFixed(2);
        }
        return 0;
    }, [reponses, points, inputType]);


    // --- Fonctions de gestion ---
    const handleNombreReponsesChange = (e) => {
        const newSize = parseInt(e.target.value, 10) || 1;
        const clampedSize = Math.max(1, Math.min(10, newSize));
        setNombreReponses(clampedSize);
        setReponses(currentReponses => {
            const newReponses = [...currentReponses];
            while (newReponses.length < clampedSize) {
                newReponses.push(emptyResponse());
            }
            return newReponses.slice(0, clampedSize);
        });
    };

    const handleDimensionChange = (type, delta) => {
        const updateDimensions = (prevRows, prevCols, prevData) => {
            let newRows = prevRows; let newCols = prevCols;
            if (type === 'lignes') newRows = Math.max(1, prevRows + delta);
            if (type === 'colonnes') newCols = Math.max(1, prevCols + delta);
            const newData = Array.from({ length: newRows }, (_, r) =>
                Array.from({ length: newCols }, (_, c) =>
                    (r < prevRows && c < prevCols) ? prevData[r][c] : emptyResponse()
                )
            );
            return { newRows, newCols, newData };
        };
        const { newRows, newCols, newData } = updateDimensions(nombreLignes, nombreColonnes, reponsesTableau);
        setNombreLignes(newRows);
        setNombreColonnes(newCols);
        setReponsesTableau(newData);
    };

    const handleTableCellChange = (e, rowIndex, colIndex) => {
        const newTable = reponsesTableau.map((row, r) =>
            r === rowIndex
                ? row.map((cell, c) => (c === colIndex ? { ...cell, texte: e.target.value } : cell))
                : row
        );
        setReponsesTableau(newTable);
    };

    const handleFileChange = (file, identifier) => {
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        if (identifier === 'enonce_image') {
            setEnonceImageFile(file);
            setEnonceImageUrl(previewUrl);
        } else {
            const newReps = [...reponses];
            newReps[identifier.index] = { ...newReps[identifier.index], imageFile: file, imageUrl: previewUrl };
            setReponses(newReps);
        }
    };

    const handleRemoveImage = (identifier) => {
        if (identifier.imageUrl && !identifier.imageUrl.startsWith('blob:')) {
            setRemovedImages(prev => [...prev, identifier.idForBackend]);
        }
        if (identifier.idForBackend === 'enonce_image') {
            setEnonceImageFile(null);
            setEnonceImageUrl(null);
        } else {
            const newReps = [...reponses];
            newReps[identifier.index] = { ...newReps[identifier.index], imageFile: null, imageUrl: null };
            setReponses(newReps);
        }
    };

    const clearQuestionInputs = () => {
        setEnonce(''); setPoints('1'); setEnonceImageFile(null); setEnonceImageUrl(null); setInputType('liste');
        setNombreReponses(DEFAULT_REPONSES_COUNT); setReponses(Array(DEFAULT_REPONSES_COUNT).fill(null).map(emptyResponse));
        setNombreLignes(DEFAULT_TABLE_ROWS); setNombreColonnes(DEFAULT_TABLE_COLS);
        setReponsesTableau(Array.from({ length: DEFAULT_TABLE_ROWS }, () => Array(DEFAULT_TABLE_COLS).fill(null).map(emptyResponse)));
        setError(''); setEditingQuestionId(null); setRemovedImages([]);
    };

    const handleStartEdit = (question) => {
        clearQuestionInputs();
        setEditingQuestionId(question.id);
        setSelectedChapitreId(question.id_chapitre || '');
        setEnonce(question.enonce);
        setPoints(String(question.points));
        setEnonceImageUrl(question.image_enonce_url || null);
        const reponsesFromDb = (question.reponses || []).map(r => ({ ...r, imageFile: null, imageUrl: r.image_url || null }));
        const metaType = question.reponses_meta?.type || 'liste';
        setInputType(metaType);
        if (metaType === 'tableau') {
            const cols = question.reponses_meta?.colonnes || 2;
            const tableData = chunkArray(reponsesFromDb, cols);
            const numRows = tableData.length || DEFAULT_TABLE_ROWS;
            const finalTableData = Array.from({ length: numRows }, (_, r) => Array.from({ length: cols }, (_, c) => tableData[r]?.[c] || emptyResponse()));
            setNombreColonnes(cols);
            setNombreLignes(numRows);
            setReponsesTableau(finalTableData);
        } else {
            const numFieldsToShow = Math.max(DEFAULT_REPONSES_COUNT, reponsesFromDb.length);
            const finalReponsesState = [...reponsesFromDb];
            while (finalReponsesState.length < numFieldsToShow) { finalReponsesState.push(emptyResponse()); }
            setReponses(finalReponsesState);
            setNombreReponses(numFieldsToShow);
        }
        setError('');
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDelete = async (questionId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
            try {
                await apiClient.delete(`/questions/${questionId}`);
                setToast({ show: true, message: 'Question supprimée.' });
                setQuestionsInCurrentContext(prev => prev.filter(q => q.id !== questionId));
                if (editingQuestionId === questionId) {
                    clearQuestionInputs();
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Erreur lors de la suppression.');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!selectedMatiereId) { setError('Veuillez sélectionner une matière.'); return; }
        const formData = new FormData();
        formData.append('id_matiere', selectedMatiereId);
        formData.append('id_chapitre', selectedChapitreId || '');
        formData.append('enonce', enonce);
        formData.append('type_question', 'QCM');
        formData.append('points', String(points).replace(',', '.'));
        if (enonceImageFile) formData.append('enonce_image', enonceImageFile);
        let reponsesData = [];
        let reponses_meta = { type: inputType };
        if (inputType === 'liste' || inputType === 'photo') {
            reponsesData = reponses.map((r, index) => {
                if (r.imageFile) formData.append(`reponse_image_${index}`, r.imageFile);
                return { texte: r.texte, est_correcte: r.est_correcte, image_url: r.image_url };
            });
        } else if (inputType === 'tableau') {
            reponsesData = reponsesTableau.flat().map(r => ({ texte: r.texte, est_correcte: r.est_correcte, image_url: null }));
            reponses_meta.colonnes = nombreColonnes;
        }
        const filteredReponses = reponsesData.filter(r => r.texte.trim() !== '' || r.image_url || reponses.some(repState => repState.image_url === r.image_url && repState.imageFile));
        if (filteredReponses.length === 0 && inputType !== 'tableau') {
             const hasImageFiles = reponses.some(r => r.imageFile);
             if(!hasImageFiles) {
                setError('Veuillez fournir au moins une réponse valide (texte ou image).');
                return;
             }
        }
        formData.append('reponses', JSON.stringify(reponsesData));
        formData.append('reponses_meta', JSON.stringify(reponses_meta));
        if (editingQuestionId) {
            formData.append('removed_images', JSON.stringify(removedImages));
        }
        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            if (editingQuestionId) {
                await apiClient.put(`/questions/${editingQuestionId}`, formData, config);
                setToast({ show: true, message: 'Question modifiée avec succès !' });
            } else {
                await apiClient.post('/questions', formData, config);
                setToast({ show: true, message: 'Question ajoutée avec succès !' });
            }
            const res = await apiClient.get(`/questions?matiereId=${selectedMatiereId}`);
            setQuestionsInCurrentContext(res.data);
            clearQuestionInputs();
        } catch (err) {
            setError(err.response?.data?.message || 'Une erreur est survenue.');
        }
    };
    
    // ====================================================================================
    // === NOUVELLE FONCTION D'EXPORT PDF - CORRIGÉE POUR L'AFFICHAGE DES IMAGES ET TABLEAUX ===
    // ====================================================================================
    const handleExportPDF = async () => {
        if (questionsInCurrentContext.length === 0) return;

        setToast({ show: true, message: 'Génération du PDF en cours...' });
        setError('');

        try {
            const preparedQuestions = await Promise.all(
                questionsInCurrentContext.map(async (q) => {
                    const enonceImageBase64 = q.image_enonce_url ? await convertImageToBase64(q.image_enonce_url) : null;
                    const reponsesAvecImages = q.reponses ? await Promise.all(
                        (q.reponses || []).map(async (rep) => ({
                            ...rep,
                            imageBase64: rep.image_url ? await convertImageToBase64(rep.image_url) : null,
                        }))
                    ) : [];
                    return { ...q, enonceImageBase64, reponses: reponsesAvecImages };
                })
            );

            const doc = new jsPDF();
            let y = 15; // Marge de départ en haut

            preparedQuestions.forEach((q, index) => {
                // Si la question ne rentre pas, on passe à une nouvelle page
                // C'est une estimation, à ajuster si besoin
                if (y > 250) {
                    doc.addPage();
                    y = 15;
                }
                
                // Séparateur entre les questions
                if (index > 0) {
                    y += 5;
                    doc.setDrawColor(220, 220, 220);
                    doc.line(15, y, 195, y);
                    y += 10;
                }

                // Affichage de la question, chapitre et points
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text(`Q.${q.id}: ${q.enonce}`, 15, y, { maxWidth: 155 });
                doc.setFont('helvetica', 'normal');
                doc.text(`${parseFloat(q.points).toFixed(2)} pt(s)`, 195, y, { align: 'right' });
                y += doc.getTextDimensions(`Q.${q.id}: ${q.enonce}`, { maxWidth: 155 }).h + 2;

                if (q.nom_chapitre) {
                    doc.setFontSize(9);
                    doc.setTextColor(100);
                    doc.text(`Chapitre: ${q.nom_chapitre}`, 15, y);
                    doc.setTextColor(0);
                    y += 5;
                }
                
                if (q.enonceImageBase64) {
                    doc.addImage(q.enonceImageBase64, 'JPEG', 15, y, 50, 50);
                    y += 55;
                }

                y += 2; // Petit espace avant la réponse

                // === GESTION DES DIFFÉRENTS TYPES DE RÉPONSES ===
                if (q.reponses_meta?.type === 'tableau') {
                    const cols = q.reponses_meta.colonnes || 2;
                    const tableReponses = chunkArray(q.reponses, cols);

                    const head = [tableReponses[0]?.map(cell => cell.texte) || []];
                    const body = tableReponses.length > 1 ? tableReponses.slice(1).map(row => row.map(cell => cell.texte || '')) : [];
                    
                    autoTable(doc, {
                        startY: y,
                        head: head,
                        body: body,
                        theme: 'grid',
                        headStyles: { 
                            fillColor: [23, 162, 184], // Couleur teal de votre screenshot
                            textColor: 255, 
                            fontStyle: 'bold' 
                        },
                        styles: { fontSize: 10, cellPadding: 2 },
                        margin: { left: 15, right: 15 }
                    });
                    y = doc.lastAutoTable.finalY + 10;

                } else { // Gère les listes et les images
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    (q.reponses || []).forEach(rep => {
                        if (rep.texte) {
                            const repLines = doc.splitTextToSize(`- ${rep.texte}`, 170);
                            doc.text(repLines, 20, y);
                            y += repLines.length * 5;
                        }
                        if (rep.imageBase64) {
                            y += 2;
                            doc.addImage(rep.imageBase64, 'JPEG', 20, y, 40, 40);
                            y += 45;
                        }
                    });
                     y += 5; // Espace après la dernière réponse
                }
            });

            // Sauvegarder le fichier avec le nom dynamique
            const matiere = allMatieres.find(m => m.id.toString() === selectedMatiereId);
            const matiereName = matiere ? (matiere.abreviation || matiere.nom_matiere).toLowerCase() : 'matiere';
            // CORRIGÉ: Nom du fichier comme demandé
            doc.save(`question_reponse_${matiereName.replace(/\s/g, '_')}.pdf`);

        } catch (e) {
            setError("Une erreur est survenue lors de la génération du PDF.");
            console.error(e);
        } finally {
            setToast({ show: false, message: '' });
        }
    };


    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            {toast.show && (
                <div className="fixed top-5 right-5 z-50 bg-green-500 text-white py-3 px-5 rounded-lg shadow-lg flex items-center animate-fade-in-down">
                    <CheckCircle size={22} className="mr-3" />
                    <span>{toast.message}</span>
                </div>
            )}
            <div className="max-w-7xl mx-auto">
                <div className="p-6 bg-white rounded-lg shadow mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 border-b pb-4 mb-6">Sélection du Contexte</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="matiere-select" className="block text-sm font-medium text-gray-700">Matière</label>
                            <select id="matiere-select" value={selectedMatiereId} onChange={(e) => { setSelectedMatiereId(e.target.value); setSelectedChapitreId(''); }} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                <option value="">-- Sélectionnez une matière --</option>
                                {allMatieres.map(m => <option key={m.id} value={m.id}>{m.nom_matiere}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="chapitre-select" className="block text-sm font-medium text-gray-700">Chapitre (Optionnel)</label>
                            <select id="chapitre-select" value={selectedChapitreId} onChange={e => setSelectedChapitreId(e.target.value)} disabled={!selectedMatiereId || chapitresForMatiere.length === 0} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100">
                                <option value="">-- Tous les chapitres --</option>
                                {chapitresForMatiere.map(c => <option key={c.id} value={c.id}>{c.nom_chapitre}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {selectedMatiereId && (
                    <form ref={formRef} onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-gray-700 border-b pb-4 mb-6">
                            {editingQuestionId ? `Modification de la Question #${editingQuestionId}` : 'Nouvelle Question'}
                        </h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Énoncé</label>
                                <textarea value={enonce} onChange={e => setEnonce(e.target.value)} required rows="10" className="mt-1 w-full border-gray-300 rounded-md p-2" />
                                <label className="block text-sm font-medium text-gray-700 mt-4">Image pour l'énoncé (optionnel)</label>
                                <ImageInput
                                    imageUrl={enonceImageUrl}
                                    onFileChange={(file) => handleFileChange(file, 'enonce_image')}
                                    onRemoveImage={() => handleRemoveImage({ idForBackend: 'enonce_image', imageUrl: enonceImageUrl })}
                                />
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Points</label>
                                        <input type="text" inputMode="decimal" value={points} onChange={e => setPoints(e.target.value)} required className="mt-1 w-full border-gray-300 rounded-md p-2"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Type de réponse</label>
                                        <select value={inputType} onChange={(e) => setInputType(e.target.value)} className="mt-1 w-full border-gray-300 rounded-md p-2">
                                            <option value="liste">Liste Simple (Texte)</option>
                                            <option value="tableau">Tableau (Texte)</option>
                                            <option value="photo">Photo</option>
                                        </select>
                                    </div>
                                </div>

                                {(() => {
                                    if (inputType === 'liste') {
                                        return (
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">Réponses (toutes correctes)</label>
                                                    <div className="flex items-center"><label className="text-sm mr-2">Nb champs</label><input type="number" min="1" max="10" value={nombreReponses} onChange={handleNombreReponsesChange} required className="w-16 border-gray-300 rounded-md p-1 text-center"/></div>
                                                </div>
                                                <div className="space-y-3">
                                                    {reponses.map((rep, index) => (
                                                        <input key={index} type="text" placeholder={`Réponse ${index + 1}`} value={rep.texte} onChange={e => { const newReps = [...reponses]; newReps[index].texte = e.target.value; setReponses(newReps); }} className="w-full border-gray-300 rounded-md p-2"/>
                                                    ))}
                                                </div>
                                                {pointsPerAnswer > 0 && (
                                                    <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-sm rounded-md text-center">
                                                        Soit <strong>{pointsPerAnswer}</strong> points par réponse valide.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    if (inputType === 'tableau') {
                                        return (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Réponses (dans le tableau)</label>
                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className="flex items-center gap-2"><span className="text-sm">Lignes: {nombreLignes}</span><button type="button" onClick={() => handleDimensionChange('lignes', 1)} className="p-1 bg-gray-200 rounded"><Plus size={14} /></button><button type="button" onClick={() => handleDimensionChange('lignes', -1)} className="p-1 bg-gray-200 rounded"><Minus size={14} /></button></div>
                                                    <div className="flex items-center gap-2"><span className="text-sm">Colonnes: {nombreColonnes}</span><button type="button" onClick={() => handleDimensionChange('colonnes', 1)} className="p-1 bg-gray-200 rounded"><Plus size={14} /></button><button type="button" onClick={() => handleDimensionChange('colonnes', -1)} className="p-1 bg-gray-200 rounded"><Minus size={14} /></button></div>
                                                </div>
                                                <table className="w-full border-collapse">
                                                    <tbody>
                                                        {reponsesTableau.map((row, r) => (
                                                            <tr key={r}>{row.map((cell, c) => (<td key={c} className="p-1 border border-gray-300 align-top"><input type="text" value={cell.texte} onChange={(e) => handleTableCellChange(e, r, c)} className="w-full border-none p-1 focus:ring-0" placeholder={`R${r+1}, C${c+1}`} /></td>))}</tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    }
                                    if (inputType === 'photo') {
                                        return (
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-sm font-medium text-gray-700">Réponses (Photos)</label>
                                                    <div className="flex items-center"><label className="text-sm mr-2">Nb champs</label><input type="number" min="1" max="10" value={nombreReponses} onChange={handleNombreReponsesChange} required className="w-16 border-gray-300 rounded-md p-1 text-center"/></div>
                                                </div>
                                                <div className="space-y-4">
                                                    {reponses.map((rep, index) => (
                                                        <div key={index} className="p-3 border rounded-lg bg-gray-50">
                                                            <label className="text-sm font-medium text-gray-600">Réponse {index + 1}</label>
                                                            <ImageInput imageUrl={rep.imageUrl} onFileChange={(file) => handleFileChange(file, { index })} onRemoveImage={() => handleRemoveImage({ idForBackend: `reponse_image_${index}`, index, imageUrl: rep.image_url })}/>
                                                            <input type="text" placeholder="Légende (optionnel)" value={rep.texte} onChange={e => { const newReps = [...reponses]; newReps[index].texte = e.target.value; setReponses(newReps); }} className="w-full border-gray-300 rounded-md p-2 mt-2"/>
                                                        </div>
                                                    ))}
                                                </div>
                                                {pointsPerAnswer > 0 && (
                                                    <div className="mt-2 p-2 bg-blue-50 text-blue-700 text-sm rounded-md text-center">
                                                        Soit <strong>{pointsPerAnswer}</strong> points par réponse valide.
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>

                        {error && <div className="mt-6 p-3 bg-red-100 text-red-800 rounded-md">{error}</div>}
                        <div className="flex justify-end items-center pt-6 mt-6 border-t gap-4">
                            {editingQuestionId && (<button type="button" onClick={clearQuestionInputs} className="flex items-center bg-gray-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90"><XCircle size={20} className="mr-2" /> Annuler</button>)}
                            <button type="submit" className="flex items-center bg-primary text-white py-2 px-4 rounded-lg shadow-md hover:bg-opacity-90">{editingQuestionId ? <><Pencil size={20} className="mr-2" /> Mettre à jour</> : <><PlusCircle size={20} className="mr-2" /> Ajouter la question</>}</button>
                        </div>
                    </form>
                )}

                {selectedMatiereId && (
                    <div className="mt-10">
                         <div className="flex justify-between items-center mb-3">
                             <h3 className="text-lg font-semibold text-gray-600 flex items-center"><List size={20} className="mr-2"/>Questions déjà créées<span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Total : {questionsInCurrentContext.length}</span></h3>
                             <button onClick={handleExportPDF} disabled={questionsInCurrentContext.length === 0} className="flex items-center bg-green-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"><FileDown size={18} className="mr-2" />Exporter en PDF</button>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 space-y-2 max-h-[40rem] overflow-y-auto">
                            {questionsInCurrentContext.map(q => (
                                <div key={q.id} className="border-b pb-3 pt-2 group">
                                    <div className="flex justify-between items-start text-sm text-gray-700 ">
                                        <div className="flex-grow pr-4 flex items-start gap-3">
                                            {q.image_enonce_url && (<img src={`${apiClient.defaults.staticBaseURL}${q.image_enonce_url}`} alt="" className="w-20 h-20 object-cover rounded flex-shrink-0" />)}
                                            <div className="flex-1">
                                                <p><span className="font-semibold text-gray-900">Q{q.id}:</span> {q.enonce}</p>
                                                {q.nom_chapitre && <span className="mt-1 inline-block text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{q.nom_chapitre}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleStartEdit(q)} className="p-1 text-blue-600 hover:text-blue-800" title="Modifier"><Pencil size={16}/></button>
                                            <button onClick={() => handleDelete(q.id)} className="p-1 text-red-600 hover:text-red-800" title="Supprimer"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    {q.reponses_meta?.type === 'photo' && Array.isArray(q.reponses) && q.reponses.some(r => r.image_url) && (
                                        <div className="mt-2 pl-4 flex flex-wrap gap-2">
                                            {q.reponses.map((rep, idx) => rep.image_url && (
                                                <div key={idx} className="text-center">
                                                    <img src={`${apiClient.defaults.staticBaseURL}${rep.image_url}`} alt={`Réponse ${idx+1}`} className="w-24 h-24 object-cover rounded border"/>
                                                    {rep.texte && <p className="text-xs text-gray-600 mt-1 max-w-[6rem] truncate">{rep.texte}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {questionsInCurrentContext.length === 0 && <p className="text-gray-500 text-center py-4">Aucune question pour cette matière pour l'instant.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionManagementPage;

// --- END OF FILE QuestionManagementPage.jsx (VERSION FINALE ET CORRIGÉE) ---
