const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Route pour lister tous les utilisateurs (Admin seulement)
router.get('/', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    db.query('SELECT id, username, role FROM Users', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur serveur.' });
        }
        res.json(results);
    });
});

// Route pour créer un nouvel utilisateur (Admin seulement)
router.post('/', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Nom d\'utilisateur, mot de passe et rôle sont requis.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hacher le mot de passe

    db.query('INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)',
        [username, hashedPassword, role],
        (err, results) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Ce nom d\'utilisateur existe déjà.' });
                }
                console.error(err);
                return res.status(500).json({ message: 'Erreur serveur lors de la création de l\'utilisateur.' });
            }
            res.status(201).json({ message: 'Utilisateur créé avec succès.', userId: results.insertId });
        }
    );
});

// Route pour modifier un utilisateur (Admin seulement)
router.put('/:id', authenticateToken, authorizeRoles(['admin']), async (req, res) => {
    const userId = req.params.id;
    const { username, password, role } = req.body;
    let updateFields = [];
    let updateValues = [];

    if (username) {
        updateFields.push('username = ?');
        updateValues.push(username);
    }
    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push('password_hash = ?');
        updateValues.push(hashedPassword);
    }
    if (role) {
        updateFields.push('role = ?');
        updateValues.push(role);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'Aucun champ à mettre à jour.' });
    }

    const query = `UPDATE Users SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(userId);

    db.query(query, updateValues, (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Ce nom d\'utilisateur existe déjà.' });
            }
            console.error(err);
            return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'utilisateur.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        res.json({ message: 'Utilisateur mis à jour avec succès.' });
    });
});

// Route pour supprimer un utilisateur (Admin seulement)
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), (req, res) => {
    const userId = req.params.id;

    db.query('DELETE FROM Users WHERE id = ?', [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur.' });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        res.json({ message: 'Utilisateur supprimé avec succès.' });
    });
});

module.exports = router;