// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const db = require('./config/db');

const multer = require('multer'); // Pour gérer les uploads de fichiers
const path = require('path');     // Pour manipuler les chemins de fichiers
const fs = require('fs');         // Pour interagir avec le système de fichiers (supprimer)
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretjwtkey';

// Middleware
app.use(cors());
app.use(express.json());
// NOUVEAU : Rendre le dossier 'uploads' accessible publiquement
// Cela permet au navigateur d'afficher les images via une URL comme http://.../uploads/image.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// NOUVEAU : Configuration de Multer pour le stockage des fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Le dossier où les images seront sauvegardées
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Crée un nom de fichier unique pour éviter que deux fichiers aient le même nom
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// ... (toute la partie connexion et authentification reste identique) ...
db.getConnection((err, connection) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err.message);
        return;
    }
    console.log('Connecté à la base de données MySQL avec l\'ID de connexion', connection.threadId);
    connection.release();
});
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET_KEY, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Accès non autorisé pour ce rôle.' });
        }
        next();
    };
};

// ===============================================
// === FONCTION UTILITAIRE CORRIGÉE ===
// Elle prend un objet JS (pas une chaîne) et le normalise

// ... (Routes users, matières, chapitres etc. restent identiques) ...

// =========================================================
// === FONCTION UTILITAIRE ET ROUTE GET (MODIFIÉES) ===
// =========================================================

const normalizeReponses = (question) => {
    // 1. Normaliser 'reponses'
    let rawReponses = question.reponses;
    if (typeof rawReponses === 'string') {
        try { rawReponses = JSON.parse(rawReponses); } catch (e) { rawReponses = []; }
    }
    let normalizedReponses = [];
    if (Array.isArray(rawReponses) && rawReponses.length > 0) {
        if (typeof rawReponses[0] === 'string') {
            normalizedReponses = rawReponses.map(text => ({ texte: String(text).trim(), est_correcte: true }));
        } else {
            normalizedReponses = rawReponses;
        }
    }

    // 2. Normaliser 'reponses_meta'
    let rawMeta = question.reponses_meta;
    let normalizedMeta = null;
    if (typeof rawMeta === 'string') {
        try { normalizedMeta = JSON.parse(rawMeta); } catch (e) { normalizedMeta = null; }
    } else if (typeof rawMeta === 'object') {
        normalizedMeta = rawMeta;
    }

    return { ...question, reponses: normalizedReponses, reponses_meta: normalizedMeta };
};

app.get('/api/questions', authenticateJWT, async (req, res) => {
    const { matiereId, chapitreId } = req.query;

    // MODIFIÉ : On sélectionne explicitement les colonnes, y compris reponses_meta
    let sql = `
        SELECT q.id, q.id_matiere, q.id_chapitre, q.enonce, q.type_question, q.reponses, q.points, q.created_at, q.reponses_meta,q.image_enonce_url,
               m.nom_matiere, c.nom_chapitre
        FROM questions q
        JOIN matières m ON q.id_matiere = m.id
        LEFT JOIN chapitres c ON q.id_chapitre = c.id
    `;
    const params = [];
    sql += ' WHERE 1=1';

    if (matiereId) {
        sql += ' AND q.id_matiere = ?';
        params.push(matiereId);
    }
    if (chapitreId) {
        sql += ' AND q.id_chapitre = ?';
        params.push(chapitreId);
    }
    sql += ' ORDER BY q.created_at DESC';
    try {
        const [results] = await db.promise().query(sql, params);
        // La fonction normalizeReponses gère maintenant aussi reponses_meta
        const parsedResults = results.map(normalizeReponses);
        res.status(200).json(parsedResults);
    } catch (err) {
        console.error("Erreur SQL lors de la récupération des questions:", err);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des questions.' });
    }
});

// ===== BLOC DE GESTION UTILISATEURS (À REMPLACER DANS server.js) =====

// Route pour l'enregistrement public (si vous avez une page d'inscription séparée)
// ou pour la création par un admin.
app.post('/api/register', (req, res) => {
    // MODIFIÉ : Ajout de nom, prenom, grade
    const { username, password, role, nom, prenom, grade } = req.body;
    if (!username || !password || !role) return res.status(400).json({ message: 'Nom d\'utilisateur, mot de passe et rôle sont requis.' });
    
    const allowedRoles = ['admin', 'saisie'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: `Le rôle '${role}' n'est pas valide.` });
    }
    
    // MODIFIÉ : Ajout des nouveaux champs dans la requête SQL
    const sql = 'INSERT INTO users (username, password, role, nom, prenom, grade) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [username, password, role, nom, prenom, grade], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Nom d\'utilisateur déjà pris.' });
            return res.status(500).json({ message: 'Erreur serveur.' });
        }
        res.status(201).json({ message: 'Utilisateur enregistré.' });
    });
});


// DANS backend/server.js
// TROUVEZ CETTE ROUTE ET REMPLACEZ-LA ENTIÈREMENT

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Champs requis.' });

    // La requête SQL est déjà correcte et sélectionne le grade
    const sql = 'SELECT id, username, password, role, nom, prenom, grade FROM users WHERE username = ?';
    db.query(sql, [username], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur.' });
        if (results.length === 0) return res.status(401).json({ message: 'Identifiants incorrects.' });

        const user = results[0];
        if (password === user.password) {
            // CORRECTION CRITIQUE : Ajouter `grade: user.grade` ici
            const tokenPayload = {
                id: user.id,
                username: user.username,
                role: user.role,
                nom: user.nom,
                prenom: user.prenom,
                grade: user.grade // <--- CETTE LIGNE EST ESSENTIELLE ET MANQUAIT
            };
            const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: '8h' });

            // On renvoie juste le token. Le frontend le décodera.
            return res.status(200).json({
                token,
                // Il n'est pas nécessaire de renvoyer les autres infos ici car elles sont dans le token
            });
        } else {
            return res.status(401).json({ message: 'Identifiants incorrects.' });
        }
    });
});

