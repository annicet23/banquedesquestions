// frontend/src/App.jsx (VERSION FINALE SANS BrowserRouter)

import React from 'react';
// MODIFIÉ : BrowserRouter a été retiré des imports
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

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

// Le ProtectedRoute reste le même
const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();
    if (loading) return <div className="flex justify-center items-center h-screen">Chargement...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
};

// Le MainLayout reste le même
const MainLayout = () => (
    <>
        <Navbar />
        <main className="pt-16"><Outlet /></main>
    </>
);

// App ne contient plus le BrowserRouter, juste le Provider et les Routes
function App() {
  return (
    <AuthProvider>
        {/* Le BrowserRouter a été retiré, car il est déjà dans main.tsx */}
        <Routes>
            {/* Route publique */}
            <Route path="/login" element={<LoginPage />} />

            {/* GROUPE DE ROUTES PROTÉGÉES */}
            <Route element={<MainLayout />}>
                
                {/* Routes accessibles à 'admin' et 'saisie' */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'saisie']} />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/matieres" element={<MatiereManagementPage />} />
                    <Route path="/chapitres" element={<ChapitreManagementPage />} />
                    <Route path="/examens" element={<ExamenManagementPage />} />
                    <Route path="/questions" element={<QuestionManagementPage />} />
                    <Route path="/promotions" element={<PromotionManagementPage />} />
                    <Route path="/generate-exam" element={<GenerateExamPage />} />
                    <Route path="/sujets-sauvegardes" element={<PageSujet />} />
                    <Route path="/examens/:examenId/questions" element={<QuestionManagementPage />} />
                </Route>

                {/* Routes accessibles UNIQUEMENT à 'admin' */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/users" element={<UserManagementPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                </Route>
            
            </Route>

            {/* Redirections par défaut */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
    </AuthProvider>
  );
}

export default App;
