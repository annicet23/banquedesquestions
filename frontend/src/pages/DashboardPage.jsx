// --- START OF FILE frontend/src/pages/DashboardPage.jsx (CORRECTION FINALE) ---

import React, { useEffect, useState, useMemo } from 'react'; // Ajout de useMemo
import { jwtDecode } from 'jwt-decode';
import { Link } from 'react-router-dom';
import {
    Users, Book, Library, FileText, HelpCircle, GraduationCap, Archive, Wand2,
} from 'lucide-react';

// --- LE HOOK "MACHINE À ÉCRIRE" EST MAINTENANT DÉFINI À L'EXTÉRIEUR ---
// Il n'est plus recréé à chaque rendu. C'est la correction principale.
const useTypewriter = (phrases, typingSpeed = 50, pauseDuration = 3000) => {
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let timeoutId;

        const handleTyping = () => {
            // Si on a fini d'écrire la phrase actuelle
            if (charIndex === phrases[phraseIndex].length) {
                // On attend avant de passer à la suivante
                timeoutId = setTimeout(() => {
                    setPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
                    setCharIndex(0);
                    setDisplayedText('');
                }, pauseDuration);
            } else {
                // Sinon, on continue d'écrire
                timeoutId = setTimeout(() => {
                    setDisplayedText((prev) => prev + phrases[phraseIndex][charIndex]);
                    setCharIndex((prev) => prev + 1);
                }, typingSpeed);
            }
        };

        handleTyping();

        // Nettoyage du minuteur
        return () => clearTimeout(timeoutId);

    }, [charIndex, phraseIndex, phrases, typingSpeed, pauseDuration]);

    return displayedText;
};


// Le composant DashboardCard ne change pas
const DashboardCard = ({ to, icon, title, color }) => {
    const IconComponent = React.createElement(icon, { className: "w-12 h-12 mb-4" });
    return (
        <Link
            to={to}
            className={`group block bg-card p-8 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-2 border-transparent hover:border-${color}`}
        >
            <div className={`text-${color}`}>
                {IconComponent}
            </div>
            <h3 className="text-xl font-semibold text-card-foreground group-hover:text-gray-900">{title}</h3>
        </Link>
    );
};


const DashboardPage = () => {
    // Les états pour l'utilisateur
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('');
    const [grade, setGrade] = useState('');

    // On prépare la liste des phrases descriptives.
    const DYNAMIC_MESSAGES = useMemo(() => [
        "Cette application permet de digitaliser la banque de questions.",
        "Générez des sujets d'examens oraux et écrits en quelques secondes.",
        "Créez plus de 10 versions uniques d'un même examen simultanément.",
        "La sécurité des sujets est renforcée pour éviter toute fuite d'information."
    ], []); // useMemo garantit que la liste n'est créée qu'une fois.

    const [greeting, setGreeting] = useState('');
    const [welcomeMessage, setWelcomeMessage] = useState("Que souhaitez-vous faire aujourd'hui ?");
    
    // On utilise notre hook pour les phrases descriptives
    const dynamicDescription = useTypewriter(DYNAMIC_MESSAGES, 40, 3000);

    useEffect(() => {
        // Logique pour récupérer les infos de l'utilisateur
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const user = decodedToken.username || '';
                const g = decodedToken.grade || '';

                setUsername(user);
                setRole(decodedToken.role || '');
                setGrade(g);

                // Définir le message de salutation une seule fois
                const chefGrades = ['GP2C', 'GHC', 'G1C', 'G2C', 'GST'];
                if (chefGrades.includes(g)) setGreeting("Mes respects Chef");
                else {
                    switch (g) {
                        case 'GCA': case 'GDI': case 'GBG': setGreeting("Mes devoirs mon Général"); break;
                        case 'COL': case 'LCL': setGreeting("Mes respects mon Colonel"); break;
                        case 'CEN': setGreeting("Mes respects mon Commandant"); break;
                        case 'CNE': setGreeting("Mes respects mon Capitaine"); break;
                        case 'LTN': case 'GPCE': setGreeting("Mes respects mon Lieutenant"); break;
                        case 'GPHC': setGreeting("Mes respects mon Adjudant-chef"); break;
                        case 'GP1C': setGreeting("Mes respects mon Adjudant"); break;
                        default: setGreeting(<>Bonjour, <span className="text-primary">{user}</span> !</>);
                    }
                }
            } catch (error) {
                console.error("Erreur lors du décodage du token:", error);
            }
        }
        
        // Minuteur pour remplacer le message de bienvenue par le cycle dynamique
        const welcomeTimer = setTimeout(() => {
            setWelcomeMessage(dynamicDescription);
        }, 3000); // Démarre le cycle après 3 secondes

        return () => clearTimeout(welcomeTimer);

    }, [dynamicDescription]); // Se met à jour quand la description change

    const tailwindColorHack = "hover:border-blue-500 text-blue-500 hover:border-purple-500 text-purple-500 hover:border-green-500 text-green-500 hover:border-orange-500 text-orange-500 hover:border-teal-500 text-teal-500 hover:border-red-500 text-red-500 hover:border-indigo-500 text-indigo-500 hover:border-pink-500 text-pink-500";

    return (
        <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
            <div className="container mx-auto">
                <div className="flex items-center gap-4 sm:gap-6 mb-12">
                    <img
                        src="/gendarme.png"
                        alt="Mascotte Gendarme"
                        className="w-24 h-auto flex-shrink-0 sm:w-32"
                    />
                    <div className="speech-bubble bg-card p-6 rounded-lg shadow-lg flex-grow min-h-[120px]">
                        <h1 className="text-2xl sm:text-3xl font-bold text-card-foreground">
                            {greeting}
                        </h1>
                        <p className="mt-2 text-md sm:text-lg text-muted-foreground">
                            {welcomeMessage}
                            {/* Le curseur clignotant s'affiche à côté du texte */}
                            <span className="typing-cursor"></span>
                        </p>
                    </div>
                </div>

                {/* Le reste de la page ne change pas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {role === 'admin' && (
                        <DashboardCard
                            to="/users"
                            icon={Users}
                            title="Gestion Comptes"
                            color="purple-500"
                        />
                    )}
                    {(role === 'admin' || role === 'saisie') && (
                        <>
                            <DashboardCard to="/matieres" icon={Book} title="Matières" color="green-500" />
                            <DashboardCard to="/chapitres" icon={Library} title="Chapitres" color="orange-500" />
                            <DashboardCard to="/questions" icon={HelpCircle} title="Questions" color="teal-500" />
                            <DashboardCard to="/promotions" icon={GraduationCap} title="Promotions" color="red-500" />
                            <DashboardCard to="/examens" icon={FileText} title="Modèles d'Examen" color="blue-500" />
                            <DashboardCard to="/generate-exam" icon={Wand2} title="Générateur" color="pink-500" />
                            <DashboardCard to="/sujets-sauvegardes" icon={Archive} title="Sujets Sauvegardés" color="indigo-500" />
                        </>
                    )}
                </div>
                <div className={tailwindColorHack} />
            </div>
        </div>
    );
};

export default DashboardPage;