// GET tous les utilisateurs (pour l'admin)
app.get('/api/users', authenticateJWT, authorizeRole(['admin']), (req, res) => {
    // MODIFIÉ : Sélectionner les nouvelles colonnes
    const sql = 'SELECT id, username, role, created_at, nom, prenom, grade FROM users ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur.' });
        res.status(200).json(results);
    });
});

// NOUVELLE ROUTE : Mettre à jour un utilisateur (pour l'admin)
app.put('/api/users/:id', authenticateJWT, authorizeRole(['admin']), (req, res) => {
    const userId = req.params.id;
    const { username, role, nom, prenom, grade, password } = req.body;

    if (!username || !role) {
        return res.status(400).json({ message: 'Le nom d\'utilisateur et le rôle sont requis.' });
    }

    let sql = 'UPDATE users SET username = ?, role = ?, nom = ?, prenom = ?, grade = ?';
    const params = [username, role, nom, prenom, grade];

    // On met à jour le mot de passe seulement s'il est fourni
    if (password && password.trim() !== '') {
        sql += ', password = ?';
        params.push(password);
    }

    sql += ' WHERE id = ?';
    params.push(userId);
    
    db.query(sql, params, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ce nom d\'utilisateur est déjà pris.' });
            return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        res.status(200).json({ message: 'Utilisateur mis à jour avec succès.' });
    });
});


app.delete('/api/users/:id', authenticateJWT, authorizeRole(['admin']), (req, res) => {
    // Interdiction de se supprimer soi-même
    if (req.params.id == req.user.id) {
        return res.status(403).json({ message: 'Vous ne pouvez pas supprimer votre propre compte.' });
    }
    db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur.' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        res.status(200).json({ message: 'Utilisateur supprimé.' });
    });
});

