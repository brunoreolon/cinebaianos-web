import { apiFetch } from '../auth.js';

export async function buscarTiposVotos() {
    try {
        const url = new URL(`/api/vote-types`, window.location.origin);
        const response = await apiFetch(url);  // apiFetch já adiciona token, headers etc.
        if (!response.ok) throw new Error('Erro ao buscar tipos de voto');
        const tiposVotos = await response.json();
        return tiposVotos;
    } catch (err) {
        console.error('Erro ao buscar tipos de votos:', err);
        return null;
    }
}

export async function votar(tmdbId, discordId, votoId) {
    try {
        const corpo = {
            voter: { discordId: discordId }, // se discordId for um Long na API, converta
            movie: { id: Number(tmdbId) },
            vote: Number(votoId) // apenas o número
        };

        const url = new URL(`/api/votes`, window.location.origin);

        const response = await apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpo)
        });

        if (!response.ok) throw new Error('Erro ao votar');

        return await response.json();
    } catch (err) {
        console.error('Erro ao votar:', err);
        return null;
    }
}