import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import apiClient from '../config/api';
import { Settings, Zap, Save, AlertTriangle, CheckCircle, Printer, FileText, X, Eye, BarChart2, Mic } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Packer, Document, Paragraph, TextRun, PageBreak, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';

// --- Composant pour la modale de chargement de l'exportation ---
const ExportLoaderModal = () => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[100]">
            <style>
                {`
                .loader {
                    position: relative;
                    width: 120px;
                    height: 55px;
                    background-repeat: no-repeat;
                    background-image:
                    radial-gradient(circle 2.5px , #ff3d00  100%, transparent 0),
                    linear-gradient(#525252 90px, transparent 0),
                    linear-gradient(#ececec 120px, transparent 0),
                    linear-gradient(to right, #eee 10%,#333 10%,#333 90%,#eee 90%)
                    ;
                    background-size: 5px 5px, 90px 10px, 120px 45px , 100px 15px;
                    background-position: 110px 15px,center bottom , center bottom , center 0 ;
                }
                .loader:before {
                    content: "";
                    width: 70px;
                    background-color: #fff;
                    box-shadow: 0 0 10px #0003;
                    position: absolute;
                    left: 50%;
                    transform: translatex(-50%);
                    bottom: calc(100% - 10px);
                    animation: printerPaper 4s ease-in infinite;
                }
                .loader:after {
                    content: "";
                    width: 70px;
                    height: 80px;
                    background-color: #fff;
                    background-image:   linear-gradient(to bottom, #FFF 50%, #ff3d00  51%),
                                        linear-gradient(to bottom, #bbb 50%, #0000 51%);
                    background-size: 60px 20px,  60px 10px;
                    background-repeat: no-repeat, repeat-y;
                    background-position: center 55px , center 0;
                    position: absolute;
                    left: 50%;
                    transform: translatex(-50%) rotate(180deg);
                    box-shadow: 0 10px #fff inset;
                    top: calc(100% - 8px);
                    animation: PrintedPaper 4s ease-in infinite;
                }
                @keyframes printerPaper { 0% , 25% { height: 50px} 75%, 100% { height: 0} }
                @keyframes PrintedPaper { 0%, 30% { height: 0px; top: calc(100% - 8px); } 80% { height: 80px; top: calc(100% - 8px); opacity: 1; } 100% { height: 80px; top: calc(100% + 10px); opacity: 0; } }
                `}
            </style>
            <div className="bg-white p-8 rounded-lg shadow-2xl flex flex-col items-center">
                <div className="loader"></div>
                <p className="mt-6 text-xl font-semibold text-gray-700">Génération en cours...</p>
                <p className="text-sm text-gray-500">Création des fichiers, veuillez patienter.</p>
            </div>
        </div>
    );
};

// --- Fonctions Utilitaires ---
const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

const groupQuestionsByMatiere = (questions, allMatieres) => {
    if (!Array.isArray(questions)) return {};
    return questions.reduce((acc, question) => {
        const matiere = allMatieres.find(m => m.id === question.id_matiere);
        const matiereName = matiere ? matiere.nom_matiere : 'Matière Inconnue';
        if (!acc[matiereName]) acc[matiereName] = [];
        acc[matiereName].push(question);
        return acc;
    }, {});
};

const analyzeRepetitions = (versions) => {
    if (!versions || versions.length <= 1) return { repeatedQuestions: [], totalUniqueQuestions: 0 };
    const questionCounts = new Map();
    const questionDetails = new Map();
    const totalUniqueQuestions = new Set();
    versions.forEach(version => {
        const questionIdsInVersion = new Set();
        version.forEach(q => {
            questionIdsInVersion.add(q.id);
            if (!questionDetails.has(q.id)) questionDetails.set(q.id, q);
            totalUniqueQuestions.add(q.id);
        });
        questionIdsInVersion.forEach(id => questionCounts.set(id, (questionCounts.get(id) || 0) + 1));
    });
    const repeatedQuestions = [];
    questionCounts.forEach((count, id) => { if (count > 1) repeatedQuestions.push({ ...questionDetails.get(id), count }); });
    return { repeatedQuestions, totalUniqueQuestions: totalUniqueQuestions.size };
};

