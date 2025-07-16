import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Book, Library, FileText, HelpCircle } from 'lucide-react'; // <-- Import des icônes

// --- NOUVEAU : Composant de carte réutilisable ---
const DashboardCard = ({ to, icon, title, color }) => {
    // Crée l'icône dynamiquement
    const IconComponent = React.createElement(icon, { className: "w-12 h-12 mb-4" });

    return (
        <Link
            to={to}
            className={`group block bg-white p-8 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-${color}`}
        >
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
    const navigate = useNavigate();

    useEffect(() => {
        // La logique de redirection est déjà gérée par ProtectedRoute,
        // donc ici on se contente de récupérer les infos de l'utilisateur.
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecode(token);
            setUsername(decodedToken.username);
            setRole(decodedToken.role);
        }
    }, []);

    // Classe pour le hack de couleur de Tailwind (voir explication plus bas)
    const hiddenColorClasses = "hover:border-blue-500 text-blue-500 hover:border-purple-500 text-purple-500 hover:border-green-500 text-green-500 hover:border-orange-500 text-orange-500 hover:border-teal-500 text-teal-500";


    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="container mx-auto">

                {/* --- Section de bienvenue --- */}
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

                    {/* Cartes pour la Gestion du Contenu (Admin et Saisie) */}
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
                                to="/examens"
                                icon={FileText}
                                title="Examens"
                                color="blue-500"
                            />
                            <DashboardCard
                                to="/questions"
                                icon={HelpCircle}
                                title="Questions"
                                color="teal-500"
                            />
                        </>
                    )}
                </div>

                {/* Ce div est un "hack" pour que Tailwind CSS inclue les couleurs dynamiques. Il est invisible. */}
                <div className="hidden hover:border-blue-500 text-blue-500 hover:border-purple-500 text-purple-500 hover:border-green-500 text-green-500 hover:border-orange-500 text-orange-500 hover:border-teal-500 text-teal-500" />
            </div>
        </div>
    );
};

export default DashboardPage;