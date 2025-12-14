import { apiFetch } from '../auth.js';

export async function buscarFilmes({ page = 0, size = 100, sortBy = 'dateAdded', sortDir = 'desc', discordId, title } = {}) {
    const url = new URL(`/api/movies`, window.location.origin);
    url.searchParams.append('page', page);
    url.searchParams.append('size', size);
    url.searchParams.append('sortBy', sortBy);
    url.searchParams.append('sortDir', sortDir);

    if (discordId) url.searchParams.append('chooserDiscordId', discordId);
    if (title) url.searchParams.append('title', title);

    const response = await apiFetch(url);
    const data = await response.json();

    return data.movies || [];
}

export async function buscarFilmesAguardandoAvaliacao({ page = 0, size = 100, sortBy = 'dateAdded', sortDir = 'desc', discordId, title } = {}) {
    const url = new URL(`/api/movies/awaiting-review`, window.location.origin);
    url.searchParams.append('page', page);
    url.searchParams.append('size', size);
    url.searchParams.append('sortBy', sortBy);
    url.searchParams.append('sortDir', sortDir);

    if (discordId) url.searchParams.append('discordId', discordId);
    if (title) url.searchParams.append('title', title);

    const response = await apiFetch(url);
    const data = await response.json();

    return data.movies || [];
}

export async function buscarFilmePorId(id) {
    const url = new URL(`/api/movies/${id}`, window.location.origin);
    const response = await apiFetch(url);

    return await response.json();
}

export async function buscarFilmesPorTitulo(titulo) {
    const url = new URL(`/api/tmdb/search/movies`, window.location.origin);
    url.searchParams.append('title', titulo);

    const response = await apiFetch(url);
    return await response.json();
}

export async function adicionarFilme(tmdbId, discordId, votoId = null) {
    const corpo = {
        movie: { id: tmdbId },
        chooser: { discordId }
    };

    if (votoId !== null) {
        corpo.vote = { id: votoId };
    }

    const url = new URL(`/api/movies`, window.location.origin);

    const response = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo)
    });

    return await response.json();
}