import { authService } from './auth-service.js';

/**
 * Serviço para gerenciar usuários via API administrativa.
 * Todas as chamadas utilizam `authService.apiFetch` para lidar com autenticação e refresh automático.
 */
export class AdminService {

    /**
     * Atualiza o status de ativação de uma conta de usuário.
     *
     * @param {string} discordId - ID do usuário no Discord.
     * @param {boolean} ativo - Novo valor do status de ativação.
     * @returns {Promise<boolean>} - Retorna true se a requisição foi enviada com sucesso.
     * @throws {ApiError} - Se a API retornar erro.
     */
    async atualizarAtivacaoConta(discordId, ativo) {
        const url = new URL(`/api/admin/users/${discordId}/activation`, window.location.origin);
        
        const resposta = await authService.apiFetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: ativo })
        });

        return true;
    }

    /**
     * Atualiza o status de administrador de um usuário.
     *
     * @param {string} discordId - ID do usuário no Discord.
     * @param {boolean} admin - Novo valor do status de administrador.
     * @returns {Promise<boolean>} - Retorna true se a requisição foi enviada com sucesso.
     * @throws {ApiError} - Se a API retornar erro.
     */
    async atualizarAdmin(discordId, admin) {
        const url = new URL(`/api/admin/users/${discordId}/admin`, window.location.origin);

        const resposta = await authService.apiFetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin: admin })
        });

        return true;
    }

     /**
     * Redefine a senha de um usuário.
     *
     * @param {string} discordId - ID do usuário no Discord.
     * @param {string} novaSenha - Nova senha do usuário.
     * @returns {Promise<boolean>} - Retorna true se a requisição foi enviada com sucesso.
     * @throws {ApiError} - Se a API retornar erro.
     */
    async redefinirSenha(discordId, novaSenha) {
        const url = new URL(`/api/admin/users/${discordId}/reset-password`, window.location.origin);

        const response = await authService.apiFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword: novaSenha })
        });

        return true;
    }
} 

export const adminService = new AdminService();