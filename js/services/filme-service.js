import { apiFetch } from '../auth.js';
import { API_URL } from '../config.js'

export async function buscarFilmes({ page = 0, size = 100, sortBy = 'dateAdded', sortDir = 'desc' } = {}) {
    try {
        const url = new URL(`${API_URL}/movies`);
        url.searchParams.append('page', page);
        url.searchParams.append('size', size);
        url.searchParams.append('sortBy', sortBy);
        url.searchParams.append('sortDir', sortDir);

        const response = await apiFetch(url);
        if (!response.ok) throw new Error('Erro ao buscar filmes');

        const data = await response.json();
        return data.movies || [];
    } catch (err) {
        console.error('Falha ao buscar filmes:', err);
        return [];
    }
}

export async function buscarFilmesAguardandoAvaliacao({ page = 0, size = 100, sortBy = 'dateAdded', sortDir = 'desc', discordId = 'discordId' } = {}) {
    try {
        const url = new URL(`${API_URL}/movies/awaiting-review`);
        url.searchParams.append('page', page);
        url.searchParams.append('size', size);
        url.searchParams.append('sortBy', sortBy);
        url.searchParams.append('sortDir', sortDir);
        url.searchParams.append('discordId', discordId);

        const response = await apiFetch(url);
        if (!response.ok) throw new Error('Erro ao buscar filmes');

        const data = await response.json();
        return data.movies || [];
    } catch (err) {
        console.error('Falha ao buscar filmes:', err);
        return [];
    }
}

export async function buscarFilmePorId(id) {
    try {
        const url = new URL(`${API_URL}/movies/${id}`);
        const response = await apiFetch(url);

        if (!response.ok) throw new Error('Erro ao buscar filme');
        const filme = await response.json();

        return filme;
    } catch (err) {
        console.error('Erro ao buscar detalhes do filme:', err);
        return null;
    }
}

export async function buscarFilmesPorTitulo(titulo) {
    try {
        const url = new URL(`${API_URL}/tmdb/search/movies`);
        url.searchParams.append('title', titulo);

        const response = await apiFetch(url);
        if (!response.ok) throw new Error('Erro ao buscar filme');
        
        const filme = await response.json();

        return filme;
    } catch (err) {
        console.error('Erro ao buscar detalhes do filme:', err);
        return null;
    }
}

export async function adicionarFilme(tmdbId, discordId, votoId = null) {
    try {
        // Monta o corpo da requisição
        const corpo = {
            movie: { id: tmdbId },
            chooser: { discordId: discordId }
        };

        // Inclui o voto somente se fornecido
        if (votoId !== null) {
            corpo.vote = { id: votoId };
        }

        const url = new URL(`${API_URL}/movies`);

        const response = await apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpo)
        });

        if (!response.ok) throw new Error('Erro ao salvar filme');

        const filmeSalvo = await response.json();
        return filmeSalvo;
    } catch (err) {
        console.error('Erro ao salvar filme:', err);
        return null;
    }
}