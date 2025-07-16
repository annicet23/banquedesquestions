import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import RegisterPage from './pages/RegisterPage';
import MatiereManagementPage from './pages/MatiereManagementPage';
import ChapitreManagementPage from './pages/ChapitreManagementPage';
import ExamenManagementPage from './pages/ExamenManagementPage';
import QuestionManagementPage from './pages/QuestionManagementPage';
import PromotionManagementPage from './pages/PromotionManagementPage';
import GenerateExamPage from './pages/GenerateExamPage';
import Navbar from './components/Navbar';
import PageSujet from './pages/PageSujet'; // Importation
import { jwtDecode } from 'jwt-decode';

// Le composant pour protéger les routes
const ProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.exp * 1000 < Date.now()) {
            localStorage.clear();
            return <Navigate to="/login" replace />;
        }

        if (allowedRoles && !allowedRoles.includes(decodedToken.role)) {
            return <Navigate to="/dashboard" replace />;
        }

        return children;
    } catch (error) {
        console.error("Token invalide:", error);
        localStorage.clear();
        return <Navigate to="/login" replace />;
    }
};

const App = () => {
    return (
        <>
            <Navbar />
            <div className="pt-16"> {/* Ajout d'un padding-top pour que le contenu ne soit pas sous la navbar fixe */}
                <main>
                    <Routes>
                        {/* Routes Publiques */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                        {/* Routes Protégées */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <DashboardPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/users"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <UserManagementPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <RegisterPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/matieres"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'saisie']}>
                                    <MatiereManagementPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/chapitres"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'saisie']}>
                                    <ChapitreManagementPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/examens"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'saisie']}>
                                    <ExamenManagementPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/questions"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'saisie']}>
                                    <QuestionManagementPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/promotions"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'saisie']}>
                                    <PromotionManagementPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/generate-exam"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'saisie']}>
                                    <GenerateExamPage />
                                </ProtectedRoute>
                            }
                        />
                        {/* NOUVELLE ROUTE POUR LES SUJETS SAUVEGARDÉS */}
                        <Route
                            path="/sujets-sauvegardes"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'saisie']}>
                                    <PageSujet />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/examens/:examenId/questions"
                            element={
                                <ProtectedRoute allowedRoles={['admin', 'saisie']}>
                                    <QuestionManagementPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </main>
            </div>
        </>
    );
};

export default App;