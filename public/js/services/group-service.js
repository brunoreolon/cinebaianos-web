import { authService } from './auth-service.js';
import { ApiError } from '../exception/api-error.js';

export class GroupService {

    async buscarMeusGrupos() {
        const response = await authService.apiFetch('/api/users/me/groups');
        return await response.json();
    }

    async buscarGrupoPadrao() {
        try {
            const response = await authService.apiFetch('/api/users/me/groups/default');
            return await response.json();
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                return null;
            }

            throw err;
        }
    }

    async definirGrupoPadrao(groupId) {
        await authService.apiFetch(`/api/users/me/groups/${groupId}/default`, {
            method: 'PUT'
        });

        return true;
    }

    async buscarGruposPublicos() {
        const response = await authService.apiFetch('/api/groups');
        return await response.json();
    }

    async criarGrupo(data) {
        const response = await authService.apiFetch('/api/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    async buscarDisponibilidadeGrupo({ tag, slug, excludeGroupId } = {}) {
        const url = new URL('/api/groups/availability', window.location.origin);

        if (tag) {
            url.searchParams.set('tag', tag);
        }

        if (slug) {
            url.searchParams.set('slug', slug);
        }

        if (excludeGroupId) {
            url.searchParams.set('excludeGroupId', String(excludeGroupId));
        }

        const response = await authService.apiFetch(url);
        return await response.json();
    }

    async buscarGrupoPorId(groupId) {
        const response = await authService.apiFetch(`/api/groups/${groupId}`);
        return await response.json();
    }

    async buscarMembroDoGrupo(groupId, userId) {
        const response = await authService.apiFetch(`/api/groups/${groupId}/members/${userId}`);
        return await response.json();
    }

    async buscarMembrosDoGrupo(groupId) {
        const response = await authService.apiFetch(`/api/groups/${groupId}/members`);
        return await response.json();
    }

    async buscarTotalMembros(groupId) {
        const groupWithMembers = await this.buscarMembrosDoGrupo(groupId);
        return groupWithMembers.members?.length || 0;
    }

    async entrarNoGrupo(groupId) {
        const response = await authService.apiFetch(`/api/groups/${groupId}/join`, {
            method: 'POST'
        });

        return await response.json();
    }

    async solicitarEntradaNoGrupo(groupId) {
        const response = await authService.apiFetch(`/api/groups/${groupId}/join-requests`, {
            method: 'POST'
        });

        return await response.json();
    }

    async buscarMinhaSolicitacaoEntrada(groupId) {
        try {
            const response = await authService.apiFetch(`/api/groups/${groupId}/join-requests/me`);
            return await response.json();
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                return null;
            }

            throw err;
        }
    }

    async cancelarMinhaSolicitacaoEntrada(groupId) {
        await authService.apiFetch(`/api/groups/${groupId}/join-requests/me`, {
            method: 'DELETE'
        });
        return true;
    }

    async sairDoGrupo(groupId) {
        await authService.apiFetch(`/api/groups/${groupId}/members/me`, {
            method: 'DELETE'
        });
        return true;
    }

    async buscarMeusGruposComMetadados(userId) {
        const groups = await this.buscarMeusGrupos();

        return await Promise.all(groups.map(async group => {
            const [membershipResult, totalMembersResult] = await Promise.allSettled([
                this.buscarMembroDoGrupo(group.id, userId),
                this.buscarTotalMembros(group.id)
            ]);

            return {
                ...group,
                membership: membershipResult.status === 'fulfilled' ? membershipResult.value : null,
                totalMembers: totalMembersResult.status === 'fulfilled' ? totalMembersResult.value : null
            };
        }));
    }

    async buscarPermissoes(groupId) {
        const response = await authService.apiFetch(`/api/groups/${groupId}/permissions/me`);
        return await response.json();
    }

    async removerMembro(groupId, userId) {
        await authService.apiFetch(`/api/groups/${groupId}/members/${userId}`, {
            method: 'DELETE'
        });
        return true;
    }

    async banirMembro(groupId, userId, reason, expiresAt = null) {
        const body = { reason };
        if (expiresAt) body.expiresAt = expiresAt;
        await authService.apiFetch(`/api/groups/${groupId}/members/${userId}/ban`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return true;
    }

    async buscarBanimentosAtivos(groupId) {
        const response = await authService.apiFetch(`/api/groups/${groupId}/members/bans`);
        return await response.json();
    }

    async removerBanimento(groupId, userId) {
        await authService.apiFetch(`/api/groups/${groupId}/members/${userId}/ban`, {
            method: 'DELETE'
        });
        return true;
    }

    async promoverParaAdmin(groupId, userId) {
        const response = await authService.apiFetch(`/api/groups/${groupId}/members/${userId}/promote-to-admin`, {
            method: 'PUT'
        });
        return await response.json();
    }

    async rebaixarParaMembro(groupId, userId) {
        const response = await authService.apiFetch(`/api/groups/${groupId}/members/${userId}/demote-to-member`, {
            method: 'PUT'
        });
        return await response.json();
    }

    async atualizarGrupo(groupId, data) {
        const response = await authService.apiFetch(`/api/groups/${groupId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    async excluirGrupo(groupId) {
        await authService.apiFetch(`/api/groups/${groupId}`, {
            method: 'DELETE'
        });
        return true;
    }

    async buscarSolicitacoesPendentes(groupId) {
        const response = await authService.apiFetch(`/api/groups/${groupId}/join-requests`);
        return await response.json();
    }

    async aprovarSolicitacaoEntrada(groupId, requestId) {
        const response = await authService.apiFetch(`/api/groups/${groupId}/join-requests/${requestId}/approve`, {
            method: 'PUT'
        });
        return await response.json();
    }

    async rejeitarSolicitacaoEntrada(groupId, requestId) {
        const response = await authService.apiFetch(`/api/groups/${groupId}/join-requests/${requestId}/reject`, {
            method: 'PUT'
        });
        return await response.json();
    }

    async buscarConvitesPendentes(groupId) {
        const response = await authService.apiFetch(`/api/groups/${groupId}/invites`);
        return await response.json();
    }

    async buscarConvitesRecebidos() {
        const response = await authService.apiFetch('/api/groups/invites/received');
        return await response.json();
    }

    async criarConvite(groupId, data) {
        const response = await authService.apiFetch(`/api/groups/${groupId}/invites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    }

    async aceitarConvite(token) {
        const response = await authService.apiFetch('/api/groups/invites/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        return await response.json();
    }

    async recusarConvite(inviteId) {
        await authService.apiFetch(`/api/groups/invites/${inviteId}/decline`, {
            method: 'DELETE'
        });
        return true;
    }

    async revogarConvite(groupId, inviteId) {
        await authService.apiFetch(`/api/groups/${groupId}/invites/${inviteId}`, {
            method: 'DELETE'
        });
        return true;
    }
}

export const groupService = new GroupService();

