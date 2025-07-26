// --- START OF FILE UsersPage.jsx (COMPLET ET FONCTIONNEL) ---

import React, { useState, useEffect } from 'react';
import apiClient from '../config/api';
import { GRADES_LIST } from '../config/constants'; 

function UsersPage({ userRole }) {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'saisie', nom: '', prenom: '', grade: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/register', newUser);
      setMessage('Utilisateur créé avec succès !');
      setNewUser({ username: '', password: '', role: 'saisie', nom: '', prenom: '', grade: '' });
      fetchUsers();
      setError('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'utilisateur.');
      setMessage('');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await apiClient.delete(`/users/${userId}`);
        setMessage('Utilisateur supprimé avec succès !');
        fetchUsers();
        setError('');
        setTimeout(() => setMessage(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur.');
        setMessage('');
      }
    }
  };

  const handleEditClick = (user) => {
    setEditingUser({ ...user, password: '' });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/users/${editingUser.id}`, editingUser);
      setMessage('Utilisateur mis à jour avec succès !');
      setEditingUser(null);
      fetchUsers();
      setError('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour de l\'utilisateur.');
      setMessage('');
    }
  };

  if (userRole !== 'admin') {
    return <p style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Accès non autorisé à cette page.</p>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2>Gestion des Comptes Utilisateurs</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <h3>Créer un nouvel utilisateur</h3>
      <form onSubmit={handleCreateUser} style={{ marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
            <label>Grade :</label>
            <select value={newUser.grade} onChange={(e) => setNewUser({ ...newUser, grade: e.target.value })} style={{ width: '100%', padding: '8px' }}>
                <option value="">-- Sélectionner un grade --</option>
                {GRADES_LIST.map(g => (<option key={g} value={g}>{g}</option>))}
            </select>
        </div>
        <div style={{ marginBottom: '10px' }}><label>Nom :</label><input type="text" value={newUser.nom} onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })} style={{ width: '100%', padding: '8px' }} /></div>
        <div style={{ marginBottom: '10px' }}><label>Prénom :</label><input type="text" value={newUser.prenom} onChange={(e) => setNewUser({ ...newUser, prenom: e.target.value })} style={{ width: '100%', padding: '8px' }} /></div>
        <div style={{ marginBottom: '10px' }}><label>Nom d'utilisateur :</label><input type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required style={{ width: '100%', padding: '8px' }} /></div>
        <div style={{ marginBottom: '10px' }}><label>Mot de passe :</label><input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required style={{ width: '100%', padding: '8px' }} /></div>
        <div style={{ marginBottom: '10px' }}><label>Rôle :</label><select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={{ width: '100%', padding: '8px' }}><option value="saisie">Saisie</option><option value="admin">Admin</option></select></div>
        <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Créer Utilisateur</button>
      </form>

      {editingUser && (
        <div style={{ marginBottom: '30px', border: '1px solid #007bff', borderRadius: '8px', padding: '20px' }}>
          <h3>Modifier utilisateur : {editingUser.username}</h3>
          <form onSubmit={handleUpdateUser}>
            <div style={{ marginBottom: '10px' }}>
                <label>Grade :</label>
                <select value={editingUser.grade || ''} onChange={(e) => setEditingUser({ ...editingUser, grade: e.target.value })} style={{ width: '100%', padding: '8px' }}>
                    <option value="">-- Sélectionner un grade --</option>
                    {GRADES_LIST.map(g => (<option key={g} value={g}>{g}</option>))}
                </select>
            </div>
            <div style={{ marginBottom: '10px' }}><label>Nom :</label><input type="text" value={editingUser.nom || ''} onChange={(e) => setEditingUser({ ...editingUser, nom: e.target.value })} style={{ width: '100%', padding: '8px' }} /></div>
            <div style={{ marginBottom: '10px' }}><label>Prénom :</label><input type="text" value={editingUser.prenom || ''} onChange={(e) => setEditingUser({ ...editingUser, prenom: e.target.value })} style={{ width: '100%', padding: '8px' }} /></div>
            <div style={{ marginBottom: '10px' }}><label>Nom d'utilisateur :</label><input type="text" value={editingUser.username} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })} required style={{ width: '100%', padding: '8px' }} /></div>
            <div style={{ marginBottom: '10px' }}><label>Nouveau mot de passe (laisser vide si inchangé) :</label><input type="password" value={editingUser.password} onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} style={{ width: '100%', padding: '8px' }} /></div>
            <div style={{ marginBottom: '10px' }}><label>Rôle :</label><select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })} style={{ width: '100%', padding: '8px' }}><option value="saisie">Saisie</option><option value="admin">Admin</option></select></div>
            <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>Mettre à jour</button>
            <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Annuler</button>
          </form>
        </div>
      )}

      <h3>Liste des Utilisateurs</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Nom d'utilisateur</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Grade</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Nom</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Prénom</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Rôle</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.username}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.grade || '-'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.nom || '-'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.prenom || '-'}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.role}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px', whiteSpace: 'nowrap' }}>
                <button onClick={() => handleEditClick(user)} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', marginRight: '5px' }}>Modifier</button>
                <button onClick={() => handleDeleteUser(user.id)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Supprimer</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsersPage;
