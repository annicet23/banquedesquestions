// cleanup_reponses.js
require('dotenv').config();
const db = require('./config/db');

async function cleanupReponses() {
    console.log('--- DÉBUT DE LA MIGRATION DES FORMATS DE RÉPONSES ---');
    let connection;
    try {
        connection = await db.promise().getConnection();
        console.log('Connecté à la base de données.');

        // Étape 1: Récupérer toutes les questions
        const [rows] = await connection.execute('SELECT id, reponses FROM Questions');
        console.log(`Trouvé ${rows.length} questions à vérifier.`);

        let fixedCount = 0;
        let skippedCount = 0;

        for (const row of rows) {
            const { id, reponses } = row;

            // Comme la colonne est de type JSON, `reponses` est déjà un objet JS.
            if (!Array.isArray(reponses) || reponses.length === 0) {
                skippedCount++;
                continue; // On ignore les réponses non-tableau ou vides.
            }

            // Étape 2: Détecter l'ancien format (tableau de strings)
            if (typeof reponses[0] === 'string') {
                console.log(`\n[MIGRATION] Question ID: ${id} - Ancien format détecté.`);

                try {
                    // Étape 3: Convertir au nouveau format (tableau d'objets)
                    const newReponsesFormat = reponses.map(text => ({
                        texte: String(text).trim(),
                        est_correcte: true
                    }));

                    // Étape 4: Convertir en chaîne JSON VALIDE pour l'UPDATE
                    const validJsonString = JSON.stringify(newReponsesFormat);

                    // Étape 5: Mettre à jour la base de données avec le nouveau format
                    await connection.execute(
                        'UPDATE Questions SET reponses = ? WHERE id = ?',
                        [validJsonString, id]
                    );

                    console.log(`  -> SUCCÈS: Question ID: ${id} a été migrée vers le nouveau format.`);
                    fixedCount++;
                } catch (e) {
                    console.error(`  -> ERREUR lors de la migration de l'ID ${id}: ${e.message}`);
                }
            } else {
                // La question est déjà au nouveau format ou a un format inconnu
                skippedCount++;
            }
        }

        console.log('\n--- FIN DE LA MIGRATION ---');
        console.log(`Statistiques:`);
        console.log(`- Questions migrées: ${fixedCount}`);
        console.log(`- Questions déjà au bon format ou ignorées: ${skippedCount}`);
        console.log(`- Total: ${rows.length}`);

    } catch (error) {
        console.error('Une erreur générale est survenue:', error);
    } finally {
        if (connection) {
            connection.release();
            console.log('Connexion à la base de données libérée.');
        }
        db.end();
    }
}

cleanupReponses();