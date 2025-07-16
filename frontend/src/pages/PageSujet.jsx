// src/pages/PageSujet.js (FICHIER MIS À JOUR)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Filter, Download, List, Clock, FolderOpen, BookOpen, Printer, X, FileText } from 'lucide-react';

// --- BIBLIOTHÈQUES D'EXPORT (comme dans GenerateExamPage) ---
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- FONCTIONS ET COMPOSANTS UTILITAIRES (copiés depuis GenerateExamPage.js) ---

const groupQuestionsByMatiere = (questions) => {
    if (!Array.isArray(questions)) return {};
    // On se base sur le champ `nom_matiere` directement disponible
    return questions.reduce((acc, question) => {
        const matiereName = question.nom_matiere || 'Matière Inconnue';
        if (!acc[matiereName]) {
            acc[matiereName] = [];
        }
        acc[matiereName].push(question);
        return acc;
    }, {});
};

// Composant pour l'impression du sujet (invisible)
// PageSujet.js

// ...

const PrintableExamMatiere = React.forwardRef(({ examData }, ref) => {
    if (!examData) return null;
    // MODIFIÉ : On extrait duree et coefficient des données de l'examen
    const { matiereName, questions, sujetDetails, duree, coefficient } = examData;
    const tableStyle = { width: '100%', borderCollapse: 'collapse', border: '2px solid black', fontFamily: 'Arial, sans-serif', fontSize: '12pt' };
    const cellStyle = { border: '1px solid black', padding: '8px' };
    const centerCellStyle = { ...cellStyle, textAlign: 'center' };

    // Calcule du total des points pour cette matière spécifique
    const totalPointsMatiere = questions.reduce((sum, q) => sum + (q.points || 0), 0);

    return (
        <div ref={ref} style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box', padding: '15mm', backgroundColor: 'white', color: 'black' }}>
            {/* EN-TÊTE MIS À JOUR */}
            <table style={tableStyle}>
                <tbody>
                    <tr>
                        <td colSpan="3" style={{ ...centerCellStyle, padding: '10px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1em', textTransform: 'uppercase' }}>ECOLE DE LA GENDARMERIE NATIONALE AMBOSITRA</div>
                            <div style={{ marginTop: '6px', fontSize: '1em' }}>{sujetDetails.titre_parent || 'Examen'} - {sujetDetails.titre}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ ...cellStyle, width: '50%' }}><strong style={{ display: 'block' }}>ÉPREUVE : {matiereName.toUpperCase()}</strong></td>
                        <td style={centerCellStyle}>DURÉE : {duree || 'N/A'}</td>
                        <td style={centerCellStyle}>COEFFICIENT : {coefficient || 'N/A'}</td>
                    </tr>
                </tbody>
            </table>
            <div style={{ textAlign: 'right', fontWeight: 'bold', margin: '15px 0', fontSize: '11pt' }}>NOTE TOTALE : {totalPointsMatiere} / {totalPointsMatiere}</div>
            <div style={{ textAlign: 'center', margin: '10px 0 20px 0' }}><h2 style={{ textDecoration: 'underline', fontWeight: 'bold', fontSize: '1.3em' }}>-SUJET-</h2></div>

            {/* Le reste du composant (liste des questions) est inchangé */}
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
                {questions.map((q, qIndex) => (
                    <div key={q.id || qIndex} style={{ marginBottom: '12px', display: 'flex' }}>
                        <span style={{ marginRight: '10px', fontWeight: 'bold' }}>{qIndex + 1}.</span>
                        <div style={{ flex: 1 }}><span>{q.enonce}</span><span style={{ fontStyle: 'italic', color: '#4A5568', marginLeft: '15px' }}>({q.points} points)</span></div>
                    </div>
                ))}
            </div>
        </div>
    );
});

// ...

