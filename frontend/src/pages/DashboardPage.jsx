// --- START OF FILE frontend/src/pages/DashboardPage.jsx ---
import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';
import {
    Users,
    Book,
    Library,
    FileText,
    HelpCircle,
    GraduationCap, // Icône pour Promotions
    Archive,       // Icône pour Sujets Sauvegardés
    Wand2,         // Icône pour le Générateur
} from 'lucide-react';

// Le composant de carte réutilisable reste inchangé
const DashboardCard = ({ to, icon, title, color }) => {
    // Crée l'icône dynamiquement
    const IconComponent = React.createElement(icon, { className: "w-12 h-12 mb-4" });

    return (
        <Link
            to={to}
            // La classe "hover:border-${color}" est générée dynamiquement
            className={`group block bg-white p-8 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-${color}`}
        >
            {/* La classe "text-${color}" est aussi générée dynamiquement */}
            <div className={`text-${color}`}>
                {IconComponent}
            </div>
            <h3 className="text-xl font-semibold text-gray-800 group-hover:text-gray-900">{title}</h3>
        </Link>
    );
};


const DashboardPage = () => {
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecode(token);
            setUsername(decodedToken.username);
            setRole(decodedToken.role);
        }
    }, []);

    // **CORRECTION IMPORTANTE**
    // Cette chaîne de caractères contient TOUTES les classes de couleur dynamiques utilisées.
    // Tailwind peut ainsi les détecter et générer le CSS correspondant.
    const tailwindColorHack = "hover:border-blue-500 text-blue-500 hover:border-purple-500 text-purple-500 hover:border-green-500 text-green-500 hover:border-orange-500 text-orange-500 hover:border-teal-500 text-teal-500 hover:border-red-500 text-red-500 hover:border-indigo-500 text-indigo-500 hover:border-pink-500 text-pink-500";


    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="container mx-auto">

                <div className="mb-10 text-left">
                    <h1 className="text-4xl font-bold text-gray-800">
                        Bienvenue, <span className="text-primary">{username}</span> !
                    </h1>
                    <p className="mt-2 text-lg text-gray-500">
                        Que souhaitez-vous faire aujourd'hui ?
                    </p>
                </div>

                {/* --- Grille des cartes d'action --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                    {/* Carte pour la Gestion des Comptes (Admin seulement) */}
                    {role === 'admin' && (
                        <DashboardCard
                            to="/users"
                            icon={Users}
                            title="Gestion Comptes"
                            color="purple-500"
                        />
                    )}

                    {/* --- AJOUT DES NOUVELLES CARTES --- */}
                    {/* Cartes pour tous les utilisateurs connectés (admin, saisie, etc.) */}
                    {(role === 'admin' || role === 'saisie') && (
                        <>
                            <DashboardCard
                                to="/matieres"
                                icon={Book}
                                title="Matières"
                                color="green-500"
                            />
                            <DashboardCard
                                to="/chapitres"
                                icon={Library}
                                title="Chapitres"
                                color="orange-500"
                            />
                             <DashboardCard
                                to="/questions"
                                icon={HelpCircle}
                                title="Questions"
                                color="teal-500"
                            />
                            <DashboardCard
                                to="/promotions"
                                icon={GraduationCap}
                                title="Promotions"
                                color="red-500"
                            />
                            <DashboardCard
                                to="/examens"
                                icon={FileText}
                                title="Modèles d'Examen"
                                color="blue-500"
                            />
                            <DashboardCard
                                to="/generate-exam"
                                icon={Wand2}
                                title="Générateur"
                                color="pink-500"
                            />
                            <DashboardCard
                                to="/sujets-sauvegardes"
                                icon={Archive}
                                title="Sujets Sauvegardés"
                                color="indigo-500"
                            />
                        </>
                    )}
                </div>

                {/* Ce div invisible applique la variable `tailwindColorHack` pour forcer la compilation des styles */}
                <div className={tailwindColorHack} />
            </div>
        </div>
    );
};

export default DashboardPage;
// --- END OF FILE frontend/src/pages/DashboardPage.jsx ---
