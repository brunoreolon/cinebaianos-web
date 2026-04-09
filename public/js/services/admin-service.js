import { authService } from './auth-service.js';

/**
 * Serviço para gerenciar usuários via API administrativa.
 * Todas as chamadas utilizam `authService.apiFetch` para lidar com autenticação e refresh automático.
 */
export class AdminService {

    /**
     * Atualiza o status de ativação de uma conta de usuário.
     *
     * @param {number|string} userId - ID interno do usuário.
     * @param {boolean} ativo - Novo valor do status de ativação.
     * @returns {Promise<boolean>} - Retorna true se a requisição foi enviada com sucesso.
     * @throws {ApiError} - Se a API retornar erro.
     */
    async atualizarAtivacaoConta(userId, ativo) {
        const url = new URL(`/api/admin/users/${userId}/activation`, window.location.origin);

        await authService.apiFetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: ativo })
        });

        return true;
    }

    /**
     * Atualiza o status de administrador de um usuário.
     *
     * @param {number|string} userId - ID interno do usuário.
     * @param {boolean} admin - Novo valor do status de administrador.
     * @returns {Promise<boolean>} - Retorna true se a requisição foi enviada com sucesso.
     * @throws {ApiError} - Se a API retornar erro.
     */
    async atualizarAdmin(userId, admin) {
        const url = new URL(`/api/admin/users/${userId}/admin`, window.location.origin);

        await authService.apiFetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin: admin })
        });

        return true;
    }

     /**
     * Redefine a senha de um usuário.
     *
     * @param {number|string} userId - ID interno do usuário.
     * @param {string} novaSenha - Nova senha do usuário.
     * @returns {Promise<boolean>} - Retorna true se a requisição foi enviada com sucesso.
     * @throws {ApiError} - Se a API retornar erro.
     */
    async redefinirSenha(userId, novaSenha) {
        const url = new URL(`/api/admin/users/${userId}/reset-password`, window.location.origin);

        await authService.apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword: novaSenha })
        });

        return true;
    }

    async buscarGruposAdmin() {
        const url = new URL('/api/admin/groups', window.location.origin);
        const response = await authService.apiFetch(url);
        return await response.json();
    }

    async banirUsuario(userId, reason, expiresAt = null) {
        const url = new URL(`/api/admin/users/${userId}/ban`, window.location.origin);
        const body = { reason };
        if (expiresAt) body.expiresAt = expiresAt;

        await authService.apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        return true;
    }

    async desbanirUsuario(userId) {
        const url = new URL(`/api/admin/users/${userId}/ban`, window.location.origin);
        await authService.apiFetch(url, { method: 'DELETE' });
        return true;
    }

    async banirGrupo(groupId, reason, expiresAt = null) {
        const url = new URL(`/api/admin/groups/${groupId}/ban`, window.location.origin);
        const body = { reason };
        if (expiresAt) body.expiresAt = expiresAt;

        await authService.apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        return true;
    }

    async desbanirGrupo(groupId) {
        const url = new URL(`/api/admin/groups/${groupId}/ban`, window.location.origin);
        await authService.apiFetch(url, { method: 'DELETE' });
        return true;
    }
} 

export const adminService = new AdminService();