// ===== FIN DU BLOC DE GESTION UTILISATEURS =====
// ==============================================
// === ROUTE DE CRÉATION DE QUESTION (MODIFIÉE) ===
// ==============================================
// ==============================================
// === ROUTE DE CRÉATION DE QUESTION (AVEC IMAGES) ===
// ==============================================
app.post('/api/questions', authenticateJWT, authorizeRole(['admin', 'saisie']), upload.any(), async (req, res) => {
    // Les champs texte sont dans req.body, les fichiers dans req.files
    const { id_matiere, id_chapitre, enonce, type_question, points, reponses, reponses_meta } = req.body;

    if (!id_matiere || !enonce || !type_question || !points) {
        return res.status(400).json({ message: 'Matière, énoncé, type et points sont requis.' });
    }

    try {
        // Les données complexes (JSON) arrivent en texte, il faut les parser
        let parsedReponses = JSON.parse(reponses || '[]');
        let parsedMeta = JSON.parse(reponses_meta || 'null');
        let enonceImageUrl = null;

        // Associer les fichiers uploadés à l'énoncé
        const enonceImageFile = req.files.find(f => f.fieldname === 'enonce_image');
        if (enonceImageFile) {
            enonceImageUrl = `/uploads/${enonceImageFile.filename}`;
        }

        // Associer les fichiers uploadés aux réponses
        const finalReponses = parsedReponses.map((rep, index) => {
            const reponseImageFile = req.files.find(f => f.fieldname === `reponse_image_${index}`);
            return {
                texte: rep.texte,
                est_correcte: rep.est_correcte,
                image_url: reponseImageFile ? `/uploads/${reponseImageFile.filename}` : null
            };
        });

        if (type_question === 'QCM' && finalReponses.length === 0) {
            return res.status(400).json({ message: 'Au moins une réponse est requise pour un QCM.' });
        }

        const sql = `
            INSERT INTO questions (id_matiere, id_chapitre, enonce, type_question, reponses, points, reponses_meta, image_enonce_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            id_matiere,
            (id_chapitre && id_chapitre !== '') ? id_chapitre : null,
            enonce,
            type_question,
            JSON.stringify(finalReponses),
            points,
            JSON.stringify(parsedMeta),
            enonceImageUrl
        ];

        const [result] = await db.promise().execute(sql, params);
        res.status(201).json({ id: result.insertId, message: 'Question ajoutée avec succès.' });

    } catch (err) {
        console.error("Erreur SQL lors de l'ajout de la question:", err);
        // En cas d'erreur de la base de données, on supprime les fichiers qui ont été uploadés pour rien
        if (req.files) {
            req.files.forEach(file => {
                fs.unlink(file.path, (e) => {
                    if (e) console.error("Erreur nettoyage fichier uploadé:", e.message);
                });
            });
        }
        res.status(500).json({ message: 'Erreur serveur lors de la création de la question.' });
    }
});
// ==============================================
// === ROUTE DE MISE À JOUR DE QUESTION (MODIFIÉE) ===
// ==============================================
// ==============================================
// === ROUTE DE MISE À JOUR (AVEC IMAGES) ===
// ==============================================
app.put('/api/questions/:id', authenticateJWT, authorizeRole(['admin', 'saisie']), upload.any(), async (req, res) => {
    const questionId = req.params.id;
    // On récupère les images à supprimer du frontend
    const { enonce, points, reponses, id_chapitre, type_question, id_matiere, reponses_meta, removed_images } = req.body;

    if (!enonce || !points || !type_question || !id_matiere) {
        return res.status(400).json({ message: 'Matière, énoncé, points et type sont requis.' });
    }

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        // 1. Récupérer l'état actuel de la question pour connaître les anciens chemins d'images
        const [currentQuestionRows] = await connection.execute('SELECT reponses, image_enonce_url FROM questions WHERE id = ?', [questionId]);
        if (currentQuestionRows.length === 0) {
            await connection.rollback();
            // Nettoyer les fichiers uploadés si la question n'existe pas
            req.files.forEach(f => fs.unlink(f.path, () => {}));
            return res.status(404).json({ message: 'Question non trouvée.' });
        }
        const currentQuestion = normalizeReponses(currentQuestionRows[0]);

        let parsedReponses = JSON.parse(reponses || '[]');
        let parsedMeta = JSON.parse(reponses_meta || 'null');
        let parsedRemovedImages = JSON.parse(removed_images || '[]');
        let newEnonceImageUrl = currentQuestion.image_enonce_url;

        const deleteFile = (url) => {
            if (url) {
                fs.unlink(path.join(__dirname, url), (err) => {
                    if (err) console.error(`Erreur suppression fichier ${url}:`, err.message);
                });
            }
        };

        // 2. Gérer l'image de l'énoncé
        const enonceImageFile = req.files.find(f => f.fieldname === 'enonce_image');
        if (enonceImageFile) { // Nouvelle image uploadée ?
            deleteFile(currentQuestion.image_enonce_url); // Supprimer l'ancienne
            newEnonceImageUrl = `/uploads/${enonceImageFile.filename}`;
        } else if (parsedRemovedImages.includes('enonce_image')) { // Image supprimée par l'utilisateur ?
            deleteFile(currentQuestion.image_enonce_url);
            newEnonceImageUrl = null;
        }

        // 3. Gérer les images des réponses
        const finalReponses = parsedReponses.map((rep, index) => {
            const reponseImageFile = req.files.find(f => f.fieldname === `reponse_image_${index}`);
            let newReponseImageUrl = rep.image_url || null;

            if (reponseImageFile) { // Nouvelle image pour cette réponse ?
                deleteFile(rep.image_url);
                newReponseImageUrl = `/uploads/${reponseImageFile.filename}`;
            } else if (parsedRemovedImages.includes(`reponse_image_${index}`)) { // Image de réponse supprimée ?
                deleteFile(rep.image_url);
                newReponseImageUrl = null;
            }
            return { texte: rep.texte, est_correcte: rep.est_correcte, image_url: newReponseImageUrl };
        });

        // 4. Mettre à jour la base de données
        const sql = `
            UPDATE questions
            SET enonce = ?, points = ?, reponses = ?, id_chapitre = ?, type_question = ?, id_matiere = ?, reponses_meta = ?, image_enonce_url = ?
            WHERE id = ?
        `;
        const params = [enonce, points, JSON.stringify(finalReponses), id_chapitre || null, type_question, id_matiere, JSON.stringify(parsedMeta), newEnonceImageUrl, questionId];
        await connection.execute(sql, params);

        await connection.commit();
        res.status(200).json({ message: 'Question modifiée avec succès.' });

    } catch (err) {
        await connection.rollback();
        console.error("Erreur lors de la modification de la question:", err);
        // Nettoyer les fichiers uploadés en cas d'erreur
        if (req.files) {
            req.files.forEach(file => fs.unlink(file.path, () => {}));
        }
        res.status(500).json({ message: 'Erreur serveur.' });
    } finally {
        if(connection) connection.release();
    }
});

// ==============================================
// === ROUTE DE SUPPRESSION (AVEC IMAGES) ===
// ==============================================
app.delete('/api/questions/:id', authenticateJWT, authorizeRole(['admin', 'saisie']), async (req, res) => {
    const questionId = req.params.id;
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        // 1. Récupérer les chemins des images AVANT de supprimer la ligne
        const [rows] = await connection.execute('SELECT reponses, image_enonce_url FROM questions WHERE id = ?', [questionId]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Question non trouvée.' });
        }
        const question = normalizeReponses(rows[0]);

        // 2. Supprimer la question de la base de données
        const [result] = await connection.execute('DELETE FROM questions WHERE id = ?', [questionId]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Question non trouvée.' });
        }

        // 3. Supprimer les fichiers du disque
        const deleteFile = (url) => {
            if (url) {
                fs.unlink(path.join(__dirname, url), (err) => {
                    if (err) console.error(`Erreur suppression fichier ${url}:`, err.message);
                });
            }
        };

        deleteFile(question.image_enonce_url);
        if (question.reponses && Array.isArray(question.reponses)) {
            question.reponses.forEach(rep => deleteFile(rep.image_url));
        }

        await connection.commit();
        res.status(200).json({ message: 'Question supprimée avec succès.' });

    } catch (err) {
        await connection.rollback();
        console.error("Erreur lors de la suppression de la question:", err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ message: 'Impossible de supprimer cette question, car elle est déjà liée à un ou plusieurs examens.' });
        }
        res.status(500).json({ message: 'Erreur serveur.' });
    } finally {
         if(connection) connection.release();
    }
});

app.get('/api/examens/:examenId/questions', authenticateJWT, async (req, res) => {
    try {
        const [rows] = await db.promise().execute(
            `SELECT q.* FROM questions q JOIN examen_questions eq ON q.id = eq.id_question WHERE eq.id_examen = ?`,
            [req.params.examenId]
        );
        const parsedQuestions = rows.map(normalizeReponses);
        res.status(200).json(parsedQuestions);
    } catch (err) {
        console.error("Erreur lors de la récupération des questions de l'examen:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});
app.post('/api/examens/:examenId/questions', authenticateJWT, authorizeRole(['admin', 'saisie']), async (req, res) => {
    const { questionIds } = req.body;
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({ message: "Liste d'IDs de questions requise." });
    }
    try {
        const values = questionIds.map(qId => [req.params.examenId, qId]);
        await db.promise().query('INSERT IGNORE INTO examen_questions (id_examen, id_question) VALUES ?', [values]);
        res.status(201).json({ message: `questions ajoutées.` });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur." });
    }
});
app.delete('/api/examens/:examenId/questions/:questionId', authenticateJWT, authorizeRole(['admin', 'saisie']), async (req, res) => {
    try {
        const [result] = await db.promise().execute(
            'DELETE FROM examen_questions WHERE id_examen = ? AND id_question = ?',
            [req.params.examenId, req.params.questionId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: "Liaison non trouvée." });
        res.status(200).json({ message: "Question retirée de l'examen." });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur." });
    }
});
app.post('/api/matieres', authenticateJWT, authorizeRole(['admin', 'saisie']), (req, res) => {
    const { nom_matiere, description, abreviation } = req.body;
    if (!nom_matiere) {
        return res.status(400).json({ message: 'Le nom de la matière est requis.' });
    }
    const sql = 'INSERT INTO matières (nom_matiere, description, abreviation) VALUES (?, ?, ?)';
    db.query(sql, [nom_matiere, description, abreviation], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Une matière avec ce nom ou cette abréviation existe déjà.' });
            return res.status(500).json({ message: 'Erreur serveur.' });
        }
        res.status(201).json({ id: result.insertId, message: 'Matière ajoutée avec succès.' });
    });
});
app.get('/api/matieres', authenticateJWT, (req, res) => {
    const sql = `
        SELECT m.id, m.nom_matiere, m.abreviation, m.description, COUNT(c.id) AS nombre_chapitres
        FROM matières m
        LEFT JOIN chapitres c ON m.id = c.id_matiere
        GROUP BY m.id, m.nom_matiere, m.abreviation, m.description
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur.' });
        res.status(200).json(results);
    });
});
app.put('/api/matieres/:id', authenticateJWT, authorizeRole(['admin', 'saisie']), (req, res) => {
    const matiereId = req.params.id;
    const { nom_matiere, description, abreviation } = req.body;
    if (!nom_matiere) {
        return res.status(400).json({ message: 'Le nom de la matière est requis.' });
    }
    const sql = 'UPDATE matières SET nom_matiere = ?, description = ?, abreviation = ? WHERE id = ?';
    db.query(sql, [nom_matiere, description, abreviation, matiereId], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Une matière avec ce nom ou cette abréviation existe déjà.' });
            return res.status(500).json({ message: 'Erreur serveur.' });
        }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Matière non trouvée.' });
        res.status(200).json({ message: 'Matière modifiée avec succès.' });
    });
});
app.delete('/api/matieres/:id', authenticateJWT, authorizeRole(['admin']), (req, res) => {
    db.query('DELETE FROM matières WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur.' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Matière non trouvée.' });
        res.status(200).json({ message: 'Matière supprimée.' });
    });
});