// Composant pour l'impression du corrigé (invisible)
const PrintableCorrectionMatiere = React.forwardRef(({ examData }, ref) => {
    if (!examData) return null;
    const { matiereName, questions, sujetDetails } = examData;
    const tableStyle = { width: '100%', borderCollapse: 'collapse', border: '2px solid black', fontFamily: 'Arial, sans-serif', fontSize: '12pt' };
    const cellStyle = { border: '1px solid black', padding: '8px', textAlign: 'center' };

    return (
        <div ref={ref} style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box', padding: '15mm', backgroundColor: 'white', color: 'black' }}>
            <table style={tableStyle}>
                <tbody>
                    <tr><td colSpan="2" style={{...cellStyle, fontWeight: 'bold' }}>CORRIGÉ - {sujetDetails.titre_parent}</td></tr>
                    <tr><td colSpan="2" style={cellStyle}><strong>ÉPREUVE : {matiereName.toUpperCase()}</strong></td></tr>
                </tbody>
            </table>
            <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', marginTop: '20px' }}>
                {questions.map((q, qIndex) => {
                    const correctAnswers = q.reponses?.filter(r => r.est_correcte === true) || [];
                    return (
                        <div key={q.id || qIndex} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px dashed #ccc' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '5px' }}>
                                <span style={{ marginRight: '10px', fontWeight: 'bold' }}>{qIndex + 1}.</span>
                                <div style={{ flex: 1 }}><span>{q.enonce}</span><span style={{ fontStyle: 'italic', color: '#4A5568', marginLeft: '15px' }}>({q.points} points)</span></div>
                            </div>
                            <div style={{ marginLeft: '25px', marginTop: '5px' }}>
                                <strong style={{color: '#16a34a'}}>Réponse(s) :</strong>
                                {correctAnswers.length > 0 ? (
                                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: '5px 0 0 0' }}>
                                        {correctAnswers.map((ans, ansIndex) => (<li key={ansIndex}>{ans.texte}</li>))}
                                    </ul>
                                ) : (<span style={{ fontStyle: 'italic', color: '#999', marginLeft: '10px' }}>[Aucune réponse correcte définie]</span>)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});


const PageSujet = () => {
    // --- États existants ---
    const [sujets, setSujets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [promotions, setPromotions] = useState([]);
    const [parentExams, setParentExams] = useState([]);
    const [filtres, setFiltres] = useState({
        promotionId: '',
        parentExamId: '',
        typeExamen: '',
    });

    // --- NOUVEAUX ÉTATS POUR L'EXPORT PDF ---
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [selectedSujetForExport, setSelectedSujetForExport] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [dataToPrint, setDataToPrint] = useState(null);
    const [correctionDataToPrint, setCorrectionDataToPrint] = useState(null);
    const printableRef = useRef();
    const correctionPrintableRef = useRef();


    // ... (fonctions loadFilterData, loadSujets, useEffect, handleFilterChange, handleApplyFilters, handleExport [CSV] restent identiques) ...
     const loadFilterData = useCallback(async (token) => {
        const headers = { headers: { Authorization: `Bearer ${token}` } };
        try {
            const [promoRes, examsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/promotions', headers),
                axios.get('http://localhost:5000/api/examens', headers)
            ]);
            setPromotions(promoRes.data);
            setParentExams(examsRes.data);
        } catch (err) {
            setError('Erreur lors du chargement des filtres.');
        }
    }, []);

    const loadSujets = useCallback(async (token) => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (filtres.promotionId) params.append('promotionId', filtres.promotionId);
            if (filtres.parentExamId) params.append('parentExamId', filtres.parentExamId);
            if (filtres.typeExamen) params.append('typeExamen', filtres.typeExamen);

            const response = await axios.get(`http://localhost:5000/api/sujets-sauvegardes?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSujets(response.data);
        } catch (err) {
            setError('Impossible de charger les sujets sauvegardés.');
            setSujets([]);
        } finally {
            setLoading(false);
        }
    }, [filtres]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadFilterData(token);
            loadSujets(token);
        } else {
            setError("Authentification requise.");
            setLoading(false);
        }
    }, [loadFilterData, loadSujets]);

    // --- NOUVEAUX USEEFFECTS POUR LA GÉNÉRATION PDF ---
    useEffect(() => {
        if (dataToPrint && printableRef.current) {
            (async () => {
                const canvas = await html2canvas(printableRef.current, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                if (!dataToPrint.isFirstPage) dataToPrint.pdfInstance.addPage();
                dataToPrint.pdfInstance.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
                dataToPrint.resolve();
            })();
        }
    }, [dataToPrint]);

    useEffect(() => {
        if (correctionDataToPrint && correctionPrintableRef.current) {
            (async () => {
                const canvas = await html2canvas(correctionPrintableRef.current, { scale: 2, useCORS: true });
                const imgData = canvas.toDataURL('image/png');
                if (!correctionDataToPrint.isFirstPage) correctionDataToPrint.pdfInstance.addPage();
                correctionDataToPrint.pdfInstance.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
                correctionDataToPrint.resolve();
            })();
        }
    }, [correctionDataToPrint]);


    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFiltres(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
         const token = localStorage.getItem('token');
         if (token) loadSujets(token);
    }

    const handleExportCSV = () => {
        if (sujets.length === 0) {
            alert("Aucun sujet à exporter.");
            return;
        }
        const headers = "Titre;Promotion;Modele Parent;Date Creation\n";
        const rows = sujets.map(s => `"${s.titre}";"${s.nom_promotion}";"${s.titre_parent}";"${new Date(s.created_at).toLocaleDateString()}"`).join("\n");
        const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
        const link = document.createElement("a");
        link.setAttribute("href", csvContent);
        link.setAttribute("download", "sujets_sauvegardes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- NOUVELLES FONCTIONS POUR L'EXPORT PDF D'UN SUJET ---
    const openExportModal = (sujet) => {
        setSelectedSujetForExport(sujet);
        setIsExportModalOpen(true);
    };

    const handleExportPDF = async (exportType) => {
        if (!selectedSujetForExport) return;
        setExporting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/sujets-sauvegardes/${selectedSujetForExport.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const sujetDetails = response.data;
            if (!sujetDetails.questions || sujetDetails.questions.length === 0) {
                alert("Ce sujet ne contient aucune question à exporter.");
                setExporting(false);
                return;
            }

            const groupedQuestions = groupQuestionsByMatiere(sujetDetails.questions);
            const pdf = new jsPDF('p', 'mm', 'a4');
            let isFirstPage = true;

            for (const [matiereName, questions] of Object.entries(groupedQuestions)) {
                const commonData = { matiereName, questions, sujetDetails, pdfInstance: pdf, isFirstPage };

                if (exportType === 'sujet') {
                    await new Promise(resolve => setDataToPrint({ ...commonData, resolve }));
                } else { // 'correction'
                    await new Promise(resolve => setCorrectionDataToPrint({ ...commonData, resolve }));
                }
                isFirstPage = false;
            }

            const fileName = `${sujetDetails.titre.replace(/\s+/g, '_')}_${exportType}.pdf`;
            pdf.save(fileName);

        } catch (err) {
            setError("Erreur lors de la récupération des détails du sujet pour l'exportation.");
        } finally {
            setExporting(false);
            setIsExportModalOpen(false);
            setDataToPrint(null);
            setCorrectionDataToPrint(null);
        }
    };


    return (
        <>
            {/* MODALE D'EXPORTATION */}
            {isExportModalOpen && selectedSujetForExport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
                        <button onClick={() => setIsExportModalOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Exporter le sujet</h3>
                        <p className="text-indigo-600 font-medium mb-4">{selectedSujetForExport.titre}</p>
                        <div className="flex flex-col space-y-3">
                            <button onClick={() => handleExportPDF('sujet')} disabled={exporting} className="inline-flex justify-center items-center bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400">
                                <FileText size={20} className="mr-2"/>{exporting ? 'Export en cours...' : 'Exporter Sujet (PDF)'}
                            </button>
                            <button onClick={() => handleExportPDF('correction')} disabled={exporting} className="inline-flex justify-center items-center bg-green-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400">
                                <Printer size={20} className="mr-2"/>{exporting ? 'Export en cours...' : 'Exporter Corrigé (PDF)'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* COMPOSANTS INVISIBLES POUR LA GÉNÉRATION PDF */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
                <PrintableExamMatiere ref={printableRef} examData={dataToPrint} />
                <PrintableCorrectionMatiere ref={correctionPrintableRef} examData={correctionDataToPrint} />
            </div>

            <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                            <List className="mr-3" /> Sujets Sauvegardés
                        </h1>
                        <button onClick={handleExportCSV} className="inline-flex items-center bg-gray-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-gray-700">
                            <Download size={20} className="mr-2"/>Exporter la liste (CSV)
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-md mb-8">
                        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center"><Filter size={20} className="mr-2"/>Filtres</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <select name="promotionId" value={filtres.promotionId} onChange={handleFilterChange} className="w-full border-gray-300 rounded-md p-2 shadow-sm">
                                <option value="">Toutes les promotions</option>
                                {promotions.map(p => <option key={p.id} value={p.id}>{p.nom_promotion}</option>)}
                            </select>
                            <select name="parentExamId" value={filtres.parentExamId} onChange={handleFilterChange} className="w-full border-gray-300 rounded-md p-2 shadow-sm">
                                <option value="">Tous les modèles d'examen</option>
                                {parentExams.map(e => <option key={e.id} value={e.id}>{e.titre}</option>)}
                            </select>
                            <select name="typeExamen" value={filtres.typeExamen} onChange={handleFilterChange} className="w-full border-gray-300 rounded-md p-2 shadow-sm">
                                <option value="">Tous les types</option>
                                <option value="Concours">Concours</option>
                                <option value="Test Journalier">Test Journalier</option>
                            </select>
                            <button onClick={handleApplyFilters} className="bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full md:w-auto px-4 py-2">
                                Appliquer
                            </button>
                        </div>
                    </div>

                    {loading ? ( <p className="text-center text-gray-500">Chargement...</p> ) :
                     error && !exporting ? ( <p className="text-center text-red-500">{error}</p> ) :
                     (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre du Sujet</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promotion</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modèle Parent</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sujets.length > 0 ? sujets.map(sujet => (
                                        <tr key={sujet.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center"><BookOpen size={16} className="mr-2 text-gray-400"/>{sujet.titre}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sujet.nom_promotion}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><FolderOpen size={16} className="inline-block mr-2 text-gray-400"/>{sujet.titre_parent}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><Clock size={16} className="inline-block mr-2 text-gray-400"/>{new Date(sujet.created_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button onClick={() => openExportModal(sujet)} className="text-indigo-600 hover:text-indigo-900 font-semibold">
                                                    Voir / Exporter
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-10 text-gray-500">Aucun sujet trouvé.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default PageSujet;