// --- Composants pour l'impression PDF ---
const ExamHalfPage = ({ examData }) => {
    if (!examData) return null;
    const { questions, index, parentExam, duree, selectedPromotion, matiereAbreviation } = examData;

    const formattedDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

    const baseStyle = { fontFamily: 'Arial, sans-serif', fontSize: '10pt', lineHeight: '1.2' };
    const headerTextStyle = { ...baseStyle, textAlign: 'center', fontWeight: 'bold', padding: '1px 0' };
    const questionStyle = { ...baseStyle, marginBottom: '4px', display: 'flex' };
    const tableCellStyle = { padding: '4px 6px', verticalAlign: 'middle', ...baseStyle };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
                <tbody>
                    <tr>
                        <td colSpan="3" style={{ ...tableCellStyle, borderBottom: '1px solid black', padding: '6px' }}>
                            <div style={headerTextStyle}>DIRECTEURE DE L'INSTRUCTION</div>
                            <div style={headerTextStyle}>
                                {selectedPromotion ? `${selectedPromotion.nom_promotion.toUpperCase()} COURS DE FORMATION DES ELEVES GENDARMES` : 'COURS DE FORMATION DES ELEVES GENDARMES'}
                            </div>
                            <div style={headerTextStyle}>{parentExam?.titre?.toUpperCase() || 'TEST JOURNALIER'}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ ...tableCellStyle, width: '33.33%', borderRight: '1px solid black' }}>
                            <span style={{ textDecoration: 'underline' }}>MATIERE</span> : {matiereAbreviation}
                        </td>
                        <td style={{ ...tableCellStyle, width: '33.33%', borderRight: '1px solid black' }}>
                            <span style={{ textDecoration: 'underline' }}>DATE</span> : {formattedDate}
                        </td>
                        <td style={{ ...tableCellStyle, width: '33.33%' }}>
                            <span style={{ textDecoration: 'underline' }}>DUREE</span> : {duree}
                        </td>
                    </tr>
                </tbody>
            </table>
            <div style={{ ...baseStyle, textAlign: 'center', textDecoration: 'underline', fontWeight: 'bold', margin: '15px 0' }}>Sujet {index + 1}</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {questions.map((q, qIndex) => (
                    <div key={q.id || qIndex} style={questionStyle}>
                        <span style={{ marginRight: '8px' }}>{qIndex + 1}.</span>
                        <div style={{ flex: 1 }}>
                            <span>{q.enonce}</span>
                            <span style={{ fontStyle: 'italic', color: '#4A5568', marginLeft: '10px' }}>({q.points} points)</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
const PrintableExamMatiere = React.forwardRef(({ examData }, ref) => {
    if (!examData) return null;
    return (
        <div ref={ref} style={{ width: '210mm', height: '297mm', boxSizing: 'border-box', padding: '10mm 15mm', backgroundColor: 'white', color: 'black', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '138mm', width: '100%', overflow: 'hidden', boxSizing: 'border-box', marginBottom: '5mm' }}>
                <ExamHalfPage examData={examData} />
            </div>
            <div style={{ borderTop: '1px dashed #333', height: '1px', width: '100%', flexShrink: 0 }}></div>
            <div style={{ height: '138mm', width: '100%', overflow: 'hidden', boxSizing: 'border-box', marginTop: '5mm' }}>
                <ExamHalfPage examData={examData} />
            </div>
        </div>
    );
});

// --- MODIFIÉ : Le style du corrigé a été ajusté ---
const PrintableCorrectionMatiere = React.forwardRef(({ examData }, ref) => {
    if (!examData) return null;
    const { questions, index, parentExam, duree, selectedPromotion, matiereAbreviation } = examData;
    const formattedDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
    
    // MODIFIÉ : Taille de police augmentée et interligne ajusté pour plus de clarté
    const baseStyle = { fontFamily: 'Arial, sans-serif', fontSize: '11.5pt', lineHeight: '1.2' };
    const headerTextStyle = { ...baseStyle, textAlign: 'center', fontWeight: 'bold', padding: '2px 0' };
    const questionStyle = { ...baseStyle, marginBottom: '12px', paddingBottom: '6px', borderBottom: '1px dashed #ccc', display: 'flex' };
    const answerStyle = { ...baseStyle, color: '#16a34a', fontWeight: 'bold' };
    const noAnswerStyle = { ...baseStyle, fontStyle: 'italic', color: '#999' };
    const tableCellStyle = { padding: '5px 8px', verticalAlign: 'middle', ...baseStyle };

    return (
        <div ref={ref} style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box', padding: '15mm', backgroundColor: 'white', color: 'black' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
                <tbody>
                    <tr>
                        <td colSpan="3" style={{ ...tableCellStyle, borderBottom: '1px solid black', padding: '8px' }}>
                            <div style={headerTextStyle}>DIRECTEURE DE L'INSTRUCTION</div>
                            <div style={headerTextStyle}>
                                {selectedPromotion ? `${selectedPromotion.nom_promotion.toUpperCase()} COURS DE FORMATION DES ELEVES GENDARMES` : 'COURS DE FORMATION DES ELEVES GENDARMES'}
                            </div>
                            <div style={headerTextStyle}>CORRIGÉ - {parentExam?.titre?.toUpperCase() || 'TEST JOURNALIER'}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ ...tableCellStyle, width: '33.33%', borderRight: '1px solid black' }}><span style={{ textDecoration: 'underline' }}>MATIERE</span> : {matiereAbreviation}</td>
                        <td style={{ ...tableCellStyle, width: '33.33%', borderRight: '1px solid black' }}><span style={{ textDecoration: 'underline' }}>DATE</span> : {formattedDate}</td>
                        <td style={{ ...tableCellStyle, width: '33.33%' }}><span style={{ textDecoration: 'underline' }}>DUREE</span> : {duree}</td>
                    </tr>
                </tbody>
            </table>
            <div style={{ ...baseStyle, textAlign: 'center', textDecoration: 'underline', fontWeight: 'bold', margin: '20px 0' }}>Sujet {index + 1}</div>
            <div>
                {questions.map((q, qIndex) => {
                    const correctAnswers = q.reponses?.filter(r => r.est_correcte === true) || [];
                    return (
                        <div key={q.id || qIndex} style={questionStyle}>
                            <span style={{ marginRight: '8px' }}>{qIndex + 1}.</span>
                            <div style={{ flex: 1 }}>
                                <span>{q.enonce}</span><span style={{ fontStyle: 'italic', color: '#4A5568', marginLeft: '10px' }}>({q.points} points)</span>
                                
                                {/* MODIFIÉ : Conteneur de réponse sans indentation */}
                                <div style={{ marginTop: '8px' }}>
                                    <strong style={answerStyle}>Réponse(s) :</strong>
                                    
                                    {/* MODIFIÉ : Remplacement de <ul>/<li> par des <div> pour supprimer les puces et resserrer les lignes */}
                                    {correctAnswers.length > 0 ? (
                                        <div style={{ marginTop: '4px' }}>
                                            {correctAnswers.map((ans, ansIndex) => (
                                                <div key={ansIndex} style={baseStyle}>{ans.texte}</div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span style={{ ...noAnswerStyle, marginLeft: '10px' }}>[Aucune réponse correcte définie]</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

const SubjectDetailModal = ({ versionData, onClose, index, allMatieres }) => {
    const groupedVersion = useMemo(() => groupQuestionsByMatiere(versionData, allMatieres), [versionData, allMatieres]);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-xl font-bold text-indigo-700">Détail du Sujet {index + 1}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {Object.entries(groupedVersion).map(([matiereName, questions]) => (
                        <div key={matiereName} className="mb-6">
                            <h4 className="font-semibold text-lg text-gray-800 border-b pb-2 mb-3">{matiereName}</h4>
                            <ul className="list-decimal list-inside space-y-2 text-gray-700 pl-2">{questions.map((q) => (<li key={q.id}>{q.enonce} <span className="text-sm italic text-gray-500">({q.points} pts)</span></li>))}</ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const GenerateExamPage = () => {
    const [allMatieres, setAllMatieres] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [parentExams, setParentExams] = useState([]);
    const [availableChapitres, setAvailableChapitres] = useState([]);
    const [selectedMatiereIds, setSelectedMatiereIds] = useState([]);
    const [selectedChapitreIds, setSelectedChapitreIds] = useState([]);
    const [selectedPromotionId, setSelectedPromotionId] = useState('');
    const [selectedParentExamId, setSelectedParentExamId] = useState('');
    const [pointsPerMatiere, setPointsPerMatiere] = useState({});
    const [generatedVersions, setGeneratedVersions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [numVersions, setNumVersions] = useState(3);
    const [isSaved, setIsSaved] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportConfig, setExportConfig] = useState({});
    const [exporting, setExporting] = useState(false);
    const [dataToPrint, setDataToPrint] = useState(null);
    const printableRef = useRef();
    const [correctionDataToPrint, setCorrectionDataToPrint] = useState(null);
    const correctionPrintableRef = useRef();
    const [selectedVersionForModal, setSelectedVersionForModal] = useState(null);
    const [repetitionInfo, setRepetitionInfo] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                const [matieresRes, promotionsRes] = await Promise.all([
                    apiClient.get('/matieres'),
                    apiClient.get('/promotions'),
                ]);
                setAllMatieres(matieresRes.data);
                setPromotions(promotionsRes.data);
            } catch (err) { setError('Impossible de charger les données initiales.'); }
            finally { setLoading(false); }
        };
        fetchInitialData();
    }, []);

    const loadParentExams = useCallback(async (promotionId) => {
        setLoading(true); setError('');
        try {
            const params = new URLSearchParams(); if (promotionId) params.append('promotionId', promotionId);
            const res = await apiClient.get(`/examens?${params.toString()}`);
            setParentExams(res.data);
        } catch (err) { setError("Erreur lors du chargement des modèles d'examen."); setParentExams([]); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadParentExams(selectedPromotionId); setSelectedParentExamId(''); }, [selectedPromotionId, loadParentExams]);

    useEffect(() => {
        if (selectedMatiereIds.length === 0) { setAvailableChapitres([]); setSelectedChapitreIds([]); return; }
        const fetchChapitres = async () => {
            try {
                const res = await apiClient.get('/chapitres');
                const filteredChapitres = res.data.filter(chap => selectedMatiereIds.includes(String(chap.id_matiere)));
                setAvailableChapitres(filteredChapitres);
                setSelectedChapitreIds(prev => prev.filter(chapId => filteredChapitres.some(c => String(c.id) === String(chapId))));
            } catch (err) { setError("Erreur lors du chargement des chapitres."); }
        };
        fetchChapitres();
    }, [selectedMatiereIds]);

    const handleGenerate = async () => {
        if (!selectedParentExamId || selectedMatiereIds.length === 0) { setError("Veuillez choisir un modèle d'examen et au moins une matière."); return; }
        setLoading(true); setError(''); setSuccessMessage(''); setGeneratedVersions([]); setIsSaved(false); setRepetitionInfo(null);
        try {
            const payload = { matiereIds: selectedMatiereIds, chapitreIds: selectedChapitreIds, pointsPerMatiere: pointsPerMatiere, numVersions: Number(numVersions) };
            const res = await apiClient.post('/generate-exam-versions', payload);
            if (res.data.versions && res.data.versions.length > 0 && res.data.versions.some(v => v.length > 0)) {
                setGeneratedVersions(res.data.versions);
                setSuccessMessage(res.data.message || `${res.data.versions.length} sujet(s) ont été générés avec succès !`);
                setRepetitionInfo(analyzeRepetitions(res.data.versions));
            } else { setError(res.data.message || "Aucun sujet n'a pu être généré avec les critères actuels."); }
        } catch (err) { setError(err.response?.data?.message || 'Une erreur est survenue lors de la génération.'); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!selectedParentExamId || generatedVersions.length === 0) { setError("Impossible de sauvegarder : aucun modèle d'examen ou sujet généré."); return; }
        setLoading(true); setError(''); setSuccessMessage('');
        try {
            const payload = { id_examen_parent: selectedParentExamId, versions: generatedVersions, exportConfig: exportConfig };
            await apiClient.post('/save-generated-exams', payload);
            setSuccessMessage('Sujets enregistrés avec succès dans la base de données !');
            setIsSaved(true);
        } catch (err) { setError(err.response?.data?.message || 'Une erreur est survenue lors de la sauvegarde.'); }
        finally { setLoading(false); }
    };

    const handlePDFExport = async () => {
        setIsExportModalOpen(false); setExporting(true); setError('');
        
        try {
            const parentExam = parentExams.find(e => e.id == selectedParentExamId);
            const selectedPromotion = promotions.find(p => p.id == selectedPromotionId);
            const examsByMatiere = {};
            allMatieres.forEach(matiere => {
                if (selectedMatiereIds.includes(String(matiere.id))) {
                    examsByMatiere[matiere.nom_matiere] = { id_matiere: matiere.id, versions: Array.from({ length: numVersions }, () => []) };
                }
            });
            generatedVersions.forEach((version, versionIndex) => {
                const groupedQuestions = groupQuestionsByMatiere(version, allMatieres);
                for (const [matiereName, questions] of Object.entries(groupedQuestions)) {
                    if (examsByMatiere[matiereName]) examsByMatiere[matiereName].versions[versionIndex] = questions;
                }
            });
            for (const [matiereName, matiereData] of Object.entries(examsByMatiere)) {
                if (matiereData.versions.every(v => v.length === 0)) continue;
                const config = exportConfig[matiereData.id_matiere];
                if (!config) continue;
                const matiereObject = allMatieres.find(m => m.id === matiereData.id_matiere);
                const matiereAbreviation = matiereObject?.abreviation || matiereName.substring(0, 3).toUpperCase();
                const subjectsPdf = new jsPDF('p', 'mm', 'a4');
                const correctionsPdf = new jsPDF('p', 'mm', 'a4');
                for (let i = 0; i < matiereData.versions.length; i++) {
                    const questionsOfVersion = matiereData.versions[i];
                    if (questionsOfVersion.length === 0) continue;
                    const commonData = { questions: questionsOfVersion, index: i, parentExam, duree: config.duree, selectedPromotion, matiereAbreviation };
                    setDataToPrint(commonData);
                    await new Promise(resolve => setTimeout(resolve, 50));
                    if (printableRef.current) {
                        const canvas = await html2canvas(printableRef.current, { scale: 2, useCORS: true });
                        if (i > 0) subjectsPdf.addPage();
                        subjectsPdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
                    }
                    setCorrectionDataToPrint(commonData);
                    await new Promise(resolve => setTimeout(resolve, 50));
                    if (correctionPrintableRef.current) {
                        const canvas = await html2canvas(correctionPrintableRef.current, { scale: 2, useCORS: true });
                        if (i > 0) correctionsPdf.addPage();
                        correctionsPdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 210, 297, undefined, 'FAST');
                    }
                }
                const sanitizedMatiereName = matiereName.replace(/[^a-z0-9]/gi, '_');
                subjectsPdf.save(`${sanitizedMatiereName}_Sujets.pdf`);
                correctionsPdf.save(`${sanitizedMatiereName}_Corriges.pdf`);
            }
        } catch (err) {
            console.error("Erreur durant l'export PDF:", err);
            setError("Une erreur est survenue lors de la génération des PDF.");
        } finally {
            setExporting(false);
            setDataToPrint(null);
            setCorrectionDataToPrint(null);
        }
    };

    const handleWordExport = async () => {
        setIsExportModalOpen(false); setExporting(true); setError('');
        // ... (Logique Word complète si nécessaire, non modifiée)
        setExporting(false);
    };

    const handleOralExport = async () => {
        if (selectedMatiereIds.length === 0) {
            setError("Veuillez sélectionner au moins une matière pour générer les fiches d'oral.");
            return;
        }
        setExporting(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await apiClient.post('/questions/for-oral', {
                matiereIds: selectedMatiereIds,
                chapitreIds: selectedChapitreIds,
            });
            const allQuestions = response.data;

            if (!allQuestions || allQuestions.length === 0) {
                setError("Aucune question trouvée pour les matières/chapitres sélectionnés. Impossible de générer les fiches d'oral.");
                setExporting(false);
                return;
            }

            const questionsByMatiereId = new Map();
            allQuestions.forEach(question => {
                if (!questionsByMatiereId.has(question.id_matiere)) {
                    questionsByMatiereId.set(question.id_matiere, []);
                }
                questionsByMatiereId.get(question.id_matiere).push(question);
            });

            for (const [matiereId, questionsList] of questionsByMatiereId.entries()) {
                const matiere = allMatieres.find(m => m.id === matiereId);
                if (!matiere) continue;

                let questions = [...questionsList];
                if (questions.length > 50) {
                    questions = shuffleArray(questions).slice(0, 50);
                }

                const shuffledQuestions = shuffleArray(questions);
                const questionCount = shuffledQuestions.length;
                if (questionCount === 0) continue;

                const instructorRows = [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: "Numéro Tiré", alignment: AlignmentType.CENTER, style: "HeaderStyle" })] }),
                            new TableCell({ children: [new Paragraph({ text: "Question", alignment: AlignmentType.CENTER, style: "HeaderStyle" })] }),
                        ],
                    })
                ];
                shuffledQuestions.forEach((q, index) => {
                    instructorRows.push(new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: `${index + 1}`, alignment: AlignmentType.CENTER })], verticalAlign: "center" }),
                            new TableCell({ children: [new Paragraph(q.enonce)] }),
                        ]
                    }));
                });

                const instructorDoc = new Document({
                    styles: { paragraphStyles: [{ id: "HeaderStyle", name: "HeaderStyle", run: { bold: true, size: 24 } }] },
                    sections: [{
                        children: [
                            new Paragraph({ text: `Fiche Instructeur - Oral ${matiere.nom_matiere}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                            new Paragraph(""),
                            new Table({
                                rows: instructorRows,
                                width: { size: 100, type: WidthType.PERCENTAGE },
                                columnWidths: [1500, 8135],
                            }),
                        ],
                    }],
                });

                const numberCells = [];
                for (let i = 1; i <= questionCount; i++) {
                    numberCells.push(
                        new TableCell({
                            children: [new Paragraph({ text: `${i}`, alignment: AlignmentType.CENTER, style: "NumberStyle" })],
                            borders: { top: { style: BorderStyle.DASHED, size: 1, color: "BFBFBF" }, bottom: { style: BorderStyle.DASHED, size: 1, color: "BFBFBF" }, left: { style: BorderStyle.DASHED, size: 1, color: "BFBFBF" }, right: { style: BorderStyle.DASHED, size: 1, color: "BFBFBF" } },
                        })
                    );
                }

                const numberRows = [];
                const cellsPerRow = 5;
                for (let i = 0; i < numberCells.length; i += cellsPerRow) {
                    numberRows.push(new TableRow({ children: numberCells.slice(i, i + cellsPerRow) }));
                }

                const tirageDoc = new Document({
                    styles: { paragraphStyles: [{ id: "NumberStyle", name: "NumberStyle", run: { size: 48, bold: true } }] },
                    sections: [{
                        children: [
                            new Paragraph({ text: `Numéros pour Tirage au Sort - Oral ${matiere.nom_matiere}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
                            new Paragraph({ text: "À découper pour le tirage au sort par les élèves.", alignment: AlignmentType.CENTER }),
                            new Paragraph(""),
                            new Table({ rows: numberRows, width: { size: 100, type: WidthType.PERCENTAGE } }),
                        ],
                    }],
                });

                const sanitizedMatiereName = matiere.nom_matiere.replace(/[^a-z0-9]/gi, '_');
                Packer.toBlob(instructorDoc).then(blob => saveAs(blob, `${sanitizedMatiereName}_Oral_Instructeur.docx`));
                Packer.toBlob(tirageDoc).then(blob => saveAs(blob, `${sanitizedMatiereName}_Oral_Tirage.docx`));
            }

            setSuccessMessage("Fiches pour l'oral générées avec succès !");

        } catch (err) {
            console.error("Erreur durant la génération de l'oral :", err);
            setError(err.response?.data?.message || "Une erreur est survenue lors de la génération des fiches pour l'oral. Assurez-vous que votre API expose bien la route POST /questions/for-oral.");
        } finally {
            setExporting(false);
        }
    };

    const handleMatiereChange = (matiereId) => {
        const strId = String(matiereId);
        const newSelectedIds = selectedMatiereIds.includes(strId) ? selectedMatiereIds.filter(id => id !== strId) : [...selectedMatiereIds, strId];
        setSelectedMatiereIds(newSelectedIds);
        setPointsPerMatiere(prevPoints => {
            const newPoints = { ...prevPoints };
            if (newSelectedIds.includes(strId)) { if (!newPoints[strId]) newPoints[strId] = 20; }
            else { delete newPoints[strId]; }
            return newPoints;
        });
    };

    const handlePointsChange = (matiereId, value) => {
        setPointsPerMatiere(prevPoints => ({ ...prevPoints, [String(matiereId)]: Number(value) }));
    };

    const handleChapitreChange = (chapitreId) => {
        const strId = String(chapitreId);
        setSelectedChapitreIds(prev => prev.includes(strId) ? prev.filter(id => id !== strId) : [...prev, strId]);
    };

    const openExportModal = () => {
        const initialConfig = {};
        const selectedMatieresToExport = allMatieres.filter(m => selectedMatiereIds.includes(String(m.id)));
        selectedMatieresToExport.forEach(matiere => {
            initialConfig[matiere.id] = { duree: '2 HEURES', coefficient: '2' };
        });
        setExportConfig(initialConfig);
        setIsExportModalOpen(true);
    };

    const handleExportConfigChange = (matiereId, field, value) => {
        setExportConfig(prev => ({ ...prev, [matiereId]: { ...prev[matiereId], [field]: value } }));
    };

    return (
        <>
            {exporting && <ExportLoaderModal />}
            {selectedVersionForModal && <SubjectDetailModal versionData={selectedVersionForModal.version} index={selectedVersionForModal.index} allMatieres={allMatieres} onClose={() => setSelectedVersionForModal(null)} />}

            {isExportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
                        <button onClick={() => setIsExportModalOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Finaliser l'Exportation des Sujets Écrits</h3>
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                             {Object.keys(exportConfig).length > 0 ? Object.keys(exportConfig).map(matiereId => {
                                 const matiere = allMatieres.find(m => String(m.id) === matiereId);
                                 if (!matiere) return null;
                                 return (
                                     <div key={matiereId} className="p-3 border rounded-md bg-gray-50">
                                         <h4 className="font-semibold text-gray-700 mb-2">{matiere.nom_matiere}</h4>
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             <div>
                                                 <label htmlFor={`duree-${matiereId}`} className="block text-sm font-medium text-gray-700">Durée</label>
                                                 <input id={`duree-${matiereId}`} type="text" value={exportConfig[matiereId]?.duree || ''} onChange={e => handleExportConfigChange(matiereId, 'duree', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md p-2 shadow-sm" />
                                             </div>
                                             <div>
                                                 <label htmlFor={`coeff-${matiereId}`} className="block text-sm font-medium text-gray-700">Coefficient</label>
                                                 <input id={`coeff-${matiereId}`} type="text" value={exportConfig[matiereId]?.coefficient || ''} onChange={e => handleExportConfigChange(matiereId, 'coefficient', e.target.value)} className="mt-1 w-full border-gray-300 rounded-md p-2 shadow-sm" />
                                             </div>
                                         </div>
                                     </div>
                                 );
                             }) : <p className="text-gray-500">Aucune matière sélectionnée pour l'export.</p>}
                        </div>
                        <div className="mt-6 flex flex-wrap justify-end gap-3">
                            <button onClick={handlePDFExport} disabled={exporting} className="inline-flex justify-center items-center bg-red-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-red-700 disabled:bg-gray-400"><Printer size={20} className="mr-2"/>Exporter PDF</button>
                            <button onClick={handleWordExport} disabled={exporting} className="inline-flex justify-center items-center bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400"><FileText size={20} className="mr-2"/>Exporter Word</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
                <PrintableExamMatiere ref={printableRef} examData={dataToPrint} />
                <PrintableCorrectionMatiere ref={correctionPrintableRef} examData={correctionDataToPrint} />
            </div>

            <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">Générateur de Sujets d'Examen</h1>
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><Settings size={24} className="mr-2" />Configuration</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Filtrer par Promotion</label><select value={selectedPromotionId} onChange={e => setSelectedPromotionId(e.target.value)} className="w-full border-gray-300 rounded-md p-2 shadow-sm" ><option value="">-- Toutes les promotions --</option>{promotions.map(p => <option key={p.id} value={p.id}>{p.nom_promotion}</option>)}</select></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Modèle d'Examen (pour l'écrit)</label><select value={selectedParentExamId} onChange={e => setSelectedParentExamId(e.target.value)} className="w-full border-gray-300 rounded-md p-2 shadow-sm" disabled={loading || parentExams.length === 0}><option value="">-- Choisir un modèle --</option>{parentExams.map(e => <option key={e.id} value={e.id}>{e.titre}</option>)}</select></div>
                            <div className="md:col-span-1"><label htmlFor="num-versions" className="block text-sm font-medium text-gray-700 mb-1">Nombre de sujets écrits</label><input id="num-versions" type="number" min="1" value={numVersions} onChange={e => setNumVersions(e.target.value)} className="w-full border-gray-300 rounded-md p-2 shadow-sm" /></div>

                            <div className="md:col-span-2">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">1. Choisir les Matières</label>
                                    <button
                                        onClick={handleOralExport}
                                        disabled={loading || exporting || selectedMatiereIds.length === 0}
                                        className="inline-flex items-center bg-teal-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        title={selectedMatiereIds.length === 0 ? "Sélectionnez au moins une matière" : "Générer les fiches pour un oral"}
                                    >
                                        <Mic size={20} className="mr-2" />Générer Fiches Oral
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md border">{allMatieres.map(m => (<label key={m.id} className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors cursor-pointer ${selectedMatiereIds.includes(String(m.id)) ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}><input type="checkbox" onChange={() => handleMatiereChange(m.id)} checked={selectedMatiereIds.includes(String(m.id))} className="sr-only" />{m.nom_matiere}</label>))}</div>
                            </div>

                            {selectedMatiereIds.length > 0 && (
                                <div className="md:col-span-2 mt-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total de points par matière (pour l'écrit)</label>
                                    <div className="space-y-2 p-3 bg-gray-50 rounded-md border">
                                        {selectedMatiereIds.map(id => {
                                            const matiere = allMatieres.find(m => String(m.id) === id); if (!matiere) return null;
                                            return (<div key={id} className="grid grid-cols-3 items-center gap-3"><label htmlFor={`points-${id}`} className="text-sm font-medium text-gray-600 col-span-2">{matiere.nom_matiere}</label><input id={`points-${id}`} type="number" value={pointsPerMatiere[id] || ''} onChange={(e) => handlePointsChange(id, e.target.value)} className="w-full border-gray-300 rounded-md p-2 shadow-sm text-center" placeholder="ex: 20" /></div>);
                                        })}
                                    </div>
                                </div>
                            )}
                            
                            {availableChapitres.length > 0 && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">2. Affiner par Chapitres (Optionnel, pour l'écrit et l'oral)</label>
                                    <div className="space-y-4 p-3 bg-gray-50 rounded-md max-h-60 overflow-y-auto border">
                                        {selectedMatiereIds.map(matiereId => {
                                            const matiere = allMatieres.find(m => String(m.id) === matiereId);
                                            const chapitresPourMatiere = availableChapitres.filter(c => String(c.id_matiere) === matiereId);

                                            if (!matiere || chapitresPourMatiere.length === 0) return null;

                                            return (
                                                <div key={matiereId}>
                                                    <h4 className="font-semibold text-gray-800 mb-2">{matiere.nom_matiere}</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {chapitresPourMatiere.map(c => (
                                                            <label key={c.id} className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors cursor-pointer ${selectedChapitreIds.includes(String(c.id)) ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                                                <input type="checkbox" onChange={() => handleChapitreChange(c.id)} checked={selectedChapitreIds.includes(String(c.id))} className="sr-only" />
                                                                {c.nom_chapitre}
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 text-right"><button onClick={handleGenerate} disabled={loading} className="inline-flex items-center bg-indigo-600 text-white py-2 px-6 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400"><Zap size={20} className="mr-2" />{loading ? 'Génération...' : 'Générer Sujets Écrits'}</button></div>
                    </div>

                    {error && (<div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6" role="alert"><p className="font-bold flex items-center"><AlertTriangle size={20} className="mr-2" />Erreur</p><p>{error}</p></div>)}
                    {successMessage && (<div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-6" role="alert"><p className="font-bold flex items-center"><CheckCircle size={20} className="mr-2" />Succès</p><p>{successMessage}</p></div>)}
                    {repetitionInfo && repetitionInfo.repeatedQuestions.length > 0 && (
                        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md mb-6" role="alert">
                            <p className="font-bold flex items-center"><BarChart2 size={20} className="mr-2" />Analyse de Répétition</p>
                            <p className="mb-2">{repetitionInfo.repeatedQuestions.length} question(s) sont répétées sur plusieurs sujets. Taux de redondance : <strong>{((repetitionInfo.repeatedQuestions.length / repetitionInfo.totalUniqueQuestions) * 100).toFixed(1)}%</strong></p>
                            <details><summary className="cursor-pointer font-semibold text-sm">Voir les questions répétées</summary><ul className="list-disc pl-5 mt-2 text-sm">{repetitionInfo.repeatedQuestions.map(q => (<li key={q.id}>"{q.enonce}" <span className="italic">(présente dans {q.count} sujets)</span></li>))}</ul></details>
                        </div>
                    )}
                    {generatedVersions.length > 0 && (
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-700">Sujets Écrits Générés</h2>
                                <div className="flex space-x-3">
                                    <button onClick={handleSave} disabled={loading || isSaved} className={`inline-flex items-center text-white py-2 px-4 rounded-lg shadow-md transition-colors duration-200 ${isSaved ? 'bg-green-600 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700'}`}><Save size={20} className="mr-2" />{loading ? 'Sauvegarde...' : (isSaved ? 'Enregistré !' : 'Sauvegarder')}</button>
                                    <button onClick={openExportModal} className="inline-flex items-center bg-blue-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-700"><Printer size={20} className="mr-2" />Exporter</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{generatedVersions.map((version, index) => (<button key={index} onClick={() => setSelectedVersionForModal({ version, index })} className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg bg-gray-50 hover:bg-indigo-100 hover:border-indigo-400 transition-all duration-200"><Eye size={24} className="text-indigo-600 mb-2" /><span className="font-bold text-gray-800">Sujet {index + 1}</span></button>))}</div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default GenerateExamPage;