// server.js

// ... (code précédent)

// ===============================================
// === ROUTE MODIFIÉE : CRÉATION MASSE ET INDIVIDUELLE ===
// ===============================================
// =============================================================
// === ROUTE CORRIGÉE : CRÉATION MASSE ET INDIVIDUELLE ROBUSTE ===
// =============================================================
app.post('/api/chapitres', authenticateJWT, authorizeRole(['admin', 'saisie']), async (req, res) => {
    // On destructure tous les champs possibles du body
    const { id_matiere, nombre_a_creer, nom_chapitre, description } = req.body;

    // --- SCÉNARIO 1 : CRÉATION EN MASSE ---
    // On vérifie la présence de `nombre_a_creer`. On s'assure qu'il est bien un nombre > 0.
    if (nombre_a_creer && parseInt(nombre_a_creer, 10) > 0) {
        // Validation spécifique à la création en masse
        if (!id_matiere) {
            return res.status(400).json({ message: 'L\'ID de la matière est requis pour la création en masse.' });
        }

        const count = parseInt(nombre_a_creer, 10);
        const connection = await db.promise().getConnection();
        try {
            const [matiereRows] = await connection.execute('SELECT abreviation FROM matières WHERE id = ?', [id_matiere]);
            if (matiereRows.length === 0) {
                return res.status(404).json({ message: 'Matière non trouvée.' });
            }

            const abreviation = matiereRows[0].abreviation;
            if (!abreviation) {
                return res.status(400).json({ message: 'La matière sélectionnée n\'a pas d\'abréviation, impossible de créer en masse.' });
            }

            const values = [];
            for (let i = 1; i <= count; i++) {
                const generated_name = `${abreviation} ${i}`;
                values.push([id_matiere, generated_name]);
            }

            const sql = 'INSERT IGNORE INTO chapitres (id_matiere, nom_chapitre) VALUES ?';
            const [result] = await connection.query(sql, [values]);

            return res.status(201).json({
                message: `${result.affectedRows} chapitre(s) créé(s). ${values.length - result.affectedRows} existai(en)t déjà.`
            });
        } catch (err) {
            console.error("Erreur lors de la création en masse des chapitres:", err);
            return res.status(500).json({ message: 'Erreur serveur.' });
        } finally {
            if(connection) connection.release();
        }
    }

    // --- SCÉNARIO 2 : CRÉATION INDIVIDUELLE ---
    // On vérifie la présence de `nom_chapitre`. Un nom vide ('') n'est pas accepté.
    else if (nom_chapitre) {
        // Validation spécifique à la création individuelle
        if (!id_matiere) {
            return res.status(400).json({ message: 'La matière est requise pour créer un chapitre.' });
        }

        try {
            const sql = 'INSERT INTO chapitres (id_matiere, nom_chapitre, description) VALUES (?, ?, ?)';
            const [result] = await db.promise().execute(sql, [id_matiere, nom_chapitre, description || null]);

            return res.status(201).json({
                id: result.insertId,
                message: 'Chapitre créé avec succès.'
            });
        } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Ce nom de chapitre existe déjà pour cette matière.' });
            }
            console.error("Erreur lors de la création individuelle de chapitre:", err);
            return res.status(500).json({ message: 'Erreur serveur.' });
        }
    }

    // --- SCÉNARIO 3 : ERREUR, AUCUN CAS VALIDE ---
    // Si on arrive ici, c'est que ni 'nombre_a_creer' ni 'nom_chapitre' n'ont été fournis correctement.
    else {
        return res.status(400).json({ message: 'Paramètres de requête non valides. Fournissez soit "nombre_a_creer" (nombre > 0), soit "nom_chapitre" (non vide).' });
    }
});

