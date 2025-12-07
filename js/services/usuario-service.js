import { apiFetch } from '../auth.js';
import { API_URL } from '../config.js'

export async function getUsuarioById(discordId) {
    try {
        const url = new URL(`${API_URL}/users/${discordId}`);
        const response = await apiFetch(url);

        if (!response.ok) throw new Error('Erro ao buscar usuário');
        
        const usuario = await response.json();
        return usuario;
    } catch (err) {
        console.error('Erro ao buscar usuário:', err);
        return null;
    }
}