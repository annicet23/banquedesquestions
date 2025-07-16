import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, ChevronDown, User, Settings, FileText } from 'lucide-react'; // Ajout de FileText

const Navbar = () => {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [userRole, setUserRole] = useState('');

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isGestionMenuOpen, setIsGestionMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const profileMenuRef = useRef(null);
    const gestionMenuRef = useRef(null);

    useEffect(() => {
        const checkLoginStatus = () => {
            const token = localStorage.getItem('token');
            if (token) {
                setIsLoggedIn(true);
                setUsername(localStorage.getItem('username') || 'Utilisateur');
                setUserRole(localStorage.getItem('userRole') || 'rôle');
            } else {
                setIsLoggedIn(false);
            }
        };

        checkLoginStatus();
        window.addEventListener('storage', checkLoginStatus); // Écoute les changements dans le localStorage

        return () => {
            window.removeEventListener('storage', checkLoginStatus);
        };
    }, []);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
            if (gestionMenuRef.current && !gestionMenuRef.current.contains(event.target)) {
                setIsGestionMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        setIsLoggedIn(false);
        setIsProfileMenuOpen(false);
        navigate('/login');
    };

    const navLinkClass = ({ isActive }) =>
        `text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-gray-700 text-white' : ''}`;

    if (!isLoggedIn) {
        return null;
    }

    return (
        <nav className="bg-gray-900 border-b border-gray-700 fixed top-0 left-0 right-0 z-50">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    <div className="flex items-center">
                        <Link to="/dashboard" className="text-white text-2xl font-bold">
                            Banque des Questions
                        </Link>
                    </div>

                    <div className="hidden md:block">
                        <div className="ml-10 flex items-baseline space-x-4">
                            <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>

                            <div className="relative" ref={gestionMenuRef}>
                                <button onClick={() => setIsGestionMenuOpen(prev => !prev)} className="text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-md text-sm font-medium flex items-center">
                                    Gestion <ChevronDown size={16} className="ml-1" />
                                </button>
                                {isGestionMenuOpen && (
                                    <div className="absolute left-0 mt-2 w-56 origin-top-left bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20">
                                        <div className="py-1">
                                            <Link to="/matieres" onClick={() => setIsGestionMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Matières</Link>
                                            <Link to="/chapitres" onClick={() => setIsGestionMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Chapitres</Link>
                                            <Link to="/questions" onClick={() => setIsGestionMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Questions</Link>
                                            <Link to="/promotions" onClick={() => setIsGestionMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">Promotions</Link>
                                            <div className="border-t border-gray-700 my-1"></div>
                                            {/* LIEN AJOUTÉ ICI */}
                                            <Link to="/sujets-sauvegardes" onClick={() => setIsGestionMenuOpen(false)} className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                                <FileText size={16} className="mr-2"/> Sujets Sauvegardés
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <NavLink to="/examens" className={navLinkClass}>Modèles d'Examen</NavLink>
                            <NavLink to="/generate-exam" className={navLinkClass}>Générateur</NavLink>
                        </div>
                    </div>

                    <div className="hidden md:block">
                        <div className="ml-4 flex items-center md:ml-6" ref={profileMenuRef}>
                            <div className="relative">
                                <button onClick={() => setIsProfileMenuOpen(prev => !prev)} className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white p-2">
                                    <User className="h-6 w-6 text-gray-400" />
                                    <span className="ml-2 text-white font-medium">{username}</span>
                                </button>
                                {isProfileMenuOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-gray-800 border border-gray-700 ring-1 ring-black ring-opacity-5 z-20">
                                        <div className="py-1">
                                            <div className="px-4 py-2 border-b border-gray-700">
                                                <p className="text-sm text-white">{username}</p>
                                                <p className="text-xs text-gray-400">{userRole}</p>
                                            </div>
                                            {userRole === 'admin' && (
                                                <Link to="/users" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                                    <Settings size={16} className="mr-2"/> Gestion des Utilisateurs
                                                </Link>
                                            )}
                                            <button onClick={handleLogout} className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                                                <LogOut size={16} className="mr-2"/> Se déconnecter
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="-mr-2 flex md:hidden">
                        <button onClick={() => setIsMobileMenuOpen(prev => !prev)} className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none">
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
                        <NavLink to="/matieres" className={navLinkClass}>Matières</NavLink>
                        <NavLink to="/chapitres" className={navLinkClass}>Chapitres</NavLink>
                        <NavLink to="/questions" className={navLinkClass}>Questions</NavLink>
                        <NavLink to="/promotions" className={navLinkClass}>Promotions</NavLink>
                        <NavLink to="/examens" className={navLinkClass}>Modèles d'Examen</NavLink>
                        <NavLink to="/generate-exam" className={navLinkClass}>Générateur</NavLink>
                        <NavLink to="/sujets-sauvegardes" className={navLinkClass}>Sujets Sauvegardés</NavLink>
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-700">
                        <div className="flex items-center px-5">
                            <User className="h-8 w-8 text-gray-400"/>
                            <div className="ml-3">
                                <div className="text-base font-medium leading-none text-white">{username}</div>
                                <div className="text-sm font-medium leading-none text-gray-400">{userRole}</div>
                            </div>
                        </div>
                        <div className="mt-3 px-2 space-y-1">
                             {userRole === 'admin' && (
                                <Link to="/users" className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700">Utilisateurs</Link>
                            )}
                            <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:text-white hover:bg-gray-700">
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;