import { groupService } from './group-service.js';

const STORAGE_KEY = 'currentGroup';

let currentGroup = readStoredGroup();

function readStoredGroup() {
    try {
        const value = sessionStorage.getItem(STORAGE_KEY);
        return value ? JSON.parse(value) : null;
    } catch (_) {
        return null;
    }
}

function persistCurrentGroup(group) {
    if (!group) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(group));
}

export function getCurrentGroup() {
    return currentGroup;
}

export function setFlashMessage(texto, tipo = 'INFO') {
    sessionStorage.setItem('flashMessage', JSON.stringify({ texto, tipo }));
}

export async function loadCurrentGroup() {
    currentGroup = await groupService.buscarGrupoPadrao();
    persistCurrentGroup(currentGroup);
    return currentGroup;
}

export function clearCurrentGroup() {
    currentGroup = null;
    persistCurrentGroup(null);
}

export async function ensureCurrentGroup({
    redirectIfMissing = false,
    redirectTo = './meus-grupos.html',
    message = 'Escolha, entre ou solicite participação em um grupo para continuar.'
} = {}) {
    const group = await loadCurrentGroup();

    if (!group && redirectIfMissing) {
        setFlashMessage(message, 'ALERT');
        window.location.href = redirectTo;
        return null;
    }

    return group;
}

