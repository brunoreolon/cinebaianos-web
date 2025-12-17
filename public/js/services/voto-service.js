import { apiFetch } from '../auth.js';

/** Retorna a lista de tipos de voto disponíveis */
export async function buscarTiposVotos() {
    const url = new URL(`/api/vote-types`, window.location.origin);
    const response = await apiFetch(url);

    return await response.json();
}

/** 
 * Retorna os votos que o usuário recebeu 
 * @param {string} discordId - ID do usuário
 * */
export async function buscarVotosRecebidosUsuario(discordId) {
    const url = new URL(`/api/votes/users/${discordId}`, window.location.origin);
    const response = await apiFetch(url);

    return await response.json();
}

/**
 * Registra o voto de um usuário em um filme
 * @param {number|string} movieId - ID do filme
 * @param {string} discordId - ID do usuário
 * @param {number|string} votoId - ID do voto escolhido
 */
export async function votar(movieId, discordId, votoId) {
    const corpo = {
        voter: { discordId },
        movie: { id: Number(movieId) },
        vote: Number(votoId)
    };

    const url = new URL(`/api/votes`, window.location.origin);

    const response = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
    });

    return await response.json();
}

/**
 * Altera o voto de um usuário em um filme
 * @param {number|string} movieId - ID do filme
 * @param {string} discordId - ID do usuário
 * @param {number|string} votoId - ID do voto escolhido
 */
export async function alterarVoto(movieId, discordId, votoId) {
    const corpo = { id: Number(votoId) };

    const url = new URL(`/api/votes/users/${discordId}/movies/${movieId}`, window.location.origin);

    const response = await apiFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
    });

    return await response.json();
}

export async function criarTipoVoto(voto) {
    const corpo = { 
        name: voto.name, 
        description: voto.description, 
        color: voto.color,
        emoji: voto.emoji
    };

    const url = new URL(`/api/vote-types`, window.location.origin);

    const response = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
    });

    return await response.json();
}

export async function atualizarTipoVoto(voto) {
    const corpo = { 
        name: voto.name, 
        description: voto.description, 
        color: voto.color,
        emoji: voto.emoji
    };

    const url = new URL(`/api/vote-types/${voto.id}`, window.location.origin);

    const response = await apiFetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
    });

    return await response.json();
}

export async function excluirTipoVoto(id) {
    const url = new URL(`/api/vote-types/${id}`, window.location.origin);

    const response = await apiFetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        return await response.json();
    }

    return true;
}