// ... (le reste de votre fichier server.js)
// +++++ COLLEZ CE NOUVEAU BLOC À LA PLACE +++++
app.get('/api/chapitres', authenticateJWT, async (req, res) => {
    // 1. On récupère le paramètre 'matiereId' de l'URL (ex: /api/chapitres?matiereId=3)
    const { matiereId } = req.query;

    // 2. On construit la requête de base
    let sql = 'SELECT c.id, c.nom_chapitre, c.description, m.nom_matiere, m.id as id_matiere FROM chapitres c JOIN matières m ON c.id_matiere = m.id';
    const params = [];

    // 3. SI un matiereId est fourni, on ajoute la condition de filtrage
    if (matiereId) {
        sql += ' WHERE c.id_matiere = ?';
        params.push(matiereId);
    }

    // On ajoute un tri pour la cohérence
    sql += ' ORDER BY c.nom_chapitre ASC';

    // 4. On exécute la requête (qui est maintenant dynamique)
    try {
        const [results] = await db.promise().query(sql, params);
        res.status(200).json(results);
    } catch (err) {
        console.error("Erreur lors de la récupération des chapitres:", err);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

app.get('/api/matieres/:id/chapitres', authenticateJWT, (req, res) => {
    db.query('SELECT id, nom_chapitre, description FROM chapitres WHERE id_matiere = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur.' });
        res.status(200).json(results);
    });
});
app.put('/api/chapitres/:id', authenticateJWT, authorizeRole(['admin', 'saisie']), (req, res) => {
    const { id_matiere, nom_chapitre, description } = req.body;
    if (!id_matiere || !nom_chapitre) return res.status(400).json({ message: 'ID matière et nom requis.' });
    const sql = 'UPDATE chapitres SET id_matiere = ?, nom_chapitre = ?, description = ? WHERE id = ?';
    db.query(sql, [id_matiere, nom_chapitre, description, req.params.id], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ce chapitre existe déjà pour cette matière.' });
            return res.status(500).json({ message: 'Erreur serveur.' });
        }
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Chapitre non trouvé.' });
        res.status(200).json({ message: 'Chapitre modifié.' });
    });
});
app.delete('/api/chapitres/:id', authenticateJWT, authorizeRole(['admin']), (req, res) => {
    db.query('DELETE FROM chapitres WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Erreur serveur.' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Chapitre non trouvé.' });
        res.status(200).json({ message: 'Chapitre supprimé.' });
    });
});
app.get('/api/promotions', authenticateJWT, async (req, res) => {
    try {
        const [promotions] = await db.promise().execute('SELECT * FROM promotions ORDER BY annee_debut DESC');
        res.status(200).json(promotions);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});
app.post('/api/promotions', authenticateJWT, authorizeRole(['admin', 'saisie']), async (req, res) => {
    const { nom_promotion, annee_debut, description } = req.body;
    if (!nom_promotion || !annee_debut) {
        return res.status(400).json({ message: 'Le nom et l\'année de début sont requis.' });
    }
    try {
        const sql = 'INSERT INTO promotions (nom_promotion, annee_debut, description) VALUES (?, ?, ?)';
        const [result] = await db.promise().execute(sql, [nom_promotion, annee_debut, description]);
        res.status(201).json({ id: result.insertId, message: 'Promotion créée.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Cette promotion existe déjà.' });
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});
app.put('/api/promotions/:id', authenticateJWT, authorizeRole(['admin', 'saisie']), async (req, res) => {
    const { nom_promotion, annee_debut, description } = req.body;
    if (!nom_promotion || !annee_debut) {
        return res.status(400).json({ message: 'Le nom et l\'année sont requis.' });
    }
    try {
        const sql = 'UPDATE promotions SET nom_promotion = ?, annee_debut = ?, description = ? WHERE id = ?';
        const [result] = await db.promise().execute(sql, [nom_promotion, annee_debut, description, req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Promotion non trouvée.' });
        }
        res.status(200).json({ message: 'Promotion modifiée avec succès.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Ce nom de promotion existe déjà.' });
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});
app.delete('/api/promotions/:id', authenticateJWT, authorizeRole(['admin']), async (req, res) => {
    try {
        const [result] = await db.promise().execute('DELETE FROM promotions WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Promotion non trouvée.' });
        }
        res.status(200).json({ message: 'Promotion supprimée avec succès.' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});
app.post('/api/examens', authenticateJWT, authorizeRole(['admin', 'saisie']), async (req, res) => {
    const { titre, description, type_examen, id_promotion, matieres } = req.body;
    if (!titre || !type_examen || !id_promotion || !Array.isArray(matieres) || matieres.length === 0) {
        return res.status(400).json({ message: 'Titre, type, promotion et au moins une matière sont requis.' });
    }
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();
        const sqlExamen = 'INSERT INTO examens (titre, description, type_examen, id_promotion) VALUES (?, ?, ?, ?)';
        const [examenResult] = await connection.execute(sqlExamen, [titre, description, type_examen, id_promotion]);
        const newExamenId = examenResult.insertId;
        const sqlMatiereLink = 'INSERT INTO examen_matieres (id_examen, id_matiere, coefficient) VALUES ?';
        const matiereValues = matieres.map(m => [newExamenId, m.id_matiere, m.coefficient]);
        if (matiereValues.length > 0) {
            await connection.query(sqlMatiereLink, [matiereValues]);
        }
        await connection.commit();
        res.status(201).json({ id: newExamenId, message: 'Examen créé avec succès.' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: 'Erreur serveur.' });
    } finally {
        connection.release();
    }
});

// ROUTE MISE À JOUR : Ne retourne que les examens PARENTS (modèles)
app.get('/api/examens', authenticateJWT, async (req, res) => {
    const { promotionId } = req.query;
    let sql = `
        SELECT
            e.id,
            e.titre,
            e.description,
            e.created_at,
            e.type_examen,
            p.nom_promotion,
            e.id_promotion  -- *** AJOUT/VÉRIFICATION : Assurez-vous que cette ligne est présente ***
        FROM examens e
        LEFT JOIN promotions p ON e.id_promotion = p.id
        WHERE e.id_parent_examen IS NULL
    `;
    const params = [];

    // La logique de filtrage est déjà correcte
    if (promotionId && promotionId !== 'all' && promotionId !== '') {
        sql += ' AND e.id_promotion = ?';
        params.push(promotionId);
    }

    sql += ' ORDER BY e.created_at DESC';

    try {
        const [results] = await db.promise().query(sql, params);
        res.status(200).json(results);
    } catch (err) {
        console.error('Erreur lors de la récupération des modèles d\'examens:', err);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des modèles d\'examens.' });
    }
});

app.get('/api/examens/:id', authenticateJWT, async (req, res) => {
    try {
        const [examenRes] = await db.promise().execute('SELECT * FROM examens WHERE id = ?', [req.params.id]);
        if (examenRes.length === 0) return res.status(404).json({ message: 'Examen non trouvé.' });
        const [matieresRes] = await db.promise().execute(
            `SELECT m.id as id_matiere, m.nom_matiere, em.coefficient FROM examen_matieres em JOIN matières m ON em.id_matiere = m.id WHERE em.id_examen = ?`,
            [req.params.id]
        );
        res.status(200).json({ ...examenRes[0], matieres: matieresRes });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});
app.put('/api/examens/:id', authenticateJWT, authorizeRole(['admin', 'saisie']), async (req, res) => {
    const examenId = req.params.id;
    const { titre, description, type_examen, id_promotion, matieres } = req.body;
    if (!titre || !type_examen || !id_promotion || !Array.isArray(matieres) || matieres.length === 0) {
        return res.status(400).json({ message: 'Champs requis manquants.' });
    }
    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();
        await connection.execute('UPDATE examens SET titre = ?, description = ?, type_examen = ?, id_promotion = ? WHERE id = ?', [titre, description, type_examen, id_promotion, examenId]);
        await connection.execute('DELETE FROM examen_matieres WHERE id_examen = ?', [examenId]);
        const sqlMatiereLink = 'INSERT INTO examen_matieres (id_examen, id_matiere, coefficient) VALUES ?';
        const matiereValues = matieres.map(m => [examenId, m.id_matiere, m.coefficient]);
        if(matiereValues.length > 0) {
            await connection.query(sqlMatiereLink, [matiereValues]);
        }
        await connection.commit();
        res.status(200).json({ message: 'Examen modifié.' });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: 'Erreur serveur.' });
    } finally {
        connection.release();
    }
});
// NOUVELLE ROUTE POUR LA PAGE "SUJETS SAUVEGARDÉS"
app.get('/api/sujets-sauvegardes', authenticateJWT, async (req, res) => {
    const { promotionId, parentExamId, typeExamen } = req.query;

    let sql = `
        SELECT
            s.id,
            s.titre,
            s.created_at,
            parent.type_examen,
            p.nom_promotion,
            parent.titre as titre_parent
        FROM examens s
        JOIN promotions p ON s.id_promotion = p.id
        LEFT JOIN examens parent ON s.id_parent_examen = parent.id
        WHERE s.id_parent_examen IS NOT NULL
    `;
    const params = [];

    if (promotionId && promotionId !== 'all' && promotionId !== '') {
        sql += ' AND s.id_promotion = ?';
        params.push(promotionId);
    }
    if (parentExamId && parentExamId !== 'all' && parentExamId !== '') {
        sql += ' AND s.id_parent_examen = ?';
        params.push(parentExamId);
    }
    if (typeExamen && typeExamen !== 'all' && typeExamen !== '') {
        sql += ' AND parent.type_examen = ?';
        params.push(typeExamen);
    }

    sql += ' ORDER BY s.created_at DESC';

    try {
        const [sujets] = await db.promise().query(sql, params);
        res.status(200).json(sujets);
    } catch (err) {
        console.error("Erreur lors de la récupération des sujets sauvegardés:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// TROUVEZ CETTE FONCTION DANS VOTRE server.js
function trouverCombinaison(questionsDisponibles, pointsRestants, questionsUtilisees = new Set()) {
    // ANCIENNE LIGNE (INCORRECTE POUR LES DÉCIMAUX)
    // if (pointsRestants === 0) return [];

    // NOUVELLE LIGNE (CORRIGÉE)
    // On considère que la combinaison est bonne si le reste est très proche de 0.
    if (Math.abs(pointsRestants) < 0.001) return [];

    if (pointsRestants < 0 || questionsDisponibles.length === 0) return null;
    const questionsMelangees = [...questionsDisponibles].sort(() => 0.5 - Math.random());
    for (let i = 0; i < questionsMelangees.length; i++) {
        const questionActuelle = questionsMelangees[i];
        if (questionsUtilisees.has(questionActuelle.id)) continue;
        const nouvellesQuestionsDisponibles = questionsMelangees.slice(i + 1);
        const nouvellesQuestionsUtilisees = new Set(questionsUtilisees).add(questionActuelle.id);

        // Le reste de la fonction ne change pas
        const resultatRecursif = trouverCombinaison(nouvellesQuestionsDisponibles, pointsRestants - questionActuelle.points, nouvellesQuestionsUtilisees);
        if (resultatRecursif !== null) {
            return [questionActuelle, ...resultatRecursif];
        }
    }
    return null;
}
// =======================================================================
// === ROUTE MODIFIÉE POUR LA GÉNÉRATION DE SUJETS PAR MATIÈRE ===
// =======================================================================
app.post('/api/generate-exam-versions', authenticateJWT, authorizeRole(['admin', 'saisie']), async (req, res) => {
    // 1. Récupérer la nouvelle structure de données du frontend
    // On reçoit 'pointsPerMatiere' au lieu de 'totalPoints'
    const { matiereIds, chapitreIds, pointsPerMatiere, numVersions } = req.body;
    const requestedVersions = Number(numVersions) || 1;

    // 2. Validation des nouvelles entrées
    if (!Array.isArray(matiereIds) || matiereIds.length === 0 || !pointsPerMatiere || Object.keys(pointsPerMatiere).length === 0) {
        return res.status(400).json({ message: "Veuillez fournir les matières, les points par matière et le nombre de versions." });
    }

    try {
        // 3. Récupérer EN UNE SEULE FOIS toutes les questions potentiellement utiles
        // C'est plus efficace que de faire une requête dans une boucle
        let sql = `SELECT id, enonce, points, reponses, id_matiere, id_chapitre FROM questions WHERE id_matiere IN (?)`;
        const params = [matiereIds];

        if (Array.isArray(chapitreIds) && chapitreIds.length > 0) {
            sql += ` AND id_chapitre IN (?)`;
            params.push(chapitreIds);
        }

        // ...
const [rawQuestions] = await db.promise().query(sql, params);

// --- DÉBUT DE LA SECTION À REMPLACER ---
// On normalise les réponses ET on s'assure que les points sont bien des NOMBRES.
const allAvailableQuestions = rawQuestions.map(q => ({
    ...normalizeReponses(q),
    points: parseFloat(q.points)
}));
// --- FIN DE LA SECTION À REMPLACER ---

if (allAvailableQuestions.length === 0) {
    return res.status(404).json({ message: "Aucune question trouvée pour les filtres sélectionnés." });
}
// ...
        // 4. Boucle principale pour générer le nombre de versions (sujets) demandées
        const versions = [];
        const versionsSignatures = new Set(); // Pour s'assurer que les sujets générés sont uniques

        for (let i = 0; i < requestedVersions; i++) {
            let currentVersionQuestions = [];
            let isVersionPossible = true;

            // 5. Boucle INTERNE : pour chaque matière, on génère sa partie du sujet
            for (const matiereId of matiereIds) {
                const targetPoints = Number(pointsPerMatiere[matiereId]);

                // Si pas de points définis pour cette matière, on passe à la suivante
                if (!targetPoints || targetPoints <= 0) continue;

                // On filtre les questions disponibles pour la matière en cours
                const questionsForThisMatiere = allAvailableQuestions.filter(q => q.id_matiere == matiereId);

                // On utilise la fonction existante pour trouver une combinaison
                const combination = trouverCombinaison(questionsForThisMatiere, targetPoints);

                // 6. Gestion des erreurs : si aucune combinaison n'est trouvée pour une matière
                if (combination === null) {
                    isVersionPossible = false;
                    // On envoie un message d'erreur clair à l'utilisateur
                    return res.status(400).json({
                        message: `Impossible de créer une combinaison de ${targetPoints} points pour la matière (ID: ${matiereId}). Il n'y a probably pas assez de questions ou les points ne correspondent pas.`
                    });
                }

                // Si la combinaison est trouvée, on l'ajoute au sujet en cours de création
                currentVersionQuestions.push(...combination);
            }

            // 7. Unicité de la version générée
            if (isVersionPossible && currentVersionQuestions.length > 0) {
                const signature = currentVersionQuestions.map(q => q.id).sort().join(',');
                if (!versionsSignatures.has(signature)) {
                    versions.push(currentVersionQuestions);
                    versionsSignatures.add(signature);
                }
            }
        }

        // 8. Message final à l'utilisateur
        if (versions.length < requestedVersions) {
             return res.status(200).json({
                 versions,
                 message: `Avertissement : Seules ${versions.length} version(s) unique(s) sur les ${requestedVersions} demandées ont pu être générées. Essayez d'ajouter plus de questions.`
             });
        }

        res.status(200).json({ versions });

    } catch (err) {
        console.error("Erreur lors de la génération des sujets:", err);
        res.status(500).json({ message: err.message || "Une erreur est survenue sur le serveur." });
    }
});

// ROUTE DE SAUVEGARDE MISE À JOUR ET FONCTIONNELLE
// server.js

// ... (tout le reste de votre fichier server.js est au-dessus) ...

// ROUTE DE SAUVEGARDE ENTIÈREMENT MISE À JOUR
app.post('/api/save-generated-exams', authenticateJWT, authorizeRole(['admin', 'saisie']), async (req, res) => {
    // MODIFIÉ : On récupère exportConfig du body de la requête
    const { id_examen_parent, versions, exportConfig } = req.body;

    // MODIFIÉ : Validation pour inclure exportConfig
    if (!id_examen_parent || !Array.isArray(versions) || versions.length === 0 || !exportConfig) {
        return res.status(400).json({ message: "ID de l'examen parent, versions et configurations d'export sont requis." });
    }

    const connection = await db.promise().getConnection();
    try {
        await connection.beginTransaction();

        const [parentExamRows] = await connection.execute('SELECT titre, id_promotion, type_examen FROM examens WHERE id = ?', [id_examen_parent]);
        if (parentExamRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "L'examen parent n'a pas été trouvé." });
        }
        const parentExam = parentExamRows[0];
        const savedExamsIds = [];

        for (let i = 0; i < versions.length; i++) {
            const version = versions[i];
            const titreExamen = `${parentExam.titre} - Sujet ${i + 1}`;

            // 1. Créer l'entrée pour le sujet dans la table examens (inchangé)
            const sqlExamen = 'INSERT INTO examens (titre, type_examen, id_promotion, id_parent_examen) VALUES (?, ?, ?, ?)';
            const [examenResult] = await connection.execute(sqlExamen, [titreExamen, parentExam.type_examen, parentExam.id_promotion, id_examen_parent]);
            const newExamenId = examenResult.insertId;
            savedExamsIds.push(newExamenId);

            // 2. Lier les questions à ce nouveau sujet (inchangé)
            const questionIds = version.map(q => [newExamenId, q.id]);
            if (questionIds.length > 0) {
                const sqlQuestions = 'INSERT INTO examen_questions (id_examen, id_question) VALUES ?';
                await connection.query(sqlQuestions, [questionIds]);
            }

            // 3. NOUVEAU BLOC : Sauvegarder la durée et le coefficient pour chaque matière de ce sujet
            // On récupère les ID uniques des matières présentes dans cette version du sujet
            const matieresInVersion = [...new Set(version.map(q => q.id_matiere))];

            // On prépare les données pour l'insertion dans `examen_matieres`
            const matiereDetailsValues = matieresInVersion.map(matiereId => {
                const config = exportConfig[matiereId];
                if (!config) {
                    // Sécurité : si la config manque pour une matière, on ne l'insère pas
                    return null;
                }
                // L'ordre doit correspondre à la structure de la table : id_examen, id_matiere, coefficient, duree
                return [newExamenId, matiereId, config.coefficient, config.duree];
            }).filter(Boolean); // On retire les éventuelles valeurs nulles

            if (matiereDetailsValues.length > 0) {
                // On insère toutes les informations en une seule requête pour ce sujet
                const sqlMatiereDetails = 'INSERT INTO examen_matieres (id_examen, id_matiere, coefficient, duree) VALUES ?';
                await connection.query(sqlMatiereDetails, [matiereDetailsValues]);
            }
        }

        await connection.commit();
        res.status(201).json({ message: `${versions.length} sujets ont été créés et liés à l'examen "${parentExam.titre}".`, ids: savedExamsIds });

    } catch (err) {
        await connection.rollback();
        console.error("Erreur lors de la sauvegarde des examens générés:", err);
        res.status(500).json({ message: "Erreur serveur lors de la sauvegarde." });
    } finally {
        connection.release();
    }
});
// AJOUTER CETTE NOUVELLE ROUTE DANS server.js

// server.js

// ... (tout le reste du fichier server.js est au-dessus) ...

// GET un sujet sauvegardé spécifique avec toutes ses questions ET SES DÉTAILS PAR MATIÈRE
app.get('/api/sujets-sauvegardes/:id', authenticateJWT, async (req, res) => {
    const sujetId = req.params.id;

    try {
        // 1. Récupérer les informations de base du sujet (inchangé)
        const sqlSujet = `
            SELECT
                s.id, s.titre, s.created_at,
                parent.titre as titre_parent,
                parent.type_examen
            FROM examens s
            LEFT JOIN examens parent ON s.id_parent_examen = parent.id
            WHERE s.id = ? AND s.id_parent_examen IS NOT NULL
        `;
        const [sujetRows] = await db.promise().execute(sqlSujet, [sujetId]);

        if (sujetRows.length === 0) {
            return res.status(404).json({ message: "Sujet non trouvé." });
        }
        const sujetDetails = sujetRows[0];

        // 2. Récupérer toutes les questions liées à ce sujet, avec leur matière (inchangé)
        const sqlQuestions = `
            SELECT q.*, m.nom_matiere
            FROM examen_questions eq
            JOIN questions q ON eq.id_question = q.id
            JOIN matières m ON q.id_matiere = m.id
            WHERE eq.id_examen = ?
            ORDER BY m.nom_matiere, q.id
        `;
        const [questionRows] = await db.promise().execute(sqlQuestions, [sujetId]);
        const questions = questionRows.map(normalizeReponses);

        // 3. NOUVEAU : Récupérer les détails par matière (coefficient, durée) pour ce sujet
        const sqlMatiereDetails = `
            SELECT id_matiere, coefficient, duree
            FROM examen_matieres
            WHERE id_examen = ?
        `;
        const [matiereDetailsRows] = await db.promise().execute(sqlMatiereDetails, [sujetId]);

        // On transforme le tableau de résultats en un objet plus facile à utiliser côté client
        // La clé sera l'ID de la matière
        const matiereDetailsMap = matiereDetailsRows.reduce((acc, row) => {
            acc[row.id_matiere] = {
                coefficient: row.coefficient,
                duree: row.duree
            };
            return acc;
        }, {});


        // 4. Renvoyer un objet complet avec les nouvelles informations
        res.status(200).json({
            ...sujetDetails,
            questions: questions,
            matiereDetails: matiereDetailsMap // <-- NOUVELLE DONNÉE ENVOYÉE
        });

    } catch (err) {
        console.error("Erreur lors de la récupération des détails du sujet:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});
// server.js

// ... (tout le code précédent de votre fichier)

// ===============================================
// === NOUVELLE ROUTE POUR LA GÉNÉRATION DE L'ORAL ===
// ===============================================
app.post('/api/questions/for-oral', authenticateJWT, authorizeRole(['admin', 'saisie']), async (req, res) => {
    // 1. Récupérer les IDs des matières et chapitres depuis le corps de la requête.
    const { matiereIds, chapitreIds } = req.body;

    // 2. Valider l'entrée : il faut au moins des IDs de matières.
    if (!Array.isArray(matiereIds) || matiereIds.length === 0) {
        return res.status(400).json({ message: "Veuillez fournir une liste d'IDs de matières." });
    }

    try {
        // 3. Construire la requête SQL de base.
        // On sélectionne toutes les colonnes nécessaires, y compris celles des jointures.
        // On utilise normalizeReponses plus tard, donc on peut prendre 'reponses' tel quel.
        let sql = `
            SELECT q.id, q.id_matiere, q.id_chapitre, q.enonce, q.type_question, q.reponses, q.points, q.created_at, q.reponses_meta, q.image_enonce_url,
                   m.nom_matiere, c.nom_chapitre
            FROM questions q
            JOIN matières m ON q.id_matiere = m.id
            LEFT JOIN chapitres c ON q.id_chapitre = c.id
            WHERE q.id_matiere IN (?)
        `;
        const params = [matiereIds];

        // 4. Ajouter le filtre sur les chapitres si nécessaire.
        // On s'assure que chapitreIds est bien un tableau non vide.
        if (Array.isArray(chapitreIds) && chapitreIds.length > 0) {
            sql += ` AND q.id_chapitre IN (?)`;
            params.push(chapitreIds);
        }

        // 5. Exécuter la requête.
        const [rawQuestions] = await db.promise().query(sql, params);

        // 6. Normaliser les résultats (comme pour la route GET /questions).
        // C'est important si certaines de vos questions ont des réponses complexes.
        const allAvailableQuestions = rawQuestions.map(normalizeReponses);

        // 7. Renvoyer la liste des questions au format JSON.
        res.status(200).json(allAvailableQuestions);

    } catch (err) {
        // Gestion des erreurs
        console.error("Erreur lors de la récupération des questions pour l'oral:", err);
        res.status(500).json({ message: "Une erreur est survenue sur le serveur lors de la récupération des questions." });
    }
});


// ... (le reste de votre fichier server.js, comme la route GET /api/sujets-sauvegardes/:id etc.)

// ... (le reste de votre fichier server.js est en dessous) ...
// ===============================================
// DÉMARRAGE DU SERVEUR
// ===============================================
// server.js (à la fin du fichier)

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => { // <-- AJOUT DE '0.0.0.0' ICI
    console.log(`Serveur démarré et accessible sur votre réseau au port ${PORT}`);
});
