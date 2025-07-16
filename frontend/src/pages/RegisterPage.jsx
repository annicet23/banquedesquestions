import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('saisie'); // Default role 'saisie', admin can choose
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login'); // Redirect if no token (should be caught by ProtectedRoute)
                return;
            }
            // Send new user data to the backend's register API
            await axios.post('http://localhost:5000/api/register', {
                username,
                password,
                role
            }, {
                // Although the /api/register route might not be directly protected by JWT middleware in your backend,
                // sending the token is a good practice if this action is initiated by an authenticated admin.
                // The ProtectedRoute for /register ensures a valid token is present before reaching this page.
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setMessage('Utilisateur enregistré avec succès !'); // Success message
            // Clear form fields
            setUsername('');
            setPassword('');
            setRole('saisie'); // Reset role for next registration
            // Redirect to user management page after a short delay
            setTimeout(() => {
                setMessage('');
                navigate('/users');
            }, 2000);
        } catch (err) {
            console.error('Erreur lors de l\'enregistrement:', err);
            if (err.response && err.response.data && err.response.data.message) {
                // Display specific error message from backend (e.g., "Username already taken")
                setError(err.response.data.message);
            } else {
                setError('Erreur lors de l\'enregistrement de l\'utilisateur.'); // Generic error
            }
        }
    };

    return (
        <div className="container mx-auto p-4 flex justify-center items-center h-screen-minus-navbar">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Enregistrer un Nouvel Utilisateur</h2>
                {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">{message}</div>}
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}
                <form onSubmit={handleRegister}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                            Nom d'utilisateur:
                        </label>
                        <input
                            type="text"
                            id="username"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            autoComplete="new-username" // Added for autocomplete
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Mot de passe:
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="new-password" // Added for autocomplete
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                            Rôle:
                        </label>
                        <select
                            id="role"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            required
                        >
                            <option value="saisie">Saisie</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Enregistrer
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/users')} // Cancel button redirects to user management
                            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;