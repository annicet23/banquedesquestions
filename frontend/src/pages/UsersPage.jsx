import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UsersPage({ userRole }) {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'saisie' });
  const [editingUser, setEditingUser] = useState(null); // Utilisateur en cours d'édition
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/users', newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Utilisateur créé avec succès !');
      setNewUser({ username: '', password: '', role: 'saisie' });
      fetchUsers(); // Rafraîchir la liste
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création de l\'utilisateur.');
      setMessage('');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage('Utilisateur supprimé avec succès !');
        fetchUsers(); // Rafraîchir la liste
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur.');
        setMessage('');
      }
    }
  };

  const handleEditClick = (user) => {
    setEditingUser({ ...user, password: '' }); // Ne pas pré-remplir le mot de passe
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/users/${editingUser.id}`, editingUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('Utilisateur mis à jour avec succès !');
      setEditingUser(null);
      fetchUsers();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour de l\'utilisateur.');
      setMessage('');
    }
  };

  if (userRole !== 'admin') {
    return <p style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Accès non autorisé à cette page.</p>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2>Gestion des Comptes Utilisateurs</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <h3>Créer un nouvel utilisateur</h3>
      <form onSubmit={handleCreateUser} style={{ marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Nom d'utilisateur :</label>
          <input type="text" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required style={{ width: 'calc(100% - 110px)', padding: '8px', marginRight: '10px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Mot de passe :</label>
          <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required style={{ width: 'calc(100% - 110px)', padding: '8px', marginRight: '10px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Rôle :</label>
          <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={{ width: 'calc(100% - 110px)', padding: '8px', marginRight: '10px' }}>
            <option value="admin">Admin</option>
            <option value="saisie">Saisie</option>
          </select>
        </div>
        <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Créer Utilisateur</button>
      </form>

      {editingUser && (
        <div style={{ marginBottom: '30px', border: '1px solid #007bff', borderRadius: '8px', padding: '20px' }}>
          <h3>Modifier utilisateur : {editingUser.username}</h3>
          <form onSubmit={handleUpdateUser}>
            <div style={{ marginBottom: '10px' }}>
              <label>Nom d'utilisateur :</label>
              <input type="text" value={editingUser.username} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })} required style={{ width: 'calc(100% - 110px)', padding: '8px', marginRight: '10px' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Nouveau mot de passe (laisser vide si inchangé) :</label>
              <input type="password" value={editingUser.password} onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} style={{ width: 'calc(100% - 110px)', padding: '8px', marginRight: '10px' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label>Rôle :</label>
              <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })} style={{ width: 'calc(100% - 110px)', padding: '8px', marginRight: '10px' }}>
                <option value="admin">Admin</option>
                <option value="saisie">Saisie</option>
              </select>
            </div>
            <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#ffc107', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>Mettre à jour</button>
            <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '10px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Annuler</button>
          </form>
        </div>
      )}

      <h3>Liste des Utilisateurs</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Nom d'utilisateur</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Rôle</th>
            <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.id}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.username}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.role}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
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
