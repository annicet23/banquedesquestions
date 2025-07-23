// frontend/src/App.jsx (Version Corrigée et Améliorée)

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext'; // <--- IMPORTER AuthProvider ET useAuth

// Importation de toutes vos pages
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
import PageSujet from './pages/PageSujet';

import Navbar from './components/Navbar';

// --- NOUVEAU ProtectedRoute utilisant le Contexte ---
// C'est beaucoup plus propre et fiable que de lire localStorage à chaque fois.
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isLoggedIn, user, isLoading } = useAuth();

    // Pendant que le contexte vérifie le token au démarrage, on n'affiche rien.
    if (isLoading) {
        return <div>Chargement...</div>; // Ou un spinner de chargement
    }

    // Si l'utilisateur n'est pas connecté, on le redirige vers le login.
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // Si la route demande un rôle spécifique et que l'utilisateur ne l'a pas, on le redirige.
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />; // Redirection vers une page sûre
    }

    // Si tout est bon, on affiche la page demandée.
    return children;
};

// Le composant App ne fait que définir la structure des routes.
const AppContent = () => {
    return (
        <>
            <Navbar />
            <div className="pt-16">
                <main>
                    <Routes>
                        {/* Routes Publiques */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />

                        {/* Routes Protégées (la logique est maintenant dans notre nouveau ProtectedRoute) */}
                        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
                        <Route path="/register" element={<ProtectedRoute allowedRoles={['admin']}><RegisterPage /></ProtectedRoute>} />
                        <Route path="/matieres" element={<ProtectedRoute allowedRoles={['admin', 'saisie']}><MatiereManagementPage /></ProtectedRoute>} />
                        <Route path="/chapitres" element={<ProtectedRoute allowedRoles={['admin', 'saisie']}><ChapitreManagementPage /></ProtectedRoute>} />
                        <Route path="/examens" element={<ProtectedRoute allowedRoles={['admin', 'saisie']}><ExamenManagementPage /></ProtectedRoute>} />
                        <Route path="/questions" element={<ProtectedRoute allowedRoles={['admin', 'saisie']}><QuestionManagementPage /></ProtectedRoute>} />
                        <Route path="/promotions" element={<ProtectedRoute allowedRoles={['admin', 'saisie']}><PromotionManagementPage /></ProtectedRoute>} />
                        <Route path="/generate-exam" element={<ProtectedRoute allowedRoles={['admin', 'saisie']}><GenerateExamPage /></ProtectedRoute>} />
                        <Route path="/sujets-sauvegardes" element={<ProtectedRoute allowedRoles={['admin', 'saisie']}><PageSujet /></ProtectedRoute>} />
                        <Route path="/examens/:examenId/questions" element={<ProtectedRoute allowedRoles={['admin', 'saisie']}><QuestionManagementPage /></ProtectedRoute>} />
                        
                        {/* Route par défaut */}
                        <Route path="*" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </main>
            </div>
        </>
    );
};

// Le composant principal App qui enveloppe tout avec le Provider.
const App = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
