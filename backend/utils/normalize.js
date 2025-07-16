// utils/normalize.js

const normalizeReponses = (question) => {
    let rawReponses = question.reponses;
    if (typeof rawReponses === 'string') {
        try {
            rawReponses = JSON.parse(rawReponses);
        } catch (e) {
            rawReponses = [];
        }
    }

    let normalized = [];
    if (Array.isArray(rawReponses) && rawReponses.length > 0) {
        if (typeof rawReponses[0] === 'string') {
            normalized = rawReponses.map(text => ({ texte: String(text).trim(), est_correcte: true }));
        } else {
            normalized = rawReponses;
        }
    }

    return { ...question, reponses: normalized };
};

module.exports = {
    normalizeReponses
};