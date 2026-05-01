import { authService } from '../services/auth-service.js';
import { groupService } from '../services/group-service.js';
import { filmeService } from '../services/filme-service.js';
import { votoService } from '../services/voto-service.js';
import { emojis } from '../emojis.js';
import { getCurrentGroup, loadCurrentGroup, setFlashMessage } from '../services/group-context.js';
import { criarFigure, formatarData, formatarDataExtenso, getQueryParam } from '../global.js';
import { ApiError } from '../exception/api-error.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';
import { renderGroupPreviewCard } from '../components/group-preview-card.js';

const VISIBILITY_LABELS = {
    PUBLIC: 'Público',
    PRIVATE: 'Privado'
};

const JOIN_POLICY_LABELS = {
    OPEN: 'Aberto',
    REQUEST: 'Solicitação',
    INVITE_ONLY: 'Somente convite'
};

const ROLE_META = {
    OWNER: {
        icon: 'fa-solid fa-crown',
        label: 'Dono',
        css: 'role-owner'
    },
    ADMIN: {
        icon: 'fa-solid fa-shield',
        label: 'Admin',
        css: 'role-admin'
    },
    MEMBER: {
        icon: 'fa-regular fa-user',
        label: 'Membro',
        css: 'role-member'
    }
};

const EDIT_GROUP_LIMITS = {
    tag: 6,
    slug: 50
};

const EDIT_GROUP_PATTERNS = {
    tag: /^[A-Z0-9_]{4,6}$/,
    slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
};

function exibirFlashMessage() {
    const flash = sessionStorage.getItem('flashMessage');
    if (!flash) return;

    try {
        const { texto, tipo } = JSON.parse(flash);
        criarMensagem(texto, MensagemTipo[tipo]);
        sessionStorage.removeItem('flashMessage');
    } catch (_) {
        sessionStorage.removeItem('flashMessage');
    }
}

const state = {
    groupId: null,
    usuario: null,
    group: null,
    members: [],
    movies: [],
    groupVotes: [],
    globalVotes: [],
    permissions: null,
    pendingRequests: [],
    pendingInvites: [],
    bans: [],
    rankingVoteTypes: [],
    rankingSummaryStats: [],
    rankingStats: [],
    rankingSelectedVoteTypeId: null,
    memberTarget: null,
    voteTypeTarget: null,
    currentGroup: null,
    gestaoSubtab: 'convites'
};

const editGroupState = {
    debounceId: null,
    requestId: 0,
    availability: {
        tag: createFieldAvailabilityState(),
        slug: createFieldAvailabilityState()
    }
};

const modalCloseTimers = new Map();
const searchInviteCandidatesDebounced = debounce(executarBuscaCandidatosConvite, 320);

function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

function createFieldAvailabilityState(value = '') {
    return {
        value,
        available: null,
        checking: false,
        error: false
    };
}

function getRoleMeta(role) {
    return ROLE_META[role] || ROLE_META.MEMBER;
}

function getVisibilityLabel(visibility) {
    return VISIBILITY_LABELS[visibility] || visibility || 'Não informado';
}

function getJoinPolicyLabel(policy) {
    return JOIN_POLICY_LABELS[policy] || policy || 'Não informado';
}

function isCurrentUser(member) {
    return Number(member?.member?.id) === Number(state.usuario?.id);
}

function isCurrentGroupSelected() {
    return Number(state.currentGroup?.id) === Number(state.group?.id);
}

function canManageMember(member) {
    if (!state.permissions?.canManage) return false;
    if (!member?.active) return false;
    if (isCurrentUser(member)) return false;
    if (member.role === 'OWNER') return false;

    if (state.permissions?.role === 'ADMIN') {
        return member.role === 'MEMBER';
    }

    return true;
}

function canChangeRole(member) {
    if (state.permissions?.role !== 'OWNER') return false;
    if (!member?.active) return false;
    if (isCurrentUser(member)) return false;
    return member.role !== 'OWNER';
}

function getTransferOwnershipCandidates() {
    return sortMembers(state.members)
        .filter(member => member?.active)
        .filter(member => !isCurrentUser(member))
        .filter(member => member.role !== 'OWNER');
}

function sortMembers(members) {
    const weight = {
        OWNER: 0,
        ADMIN: 1,
        MEMBER: 2
    };

    return [...members].sort((a, b) => {
        const roleDiff = (weight[a.role] ?? 99) - (weight[b.role] ?? 99);
        if (roleDiff !== 0) return roleDiff;
        return (a.member?.name || '').localeCompare(b.member?.name || '', 'pt-BR', { sensitivity: 'base' });
    });
}

function groupMembersByRole(members) {
    const sorted = sortMembers(members);

    return {
        OWNER: sorted.filter(member => member.role === 'OWNER'),
        ADMIN: sorted.filter(member => member.role === 'ADMIN'),
        MEMBER: sorted.filter(member => member.role === 'MEMBER')
    };
}

function getRoleSectionLabel(role) {
    const labels = {
        OWNER: 'Dono',
        ADMIN: 'Admins',
        MEMBER: 'Membros'
    };

    return labels[role] || role;
}

function formatarDataHora(dataStr) {
    if (!dataStr) return 'Sem expiração';
    const data = new Date(dataStr);
    return data.toLocaleString('pt-BR');
}

function obterNomeSolicitante(request) {
    return request?.userName || `Usuário #${request?.userId}`;
}

function obterNomeConvidado(invite) {
    return invite?.invitedUserName || (invite?.invitedUserId ? `Usuário #${invite.invitedUserId}` : 'Qualquer usuário');
}

function resetInviteCandidateSelection({ clearInput = false } = {}) {
    const hiddenInput = document.getElementById('convite-user-id');
    const searchInput = document.getElementById('convite-user-search');
    const helper = document.getElementById('convite-user-helper');
    const results = document.getElementById('convite-user-results');

    if (hiddenInput) hiddenInput.value = '';
    if (clearInput && searchInput) searchInput.value = '';
    if (helper) helper.textContent = 'Digite pelo menos 2 caracteres para buscar usuários elegíveis.';
    if (results) {
        results.innerHTML = '';
        results.classList.add('inativo');
    }
}

function renderInviteCandidateResults(response = null) {
    const results = document.getElementById('convite-user-results');
    const helper = document.getElementById('convite-user-helper');
    if (!results || !helper) return;

    results.innerHTML = '';

    const candidates = response?.candidates || [];
    if (!candidates.length) {
        results.classList.remove('inativo');
        results.innerHTML = '<div class="invite-user-empty">Nenhum usuário elegível encontrado.</div>';
        helper.textContent = 'Nenhum usuário elegível encontrado para esse termo.';
        return;
    }

    candidates.forEach(candidate => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'invite-user-result-item';
        button.innerHTML = `
            <div class="invite-user-result-avatar">
                <img src="${candidate.avatar || './assets/img/placeholder-avatar.png'}" alt="Avatar de ${candidate.name || 'usuário'}" />
            </div>
            <div class="invite-user-result-info">
                <strong>${candidate.name || 'Usuário'}</strong>
                <span>${candidate.email || 'Sem e-mail'}</span>
            </div>
        `;

        button.addEventListener('click', () => {
            const hiddenInput = document.getElementById('convite-user-id');
            const searchInput = document.getElementById('convite-user-search');
            if (hiddenInput) hiddenInput.value = String(candidate.id);
            if (searchInput) searchInput.value = candidate.name || candidate.email || 'Usuário selecionado';
            helper.textContent = `Usuário selecionado: ${candidate.name || candidate.email}.`;
            results.classList.add('inativo');
            results.innerHTML = '';
        });

        const avatarImg = button.querySelector('img');
        avatarImg?.addEventListener('error', () => {
            avatarImg.src = './assets/img/placeholder-avatar.png';
        }, { once: true });

        results.appendChild(button);
    });

    if (response?.hasNext) {
        const more = document.createElement('div');
        more.className = 'invite-user-more';
        more.textContent = 'Existem mais resultados. Continue digitando para refinar a busca.';
        results.appendChild(more);
    }

    results.classList.remove('inativo');
    helper.textContent = `${candidates.length} usuário(s) elegível(is) encontrado(s).`;
}

async function executarBuscaCandidatosConvite(rawQuery) {
    const query = rawQuery?.trim() || '';
    const results = document.getElementById('convite-user-results');
    const helper = document.getElementById('convite-user-helper');
    if (!results || !helper) return;

    if (query.length < 2) {
        resetInviteCandidateSelection();
        return;
    }

    helper.textContent = 'Buscando usuários elegíveis...';
    results.classList.remove('inativo');
    results.innerHTML = '<div class="invite-user-empty">Buscando usuários...</div>';

    try {
        const response = await groupService.buscarCandidatosConvite(state.groupId, {
            query,
            page: 0,
            size: 8
        });

        if (state.gestaoSubtab !== 'convites') {
            return;
        }

        renderInviteCandidateResults(response);
    } catch (err) {
        if (state.gestaoSubtab !== 'convites') {
            return;
        }

        results.classList.remove('inativo');
        results.innerHTML = '<div class="invite-user-empty">Não foi possível buscar usuários agora.</div>';
        helper.textContent = 'Erro ao buscar usuários elegíveis.';
        handleUiError(err, 'Não foi possível buscar usuários para convite.');
    }
}

function configurarBuscaCandidatosConvite() {
    const searchInput = document.getElementById('convite-user-search');
    const hiddenInput = document.getElementById('convite-user-id');
    const results = document.getElementById('convite-user-results');
    if (!searchInput || !hiddenInput || !results) return;
    if (searchInput.dataset.bound === 'true') return;

    searchInput.dataset.bound = 'true';

    searchInput.addEventListener('input', () => {
        hiddenInput.value = '';
        searchInviteCandidatesDebounced(searchInput.value);
    });

    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2) {
            searchInviteCandidatesDebounced(searchInput.value);
        }
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.invite-user-autocomplete')) {
            results.classList.add('inativo');
        }
    });
}

function formatarExpiracaoRelativa(dataStr) {
    if (!dataStr) return '';

    const expiresAt = new Date(dataStr);
    const expiresTime = expiresAt.getTime();
    if (!Number.isFinite(expiresTime)) return '';

    const diff = expiresTime - Date.now();
    if (diff <= 0) return 'expira hoje';

    const oneDayInMs = 1000 * 60 * 60 * 24;
    const remainingDays = Math.ceil(diff / oneDayInMs);

    if (remainingDays === 1) return 'expira em 1 dia';
    return `expira em ${remainingDays} dias`;
}

async function copyTextToClipboard(text) {
    if (!text) return false;

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (_) {
        // Falls back to legacy copy API when clipboard permission is unavailable.
    }

    try {
        const helper = document.createElement('textarea');
        helper.value = text;
        helper.setAttribute('readonly', '');
        helper.style.position = 'absolute';
        helper.style.left = '-9999px';
        document.body.appendChild(helper);
        helper.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(helper);
        return copied;
    } catch (_) {
        return false;
    }
}

function createEmptyState(title, subtitle = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'grupo-empty-state';
    wrapper.innerHTML = `
        <strong>${title}</strong>
        <span>${subtitle}</span>
    `;
    return wrapper;
}

function createMetaItem(label, value) {
    const item = document.createElement('div');
    item.className = 'grupo-meta-item';
    item.innerHTML = `
        <span>${label}</span>
        <strong>${value}</strong>
    `;
    return item;
}

function createCatalogEmptyState(title, subtitle = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'catalog-empty-state';
    wrapper.innerHTML = `
        <i class="fa-regular fa-folder-open"></i>
        <strong>${title}</strong>
        <span>${subtitle}</span>
    `;
    return wrapper;
}

function renderMovieSkeletons(container, count = 8) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeleton = document.createElement('article');
        skeleton.className = 'card-skeleton';
        container.appendChild(skeleton);
    }
}

function updateGridWithTransition(container, renderFn) {
    if (!container) {
        renderFn();
        return;
    }

    container.classList.add('catalog-grid-updating');
    requestAnimationFrame(() => {
        renderFn();
        requestAnimationFrame(() => container.classList.remove('catalog-grid-updating'));
    });
}

function normalizarDateTimeLocal(valor) {
    if (!valor) return null;
    return valor.length === 16 ? `${valor}:00` : valor;
}

function slugifyGroupName(value, maxLength = EDIT_GROUP_LIMITS.slug) {
    return (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, maxLength);
}

function gerarTagGrupo(value, maxLength = EDIT_GROUP_LIMITS.tag) {
    const sanitized = (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Za-z0-9_]/g, '')
        .toUpperCase();

    return sanitized.slice(0, maxLength);
}

function setEditFieldState(input, helper, { valid, message, checking = false }) {
    const isChecking = checking === true;

    if (input) {
        input.classList.toggle('is-valid', valid === true && !isChecking);
        input.classList.toggle('is-error', valid === false);
        input.classList.toggle('is-checking', isChecking);
    }

    if (helper) {
        helper.textContent = message;
        helper.classList.toggle('is-valid', valid === true && !isChecking);
        helper.classList.toggle('is-error', valid === false);
        helper.classList.toggle('is-checking', isChecking);
    }
}

function atualizarContadorCaracteres(inputId, counterId, maxLength) {
    const input = document.getElementById(inputId);
    const counter = document.getElementById(counterId);
    if (!input || !counter) return;

    const currentLength = input.value?.trim()?.length || 0;
    counter.textContent = `${currentLength}/${maxLength}`;
    counter.classList.toggle('is-near-limit', currentLength >= Math.max(maxLength - 2, 1) && currentLength < maxLength);
    counter.classList.toggle('is-at-limit', currentLength >= maxLength);
}

function atualizarContadoresEdicaoGrupo() {
    atualizarContadorCaracteres('edit-tag', 'edit-tag-counter', EDIT_GROUP_LIMITS.tag);
    atualizarContadorCaracteres('edit-slug', 'edit-slug-counter', EDIT_GROUP_LIMITS.slug);
}

function resetarEstadoDisponibilidadeEdicaoGrupo() {
    if (editGroupState.debounceId) {
        clearTimeout(editGroupState.debounceId);
        editGroupState.debounceId = null;
    }

    editGroupState.requestId = 0;
    editGroupState.availability.tag = createFieldAvailabilityState();
    editGroupState.availability.slug = createFieldAvailabilityState();
}

function atualizarEstadoDisponibilidadeEdicao(field, nextState) {
    editGroupState.availability[field] = {
        ...createFieldAvailabilityState(),
        ...editGroupState.availability[field],
        ...nextState
    };
}

function obterEstadoDisponibilidadeEdicao(field, currentValue) {
    const availabilityState = editGroupState.availability[field];
    if (availabilityState.value !== currentValue) {
        return createFieldAvailabilityState(currentValue);
    }

    return availabilityState;
}

function campoTagEdicaoValido(tag) {
    return EDIT_GROUP_PATTERNS.tag.test(tag);
}

function campoSlugEdicaoValido(slug) {
    return EDIT_GROUP_PATTERNS.slug.test(slug)
        && slug.length >= 4
        && slug.length <= EDIT_GROUP_LIMITS.slug;
}

function atualizarPreviewEdicaoGrupo() {
    if (!state.group) return;

    renderGroupPreviewCard(document.getElementById('edit-group-preview-card'), {
        name: document.getElementById('edit-nome')?.value?.trim(),
        tag: document.getElementById('edit-tag')?.value?.trim(),
        slug: document.getElementById('edit-slug')?.value?.trim(),
        visibility: document.getElementById('edit-visibility')?.value || 'PUBLIC',
        joinPolicy: document.getElementById('edit-join-policy')?.value || 'OPEN',
        ownerName: state.group.owner?.name || 'Você',
        membersCount: state.members.length || 1,
        accentLabel: 'Prévia da edição',
        accentIcon: 'fa-regular fa-pen-to-square',
        primaryActionLabel: 'Salvar alterações',
        secondaryActionLabel: 'Continuar editando'
    });
}

function validarFormularioEdicaoGrupo(forceFeedback = false) {
    const nameInput = document.getElementById('edit-nome');
    const tagInput = document.getElementById('edit-tag');
    const slugInput = document.getElementById('edit-slug');
    const submitButton = document.getElementById('btn-salvar-editar-grupo');

    const nameHelper = document.getElementById('edit-nome-helper');
    const tagHelper = document.getElementById('edit-tag-helper');
    const slugHelper = document.getElementById('edit-slug-helper');

    const name = nameInput?.value?.trim() || '';
    const tag = tagInput?.value?.trim() || '';
    const slug = slugInput?.value?.trim() || '';

    const nameValid = name.length >= 3;
    const tagValid = campoTagEdicaoValido(tag);
    const slugValid = campoSlugEdicaoValido(slug);

    const tagAvailability = obterEstadoDisponibilidadeEdicao('tag', tag);
    const slugAvailability = obterEstadoDisponibilidadeEdicao('slug', slug);

    const nameTouched = forceFeedback || Boolean(nameInput?.dataset.touched);
    const tagTouched = forceFeedback || Boolean(tagInput?.dataset.touched);
    const slugTouched = forceFeedback || Boolean(slugInput?.dataset.touched);

    setEditFieldState(nameInput, nameHelper, {
        valid: nameTouched ? nameValid : null,
        message: nameTouched
            ? (nameValid ? 'Nome válido.' : 'Use pelo menos 3 caracteres.')
            : 'Informe um nome claro para o grupo.'
    });

    setEditFieldState(tagInput, tagHelper, {
        valid: tagTouched
            ? (tagValid ? (tagAvailability.available === true ? true : (tagAvailability.available === false || tagAvailability.error ? false : null)) : false)
            : null,
        checking: tagTouched && tagValid && tagAvailability.checking,
        message: !tagTouched
            ? 'Use de 4 a 6 caracteres alfanuméricos ou _.'
            : !tagValid
                ? 'Use de 4 a 6 caracteres alfanuméricos ou _ em maiúsculo.'
                : tagAvailability.checking
                    ? 'Verificando disponibilidade real da tag...'
                    : tagAvailability.error
                        ? 'Não foi possível validar a tag agora. Tente novamente.'
                        : tagAvailability.available === false
                            ? 'Esta tag já está em uso por outro grupo.'
                            : tagAvailability.available === true
                                ? 'Tag disponível.'
                                : 'A tag será validada automaticamente.'
    });

    setEditFieldState(slugInput, slugHelper, {
        valid: slugTouched
            ? (slugValid ? (slugAvailability.available === true ? true : (slugAvailability.available === false || slugAvailability.error ? false : null)) : false)
            : null,
        checking: slugTouched && slugValid && slugAvailability.checking,
        message: !slugTouched
            ? 'Use 4 a 50 caracteres minúsculos, números e hífen.'
            : !slugValid
                ? 'Use 4 a 50 caracteres minúsculos, números e hífen sem espaços.'
                : slugAvailability.checking
                    ? 'Verificando disponibilidade real do slug...'
                    : slugAvailability.error
                        ? 'Não foi possível validar o slug agora. Tente novamente.'
                        : slugAvailability.available === false
                            ? 'Este slug já está em uso por outro grupo.'
                            : slugAvailability.available === true
                                ? 'Slug disponível.'
                                : 'O slug será validado automaticamente.'
    });

    const isValid = nameValid
        && tagValid
        && slugValid
        && tagAvailability.available === true
        && slugAvailability.available === true
        && !tagAvailability.checking
        && !slugAvailability.checking
        && !tagAvailability.error
        && !slugAvailability.error;

    if (submitButton) submitButton.disabled = !isValid;

    atualizarContadoresEdicaoGrupo();
    atualizarPreviewEdicaoGrupo();
    return isValid;
}

async function validarDisponibilidadeEdicaoGrupoAgora() {
    const tag = document.getElementById('edit-tag')?.value?.trim() || '';
    const slug = document.getElementById('edit-slug')?.value?.trim() || '';
    const tagValido = campoTagEdicaoValido(tag);
    const slugValido = campoSlugEdicaoValido(slug);

    if (!tagValido && !slugValido) {
        validarFormularioEdicaoGrupo(true);
        return { tagAvailable: false, slugAvailable: false };
    }

    if (tagValido) {
        atualizarEstadoDisponibilidadeEdicao('tag', { value: tag, checking: true, error: false, available: null });
    }

    if (slugValido) {
        atualizarEstadoDisponibilidadeEdicao('slug', { value: slug, checking: true, error: false, available: null });
    }

    validarFormularioEdicaoGrupo(true);

    try {
        const response = await groupService.buscarDisponibilidadeGrupo({
            tag: tagValido ? tag : null,
            slug: slugValido ? slug : null,
            excludeGroupId: state.groupId
        });

        if (tagValido) {
            atualizarEstadoDisponibilidadeEdicao('tag', {
                value: response?.tag?.value || tag,
                available: response?.tag?.available === true,
                checking: false,
                error: false
            });
        }

        if (slugValido) {
            atualizarEstadoDisponibilidadeEdicao('slug', {
                value: response?.slug?.value || slug,
                available: response?.slug?.available === true,
                checking: false,
                error: false
            });
        }

        validarFormularioEdicaoGrupo(true);
        return {
            tagAvailable: !tagValido || response?.tag?.available === true,
            slugAvailable: !slugValido || response?.slug?.available === true
        };
    } catch (err) {
        if (tagValido) {
            atualizarEstadoDisponibilidadeEdicao('tag', { value: tag, available: null, checking: false, error: true });
        }

        if (slugValido) {
            atualizarEstadoDisponibilidadeEdicao('slug', { value: slug, available: null, checking: false, error: true });
        }

        validarFormularioEdicaoGrupo(true);
        throw err;
    }
}

function agendarValidacaoDisponibilidadeEdicaoGrupo() {
    if (editGroupState.debounceId) {
        clearTimeout(editGroupState.debounceId);
        editGroupState.debounceId = null;
    }

    const tag = document.getElementById('edit-tag')?.value?.trim() || '';
    const slug = document.getElementById('edit-slug')?.value?.trim() || '';
    const tagValido = campoTagEdicaoValido(tag);
    const slugValido = campoSlugEdicaoValido(slug);

    if (!tagValido) {
        editGroupState.availability.tag = createFieldAvailabilityState(tag);
    }

    if (!slugValido) {
        editGroupState.availability.slug = createFieldAvailabilityState(slug);
    }

    const tagState = obterEstadoDisponibilidadeEdicao('tag', tag);
    const slugState = obterEstadoDisponibilidadeEdicao('slug', slug);

    const shouldCheckTag = tagValido && !tagState.checking && (tagState.available === null || tagState.error);
    const shouldCheckSlug = slugValido && !slugState.checking && (slugState.available === null || slugState.error);

    validarFormularioEdicaoGrupo();

    if (!shouldCheckTag && !shouldCheckSlug) {
        return;
    }

    if (shouldCheckTag) {
        atualizarEstadoDisponibilidadeEdicao('tag', { value: tag, checking: true, error: false, available: null });
    }

    if (shouldCheckSlug) {
        atualizarEstadoDisponibilidadeEdicao('slug', { value: slug, checking: true, error: false, available: null });
    }

    validarFormularioEdicaoGrupo();

    const requestId = ++editGroupState.requestId;
    editGroupState.debounceId = window.setTimeout(async () => {
        try {
            const response = await groupService.buscarDisponibilidadeGrupo({
                tag: shouldCheckTag ? tag : null,
                slug: shouldCheckSlug ? slug : null,
                excludeGroupId: state.groupId
            });

            if (requestId !== editGroupState.requestId) {
                return;
            }

            const currentTag = document.getElementById('edit-tag')?.value?.trim() || '';
            const currentSlug = document.getElementById('edit-slug')?.value?.trim() || '';

            if (shouldCheckTag && currentTag === tag) {
                atualizarEstadoDisponibilidadeEdicao('tag', {
                    value: response?.tag?.value || tag,
                    available: response?.tag?.available === true,
                    checking: false,
                    error: false
                });
            }

            if (shouldCheckSlug && currentSlug === slug) {
                atualizarEstadoDisponibilidadeEdicao('slug', {
                    value: response?.slug?.value || slug,
                    available: response?.slug?.available === true,
                    checking: false,
                    error: false
                });
            }
        } catch (_) {
            if (requestId !== editGroupState.requestId) {
                return;
            }

            const currentTag = document.getElementById('edit-tag')?.value?.trim() || '';
            const currentSlug = document.getElementById('edit-slug')?.value?.trim() || '';

            if (shouldCheckTag && currentTag === tag) {
                atualizarEstadoDisponibilidadeEdicao('tag', { value: tag, available: null, checking: false, error: true });
            }

            if (shouldCheckSlug && currentSlug === slug) {
                atualizarEstadoDisponibilidadeEdicao('slug', { value: slug, available: null, checking: false, error: true });
            }
        } finally {
            if (requestId === editGroupState.requestId) {
                validarFormularioEdicaoGrupo();
            }
        }
    }, 320);
}

function abrirModal(modal) {
    if (!modal) return;

    const closeTimer = modalCloseTimers.get(modal.id);
    if (closeTimer) {
        clearTimeout(closeTimer);
        modalCloseTimers.delete(modal.id);
    }

    modal.classList.remove('inativo', 'fechando');
    window.requestAnimationFrame(() => {
        modal.classList.add('ativo');
    });
}

function fecharModal(modal) {
    if (!modal) return;

    const closeTimer = modalCloseTimers.get(modal.id);
    if (closeTimer) {
        clearTimeout(closeTimer);
    }

    modal.classList.remove('ativo');
    modal.classList.add('fechando');

    const timerId = window.setTimeout(() => {
        modal.classList.remove('fechando');
        modal.classList.add('inativo');
        modalCloseTimers.delete(modal.id);
    }, 240);

    modalCloseTimers.set(modal.id, timerId);

    if (modal.id === 'modal-banir-membro' || modal.id === 'modal-expulsar-membro') {
        state.memberTarget = null;
    }

    if (modal.id === 'modal-voto-grupo') {
        state.voteTypeTarget = null;
    }
}

function atualizarHeroAcoes() {
    const container = document.getElementById('grupo-hero-acoes');
    if (!container || !state.group) return;

    container.innerHTML = '';

    const actionPrimary = document.createElement('button');
    actionPrimary.type = 'button';
    actionPrimary.className = 'grupo-btn-primary';

    if (isCurrentGroupSelected()) {
        actionPrimary.innerHTML = '<i class="fa-solid fa-house"></i> Acessar grupo';
        actionPrimary.addEventListener('click', () => {
            window.location.href = './catalogo.html';
        });
    } else {
        actionPrimary.innerHTML = '<i class="fa-solid fa-star"></i> Selecionar e acessar';
        actionPrimary.addEventListener('click', async () => {
            try {
                await groupService.definirGrupoPadrao(state.group.id);
                state.currentGroup = await loadCurrentGroup();
                setFlashMessage(`Grupo "${state.group.name}" definido como grupo atual.`, 'SUCCESS');
                window.location.href = './catalogo.html';
            } catch (err) {
                handleUiError(err, 'Não foi possível selecionar este grupo.');
            }
        });
    }

    container.appendChild(actionPrimary);

    if (!isCurrentGroupSelected()) {
        const secondary = document.createElement('button');
        secondary.type = 'button';
        secondary.className = 'grupo-btn-secondary';
        secondary.innerHTML = '<i class="fa-regular fa-star"></i> Somente selecionar';
        secondary.addEventListener('click', async () => {
            try {
                await groupService.definirGrupoPadrao(state.group.id);
                state.currentGroup = await loadCurrentGroup();
                setFlashMessage(`Grupo "${state.group.name}" definido como grupo atual.`, 'SUCCESS');
                window.location.reload();
            } catch (err) {
                handleUiError(err, 'Não foi possível selecionar este grupo.');
            }
        });
        container.appendChild(secondary);
    }

    // Botão para sair do grupo (somente para membros que não são donos)
    const isOwner = state.permissions?.role === 'OWNER';
    if (!isOwner && state.permissions?.role) {
        const leaveButton = document.createElement('button');
        leaveButton.type = 'button';
        leaveButton.className = 'grupo-btn-secondary grupo-btn-danger';
        leaveButton.innerHTML = '<i class="fa-solid fa-right-from-bracket"></i> Sair do grupo';
        leaveButton.addEventListener('click', async () => {
            const confirmar = confirm(`Tem certeza que deseja sair do grupo "${state.group.name}"?`);
            if (!confirmar) return;

            try {
                await groupService.sairDoGrupo(state.group.id);
                setFlashMessage(`Você saiu do grupo "${state.group.name}".`, 'INFO');
                window.location.href = './meus-grupos.html';
            } catch (err) {
                handleUiError(err, 'Não foi possível sair do grupo.');
            }
        });
        container.appendChild(leaveButton);
    }

    if (state.permissions?.canManage) {
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'grupo-btn-secondary';
        editButton.innerHTML = '<i class="fa-regular fa-pen-to-square"></i> Editar grupo';
        editButton.addEventListener('click', () => {
            preencherFormularioEdicao();
            abrirModal(document.getElementById('modal-editar-grupo'));
        });
        container.appendChild(editButton);

        if (state.permissions?.canTransferOwnership) {
            const transferButton = document.createElement('button');
            transferButton.type = 'button';
            transferButton.className = 'grupo-btn-secondary';
            transferButton.innerHTML = '<i class="fa-solid fa-crown"></i> Transferir ownership';
            transferButton.addEventListener('click', () => {
                preencherFormularioTransferenciaOwner();
                abrirModal(document.getElementById('modal-transferir-owner'));
            });
            container.appendChild(transferButton);

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'grupo-btn-secondary grupo-btn-danger';
            deleteButton.innerHTML = '<i class="fa-regular fa-trash-can"></i> Excluir grupo';
            deleteButton.addEventListener('click', async () => {
                const confirmar = confirm(`Tem certeza que deseja excluir o grupo "${state.group.name}"? Esta ação desativa o grupo e remove o acesso dos membros.`);
                if (!confirmar) return;

                try {
                    await groupService.excluirGrupo(state.group.id);
                    setFlashMessage(`Grupo "${state.group.name}" excluído com sucesso.`, 'SUCCESS');
                    window.location.href = './meus-grupos.html';
                } catch (err) {
                    handleUiError(err, 'Não foi possível excluir este grupo.');
                }
            });
            container.appendChild(deleteButton);
        }
    }
}

function renderHero() {
    if (!state.group) return;

    const tag = document.getElementById('grupo-tag');
    const nome = document.getElementById('grupo-nome');
    const badges = document.getElementById('grupo-badges');
    const meta = document.getElementById('grupo-meta');

    if (tag) tag.textContent = `#${state.group.tag || 'grupo'}`;
    if (nome) nome.textContent = state.group.name || 'Grupo';

    if (badges) {
        const roleMeta = getRoleMeta(state.permissions?.role);
        badges.innerHTML = `
            <span class="grupo-badge ${roleMeta.css}">
                <i class="${roleMeta.icon}"></i>
                ${roleMeta.label}
            </span>
            <span class="grupo-badge role-member">
                <i class="fa-solid fa-eye"></i>
                ${getVisibilityLabel(state.group.visibility)}
            </span>
            <span class="grupo-badge role-member">
                <i class="fa-solid fa-door-open"></i>
                ${getJoinPolicyLabel(state.group.joinPolicy)}
            </span>
            ${isCurrentGroupSelected() ? `
                <span class="grupo-badge is-selected">
                    <i class="fa-solid fa-star"></i>
                    Grupo atual
                </span>
            ` : ''}
            ${state.group.banned ? `
                <span class="grupo-badge is-banned">
                    <i class="fa-solid fa-ban"></i>
                    Banido
                </span>
            ` : ''}
        `;
    }

    if (meta) {
        meta.innerHTML = '';
        meta.appendChild(createMetaItem('Dono', state.group.owner?.name || '—'));
        meta.appendChild(createMetaItem('Membros', state.members.length));
        meta.appendChild(createMetaItem('Filmes', state.movies.length));
        meta.appendChild(createMetaItem('Slug', state.group.slug || '—'));
        meta.appendChild(createMetaItem('Criado em', formatarDataExtenso(state.group.createdAt) || formatarData(state.group.createdAt)));
        meta.appendChild(createMetaItem('Troca de voto', `${state.group.voteChangeDeadlineDays ?? 0} dia(s)`));
    }

    atualizarHeroAcoes();
}

function createMovieCard(movie) {
    const movieNewDays = Number(state.group?.movieNewDays ?? state.currentGroup?.movieNewDays);
    return criarFigure(movie, state.usuario || {}, {
        movieNewDays: Number.isFinite(movieNewDays) ? movieNewDays : null,
        groupId: state.groupId
    });
}

function popularFiltroUsuariosFilmesGrupo() {
    const select = document.getElementById('grupo-filtro-usuario');
    if (!select) return;

    const valorAtual = select.value;
    select.innerHTML = '<option value="">Todos</option>';

    const usersMap = new Map();
    state.movies.forEach(movie => {
        const chooser = movie.chooser;
        if (chooser?.id && !usersMap.has(chooser.id)) {
            usersMap.set(chooser.id, chooser.name || `Usuário ${chooser.id}`);
        }
    });

    [...usersMap.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR', { sensitivity: 'base' }))
        .forEach(([userId, name]) => {
            const option = document.createElement('option');
            option.value = String(userId);
            option.textContent = name;
            select.appendChild(option);
        });

    if (valorAtual) select.value = valorAtual;
}

function popularFiltroVotosFilmesGrupo() {
    const select = document.getElementById('grupo-filtro-voto');
    if (!select) return;

    const valorAtual = select.value;
    select.innerHTML = '<option value="">Todos</option>';

    const votesMap = new Map();
    [...state.groupVotes, ...state.globalVotes].forEach(vote => {
        if (vote?.id && !votesMap.has(vote.id)) {
            votesMap.set(vote.id, vote.description || vote.name || `Voto ${vote.id}`);
        }
    });

    [...votesMap.entries()].forEach(([id, description]) => {
        const option = document.createElement('option');
        option.value = String(id);
        option.textContent = description;
        select.appendChild(option);
    });

    if (valorAtual) select.value = valorAtual;
}

function popularFiltroGenerosFilmesGrupo() {
    const select = document.getElementById('grupo-filtro-genero');
    if (!select) return;

    const valorAtual = select.value;
    select.innerHTML = '<option value="">Todos</option>';

    const genresMap = new Map();
    state.movies.forEach(movie => {
        (movie.genres || []).forEach(genre => {
            if (genre?.id && !genresMap.has(genre.id)) {
                genresMap.set(genre.id, genre.name || `Gênero ${genre.id}`);
            }
        });
    });

    [...genresMap.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR', { sensitivity: 'base' }))
        .forEach(([id, name]) => {
            const option = document.createElement('option');
            option.value = String(id);
            option.textContent = name;
            select.appendChild(option);
        });

    if (valorAtual) select.value = valorAtual;
}

function filtrarEOrdenarFilmesGrupo() {
    const ordenarPor = document.getElementById('grupo-ordenar-por')?.value || 'dateAdded';
    const ordenarDirecao = document.getElementById('grupo-ordenar-direcao')?.dataset.direction || 'desc';
    const filtroUsuario = document.getElementById('grupo-filtro-usuario')?.value || '';
    const filtroVoto = document.getElementById('grupo-filtro-voto')?.value || '';
    const filtroGenero = document.getElementById('grupo-filtro-genero')?.value || '';
    const buscaTitulo = document.getElementById('grupo-buscar-titulo')?.value?.trim()?.toLowerCase() || '';

    let movies = [...state.movies];

    if (filtroUsuario) {
        movies = movies.filter(movie => Number(movie?.chooser?.id) === Number(filtroUsuario));
    }

    if (filtroVoto) {
        movies = movies.filter(movie => movie.votes?.some(vote => vote.vote?.id === Number(filtroVoto)));
    }

    if (filtroGenero) {
        movies = movies.filter(movie => movie.genres?.some(genre => genre.id === Number(filtroGenero)));
    }

    if (buscaTitulo) {
        movies = movies.filter(movie => (movie.title || '').toLowerCase().includes(buscaTitulo));
    }

    const direction = ordenarDirecao === 'asc' ? 1 : -1;
    movies.sort((a, b) => {
        let comparison;

        if (ordenarPor === 'title') {
            comparison = (a.title || '').localeCompare(b.title || '', 'pt-BR', { sensitivity: 'base' });
        } else if (ordenarPor === 'chooser.name') {
            comparison = (a.chooser?.name || '').localeCompare(b.chooser?.name || '', 'pt-BR', { sensitivity: 'base' });
        } else {
            comparison = new Date(a.dateAdded || 0).getTime() - new Date(b.dateAdded || 0).getTime();
        }

        return comparison * direction;
    });

    return movies;
}

function atualizarResumoFiltrosFilmesGrupo(totalResultados) {
    const el = document.getElementById('grupo-filtro-resultados');
    if (!el) return;

    const total = Number(totalResultados) || 0;
    el.textContent = `${total} ${total === 1 ? 'resultado' : 'resultados'}`;
}

function limparFiltrosFilmesGrupo() {
    const ordenarPor = document.getElementById('grupo-ordenar-por');
    const ordenarDirecao = document.getElementById('grupo-ordenar-direcao');
    const textoDirecao = document.getElementById('grupo-texto-direcao');
    const filtroUsuario = document.getElementById('grupo-filtro-usuario');
    const filtroVoto = document.getElementById('grupo-filtro-voto');
    const filtroGenero = document.getElementById('grupo-filtro-genero');
    const filmesSize = document.getElementById('grupo-filmes-size');
    const buscarTitulo = document.getElementById('grupo-buscar-titulo');

    if (ordenarPor) ordenarPor.value = 'dateAdded';
    if (ordenarDirecao) ordenarDirecao.dataset.direction = 'desc';
    if (textoDirecao) textoDirecao.textContent = 'Z - A';
    if (filtroUsuario) filtroUsuario.value = '';
    if (filtroVoto) filtroVoto.value = '';
    if (filtroGenero) filtroGenero.value = '';
    if (filmesSize) filmesSize.value = '20';
    if (buscarTitulo) buscarTitulo.value = '';

    atualizarFilmesGrupo(0);
}

function criarPaginacaoFilmesGrupo(totalPages, currentPage) {
    const container = document.getElementById('grupo-filmes-paginacao');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 0; i < totalPages; i++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn-pagina';
        button.textContent = String(i + 1);
        button.disabled = i === currentPage;
        button.addEventListener('click', () => atualizarFilmesGrupo(i));
        container.appendChild(button);
    }
}

function atualizarFilmesGrupo(page = 0) {
    const container = document.getElementById('filmes-lista');
    const paginacao = document.getElementById('grupo-filmes-paginacao');
    if (!container) return;

    const size = Number(document.getElementById('grupo-filmes-size')?.value) || 20;
    const filteredMovies = filtrarEOrdenarFilmesGrupo();

    if (!filteredMovies.length) {
        updateGridWithTransition(container, () => {
            container.innerHTML = '';
            container.appendChild(createCatalogEmptyState(
                'Nenhum filme encontrado para os filtros atuais',
                'Ajuste os filtros para visualizar mais resultados.'
            ));
        });
        if (paginacao) paginacao.innerHTML = '';
        atualizarResumoFiltrosFilmesGrupo(0);
        return;
    }

    const totalPages = Math.ceil(filteredMovies.length / size);
    const currentPage = Math.min(page, Math.max(totalPages - 1, 0));
    const start = currentPage * size;
    const moviesOnPage = filteredMovies.slice(start, start + size);

    updateGridWithTransition(container, () => {
        container.innerHTML = '';
        moviesOnPage.forEach(movie => container.appendChild(createMovieCard(movie)));
    });
    criarPaginacaoFilmesGrupo(totalPages, currentPage);
    atualizarResumoFiltrosFilmesGrupo(filteredMovies.length);
}

function renderMovies() {
    const container = document.getElementById('filmes-lista');
    const paginacao = document.getElementById('grupo-filmes-paginacao');
    if (!container) return;

    popularFiltroUsuariosFilmesGrupo();
    popularFiltroVotosFilmesGrupo();
    popularFiltroGenerosFilmesGrupo();

    if (!state.movies.length) {
        container.innerHTML = '';
        container.appendChild(createCatalogEmptyState(
            'Este grupo ainda não possui filmes',
            'Quando novos filmes forem adicionados, eles aparecerão aqui.'
        ));
        if (paginacao) paginacao.innerHTML = '';
        atualizarResumoFiltrosFilmesGrupo(0);
        return;
    }

    atualizarFilmesGrupo(0);
}

function configurarFiltroFilmesGrupo() {
    const ordenarPor = document.getElementById('grupo-ordenar-por');
    const ordenarDirecaoWrap = document.getElementById('grupo-ordenacao-direcao-wrap');
    const ordenarDirecao = document.getElementById('grupo-ordenar-direcao');
    const textoDirecao = document.getElementById('grupo-texto-direcao');
    const filtroUsuario = document.getElementById('grupo-filtro-usuario');
    const filtroVoto = document.getElementById('grupo-filtro-voto');
    const filtroGenero = document.getElementById('grupo-filtro-genero');
    const filmesSize = document.getElementById('grupo-filmes-size');
    const buscarTitulo = document.getElementById('grupo-buscar-titulo');
    const limparFiltrosButton = document.getElementById('grupo-limpar-filtros');

    if (!ordenarPor || !ordenarDirecaoWrap || !ordenarDirecao || !textoDirecao) return;
    if (ordenarDirecao.dataset.bound === 'true') return;

    ordenarDirecao.dataset.bound = 'true';

    ordenarPor.addEventListener('change', () => atualizarFilmesGrupo(0));
    filtroUsuario?.addEventListener('change', () => atualizarFilmesGrupo(0));
    filtroVoto?.addEventListener('change', () => atualizarFilmesGrupo(0));
    filtroGenero?.addEventListener('change', () => atualizarFilmesGrupo(0));
    filmesSize?.addEventListener('change', () => atualizarFilmesGrupo(0));
    buscarTitulo?.addEventListener('input', debounce(() => atualizarFilmesGrupo(0), 260));
    limparFiltrosButton?.addEventListener('click', limparFiltrosFilmesGrupo);

    ordenarDirecaoWrap.addEventListener('click', () => {
        const novaDirecao = ordenarDirecao.dataset.direction === 'asc' ? 'desc' : 'asc';
        ordenarDirecao.dataset.direction = novaDirecao;
        textoDirecao.textContent = novaDirecao === 'asc' ? 'A - Z' : 'Z - A';

        ordenarDirecaoWrap.classList.add('ativo');
        setTimeout(() => ordenarDirecaoWrap.classList.remove('ativo'), 200);

        atualizarFilmesGrupo(0);
    });
}

function createVoteTypeCard(voteType, { isGlobal }) {
    const card = document.createElement('article');
    card.className = 'gestao-item-card';

    card.innerHTML = `
        <div class="gestao-item-info">
            <strong>${voteType.emoji || '⭐'} ${voteType.name}</strong>
            <span>${voteType.description}</span>
            <span>Cor: ${voteType.color || '#9810FA'}</span>
        </div>
        <div class="gestao-item-acoes"></div>
    `;

    const actions = card.querySelector('.gestao-item-acoes');

    if (isGlobal) {
        const badge = document.createElement('span');
        badge.className = 'grupo-badge role-member';
        badge.innerHTML = '<i class="fa-solid fa-earth-americas"></i> Global';
        actions.appendChild(badge);
        return card;
    }

    if (state.permissions?.canManage) {
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'btn-membro-action';
        editButton.innerHTML = '<i class="fa-regular fa-pen-to-square"></i> Editar';
        editButton.addEventListener('click', () => abrirModalVotoGrupo(voteType));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn-membro-action danger-light';
        deleteButton.innerHTML = '<i class="fa-regular fa-trash-can"></i> Excluir';
        deleteButton.addEventListener('click', async () => {
            const confirmar = confirm(`Excluir o voto "${voteType.name}"?`);
            if (!confirmar) return;

            try {
                await votoService.excluirTipoVotoDoGrupo(state.groupId, voteType.id);
                criarMensagem(`Voto "${voteType.name}" excluído com sucesso.`, MensagemTipo.SUCCESS);
                await carregarPagina();
            } catch (err) {
                handleUiError(err, 'Não foi possível excluir este voto do grupo.');
            }
        });

        actions.append(editButton, deleteButton);
    }

    return card;
}

function renderVotesTab() {
    const groupContainer = document.getElementById('votos-grupo-lista');
    const globalContainer = document.getElementById('votos-globais-lista');
    const createButton = document.getElementById('btn-novo-voto-grupo');

    if (!groupContainer || !globalContainer || !createButton) return;

    createButton.style.display = state.permissions?.canManage ? 'inline-flex' : 'none';

    groupContainer.innerHTML = '';
    if (!state.groupVotes.length) {
        groupContainer.appendChild(criarCardGestaoVazio('Nenhum tipo de voto cadastrado para este grupo.'));
    } else {
        state.groupVotes.forEach(voteType => {
            groupContainer.appendChild(createVoteTypeCard(voteType, { isGlobal: false }));
        });
    }

    globalContainer.innerHTML = '';
    if (!state.globalVotes.length) {
        globalContainer.appendChild(criarCardGestaoVazio('Nenhum tipo de voto global ativo disponível.'));
    } else {
        state.globalVotes.forEach(voteType => {
            globalContainer.appendChild(createVoteTypeCard(voteType, { isGlobal: true }));
        });
    }
}

function getGroupRankingVoteTotal(stats, voteTypeId) {
    return Number(stats?.votes?.find(v => Number(v?.type?.id) === Number(voteTypeId))?.totalVotes || 0);
}

function getRoleLabelForRanking(userId) {
    const role = state.members.find(member => Number(member?.member?.id) === Number(userId))?.role || 'MEMBER';
    if (role === 'OWNER') return 'Dono';
    if (role === 'ADMIN') return 'Admin';
    return 'Membro';
}

function sortGroupRanking(stats, voteTypeId) {
    return [...stats].sort((a, b) => {
        const diff = getGroupRankingVoteTotal(b, voteTypeId) - getGroupRankingVoteTotal(a, voteTypeId);
        if (diff !== 0) return diff;
        return (a?.user?.name || '').localeCompare(b?.user?.name || '', 'pt-BR', { sensitivity: 'base' });
    });
}

function createGroupRankingPosition(position) {
    const container = document.createElement('div');
    container.className = 'posicao ranking-position';

    const content = document.createElement('span');
    if (position === 1) {
        container.classList.add('primeiro');
        content.textContent = '🥇';
    } else if (position === 2) {
        container.classList.add('segundo');
        content.textContent = '🥈';
    } else if (position === 3) {
        container.classList.add('terceiro');
        content.textContent = '🥉';
    } else {
        container.classList.add('sem-medalha');
        content.textContent = `#${position}`;
    }

    container.appendChild(content);
    return container;
}

function renderRankingResumoRecebidos() {
    const container = document.getElementById('grupo-ranking-resumo');
    if (!container) return;

    container.innerHTML = '';
    if (!state.rankingVoteTypes.length) return;

    const resumo = document.createElement('div');
    resumo.className = 'resumo-vencedores';

    state.rankingVoteTypes.forEach(voteType => {
        const ordenados = sortGroupRanking(state.rankingSummaryStats, voteType.id);
        const vencedor = ordenados[0];
        const total = vencedor ? getGroupRankingVoteTotal(vencedor, voteType.id) : 0;

        const item = document.createElement('div');
        item.className = 'resumo-item';

        const emoji = document.createElement('i');
        emoji.textContent = voteType.emoji || '⭐';

        const texto = document.createElement('span');
        texto.textContent = total > 0 && vencedor
            ? `${vencedor?.user?.name || 'Usuário'} (${total} votos)`
            : 'Sem votos ainda';

        item.append(emoji, texto);
        resumo.appendChild(item);
    });

    container.appendChild(resumo);
}

function renderRankingCardsRecebidos() {
    const container = document.getElementById('grupo-ranking-cards');
    if (!container) return;

    container.innerHTML = '';

    const voteType = state.rankingVoteTypes.find(v => Number(v.id) === Number(state.rankingSelectedVoteTypeId));
    if (!voteType) {
        container.innerHTML = '<p class="fonte-secundaria">Nenhum tipo de voto disponível para este grupo.</p>';
        return;
    }

    const sorted = sortGroupRanking(state.rankingStats, voteType.id);
    const hasAnyVotes = sorted.some(item => getGroupRankingVoteTotal(item, voteType.id) > 0);
    if (!hasAnyVotes) {
        container.innerHTML = '<p class="fonte-secundaria">Ainda não há votos recebidos para este filtro.</p>';
        return;
    }

    const maxVisible = 10;
    const visible = sorted.slice(0, maxVisible);
    const loggedIndex = sorted.findIndex(item => Number(item?.user?.id) === Number(state.usuario?.id));
    if (loggedIndex >= maxVisible) {
        visible.push(sorted[loggedIndex]);
    }

    visible.forEach(item => {
        const rankPosition = sorted.findIndex(row => Number(row?.user?.id) === Number(item?.user?.id)) + 1;
        const isCurrentUserCard = Number(item?.user?.id) === Number(state.usuario?.id);
        const totalVotes = getGroupRankingVoteTotal(item, voteType.id);

        const card = document.createElement('article');
        card.className = `card-ranking${isCurrentUserCard ? ' voce' : ''}`;

        const parte1 = document.createElement('div');
        parte1.className = 'parte-1';

        const avatarWrap = document.createElement('div');
        avatarWrap.className = 'usuario-avatar ranking-avatar';
        const avatar = document.createElement('img');
        avatar.src = item?.user?.avatar || './assets/img/placeholder-avatar.png';
        avatar.alt = `Avatar de ${item?.user?.name || 'usuário'}`;
        avatar.addEventListener('error', () => {
            avatar.src = './assets/img/placeholder-avatar.png';
        }, { once: true });
        avatarWrap.appendChild(avatar);

        const infoUsuario = document.createElement('div');
        infoUsuario.className = 'usuario-info ranking-info';
        const linhaUsuario = document.createElement('div');
        linhaUsuario.className = 'usuario';
        const nome = document.createElement('h3');
        nome.textContent = item?.user?.name || 'Usuário';
        linhaUsuario.appendChild(nome);
        if (isCurrentUserCard) {
            const badge = document.createElement('span');
            badge.className = 'badge-voce';
            badge.textContent = 'Você';
            linhaUsuario.appendChild(badge);
        }
        const cargo = document.createElement('p');
        cargo.textContent = `Cargo no grupo: ${getRoleLabelForRanking(item?.user?.id)}`;
        infoUsuario.append(linhaUsuario, cargo);

        const infoTotal = document.createElement('div');
        infoTotal.className = 'info';
        const valor = document.createElement('div');
        valor.textContent = String(totalVotes);
        const descricao = document.createElement('p');
        descricao.className = 'fonte-secundaria';
        descricao.textContent = voteType.description || voteType.name || 'Votos';
        infoTotal.append(valor, descricao);

        parte1.append(createGroupRankingPosition(rankPosition), avatarWrap, infoUsuario, infoTotal);

        const separator = document.createElement('div');
        separator.className = 'separador';

        const votosGrid = document.createElement('div');
        votosGrid.className = 'votos';
        state.rankingVoteTypes.forEach(type => {
            const voto = document.createElement('div');
            voto.className = 'voto';

            const votoInfo = document.createElement('div');
            votoInfo.className = 'voto-info';
            const emoji = document.createElement('i');
            emoji.textContent = type.emoji || '⭐';
            const total = document.createElement('p');
            total.textContent = String(getGroupRankingVoteTotal(item, type.id));
            votoInfo.append(emoji, total);

            const label = document.createElement('p');
            label.textContent = type.description || type.name || 'Voto';
            voto.append(votoInfo, label);

            votosGrid.appendChild(voto);
        });

        card.append(parte1, separator, votosGrid);
        container.appendChild(card);
    });
}

async function carregarRankingRecebidosSelecionado() {
    if (!state.rankingSelectedVoteTypeId) {
        state.rankingStats = [];
        renderRankingCardsRecebidos();
        return;
    }

    try {
        state.rankingStats = await votoService.buscarRankingVotosRecebidosGrupo(
            state.groupId,
            state.rankingSelectedVoteTypeId
        );
    } catch (err) {
        state.rankingStats = [];
        handleUiError(err, 'Não foi possível atualizar o ranking de votos recebidos.');
    }

    renderRankingCardsRecebidos();
}

function renderRankingRecebidos() {
    const filtrosContainer = document.getElementById('grupo-ranking-filtros-voto');
    if (!filtrosContainer) return;

    filtrosContainer.innerHTML = '';

    state.rankingVoteTypes.forEach(voteType => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `filtro${Number(voteType.id) === Number(state.rankingSelectedVoteTypeId) ? ' ativo' : ''}`;
        button.style.backgroundColor = voteType.color || '#9810FA';

        const emoji = document.createElement('i');
        emoji.textContent = voteType.emoji || '⭐';
        const texto = document.createElement('span');
        texto.textContent = voteType.description || voteType.name || 'Voto';
        button.append(emoji, texto);

        button.addEventListener('click', async () => {
            if (Number(state.rankingSelectedVoteTypeId) === Number(voteType.id)) return;
            state.rankingSelectedVoteTypeId = Number(voteType.id);
            renderRankingRecebidos();
            await carregarRankingRecebidosSelecionado();
        });

        filtrosContainer.appendChild(button);
    });

    renderRankingResumoRecebidos();
    renderRankingCardsRecebidos();
}

function configurarRankingRecebidosTab() {
    renderRankingRecebidos();
}

function buildMemberActions(member) {
    const actions = document.createElement('div');
    actions.className = 'membro-card-actions';

    if (canChangeRole(member)) {
        const roleButton = document.createElement('button');
        roleButton.type = 'button';
        roleButton.className = 'btn-membro-action';

        if (member.role === 'MEMBER') {
            roleButton.innerHTML = '<i class="fa-solid fa-shield"></i> Promover';
            roleButton.addEventListener('click', async () => {
                try {
                    await groupService.promoverParaAdmin(state.groupId, member.member.id);
                    criarMensagem(`"${member.member.name}" promovido para admin.`, MensagemTipo.SUCCESS);
                    await carregarPagina();
                } catch (err) {
                    handleUiError(err, 'Não foi possível promover este membro.');
                }
            });
        } else if (member.role === 'ADMIN') {
            roleButton.innerHTML = '<i class="fa-regular fa-user"></i> Rebaixar';
            roleButton.addEventListener('click', async () => {
                try {
                    await groupService.rebaixarParaMembro(state.groupId, member.member.id);
                    criarMensagem(`"${member.member.name}" rebaixado para membro.`, MensagemTipo.SUCCESS);
                    await carregarPagina();
                } catch (err) {
                    handleUiError(err, 'Não foi possível rebaixar este membro.');
                }
            });
        }

        if (roleButton.innerHTML) {
            actions.appendChild(roleButton);
        }
    }

    if (canManageMember(member)) {
        const banButton = document.createElement('button');
        banButton.type = 'button';
        banButton.className = 'btn-membro-action danger-light';
        banButton.innerHTML = '<i class="fa-solid fa-ban"></i> Banir';
        banButton.addEventListener('click', () => abrirModalBanimento(member));

        const expelButton = document.createElement('button');
        expelButton.type = 'button';
        expelButton.className = 'btn-membro-action danger';
        expelButton.innerHTML = '<i class="fa-solid fa-user-slash"></i> Expulsar';
        expelButton.addEventListener('click', () => abrirModalExpulsao(member));

        actions.append(banButton, expelButton);
    }

    return actions;
}

function renderMembers() {
    const container = document.getElementById('membros-lista');
    if (!container) return;

    container.innerHTML = '';

    if (!state.members.length) {
        container.appendChild(createEmptyState(
            'Nenhum membro encontrado.',
            'Este grupo ainda não possui membros ativos para exibir.'
        ));
        return;
    }

    const groupedMembers = groupMembersByRole(state.members);
    const roleOrder = ['OWNER', 'ADMIN', 'MEMBER'];

    roleOrder.forEach(role => {
        const members = groupedMembers[role];
        if (!members.length) return;

        const section = document.createElement('section');
        section.className = 'membros-role-section';

        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'membros-role-header';
        sectionHeader.innerHTML = `
            <h3>${getRoleSectionLabel(role)}</h3>
        `;

        const sectionGrid = document.createElement('div');
        sectionGrid.className = 'membros-grid';

        members.forEach(member => {
        const card = document.createElement('article');
        const roleMeta = getRoleMeta(member.role);
        const avatar = member.member?.avatar || './assets/img/placeholder-avatar.png';
        const profileHref = Number.isFinite(Number(member?.member?.id))
            ? `./perfil.html?id=${member.member.id}`
            : '#';

        card.className = 'membro-card';
        card.innerHTML = `
            <div class="membro-card-topo">
                <div class="membro-avatar">
                    <img class="membro-avatar-img" src="${avatar}" alt="Avatar de ${member.member?.name || 'membro'}" />
                </div>
                <div class="membro-identidade">
                    <div class="membro-nome-linha">
                        <h3><a class="membro-link-perfil" href="${profileHref}">${member.member?.name || 'Membro'}</a></h3>
                        ${isCurrentUser(member) ? '<span class="membro-you">Você</span>' : ''}
                    </div>
                    <div class="membro-badges">
                        <span class="grupo-badge ${roleMeta.css}">
                            <i class="${roleMeta.icon}"></i>
                            ${roleMeta.label}
                        </span>
                        ${isCurrentUser(member) && isCurrentGroupSelected() ? `
                            <span class="grupo-badge is-selected">
                                <i class="fa-solid fa-star"></i>
                                Grupo padrão
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="membro-meta">
                <div class="membro-meta-item">
                    <span>Entrou em</span>
                    <strong>${formatarData(member.joinedAt)}</strong>
                </div>
                <div class="membro-meta-item">
                    <span>Status</span>
                    <strong>${member.active ? 'Ativo' : 'Inativo'}</strong>
                </div>
            </div>
        `;

        const avatarImg = card.querySelector('.membro-avatar-img');
        avatarImg?.addEventListener('error', () => {
            avatarImg.src = './assets/img/placeholder-avatar.png';
        }, { once: true });

        const actions = buildMemberActions(member);
        if (actions.children.length) {
            card.appendChild(actions);
        }

        sectionGrid.appendChild(card);
        });

        section.append(sectionHeader, sectionGrid);
        container.appendChild(section);
    });
}

function criarCardGestaoVazio(texto) {
    const empty = document.createElement('div');
    empty.className = 'gestao-empty';
    empty.textContent = texto;
    return empty;
}

function ativarSubabaGestao(tabName = 'convites') {
    const previousTab = state.gestaoSubtab;

    if (previousTab !== tabName && (previousTab === 'convites' || tabName === 'convites')) {
        resetInviteCandidateSelection({ clearInput: true });
    }

    state.gestaoSubtab = tabName;

    document.querySelectorAll('.gestao-subtab').forEach(tab => {
        const isActive = tab.dataset.gestaoTab === tabName;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', String(isActive));
    });

    document.querySelectorAll('.gestao-subtab-content').forEach(content => {
        content.classList.toggle('active', content.id === `gestao-subtab-${tabName}`);
    });
}

function configurarSubabasGestao() {
    const tabs = document.querySelectorAll('.gestao-subtab');
    if (!tabs.length || tabs[0]?.dataset.bound === 'true') return;

    tabs.forEach(tab => {
        tab.dataset.bound = 'true';
        tab.addEventListener('click', () => {
            ativarSubabaGestao(tab.dataset.gestaoTab || 'convites');
        });
    });
}

function renderSolicitacoesPendentes() {
    const container = document.getElementById('solicitacoes-lista');
    if (!container) return;

    container.innerHTML = '';

    if (!state.pendingRequests.length) {
        container.appendChild(criarCardGestaoVazio('Nenhuma solicitação pendente no momento.'));
        return;
    }

    state.pendingRequests.forEach(request => {
        const card = document.createElement('article');
        card.className = 'gestao-item-card';

        const requesterName = obterNomeSolicitante(request);

        card.innerHTML = `
            <div class="gestao-item-info">
                <strong>${requesterName}</strong>
                <span>Solicitado em ${formatarDataHora(request.createdAt)}</span>
            </div>
            <div class="gestao-item-acoes">
                <button type="button" class="btn-membro-action" data-action="aprovar">Aprovar</button>
                <button type="button" class="btn-membro-action danger-light" data-action="rejeitar">Rejeitar</button>
            </div>
        `;

        card.querySelector('[data-action="aprovar"]')?.addEventListener('click', async () => {
            try {
                await groupService.aprovarSolicitacaoEntrada(state.groupId, request.id);
                criarMensagem(`Solicitação de "${requesterName}" aprovada.`, MensagemTipo.SUCCESS);
                await carregarPagina();
            } catch (err) {
                handleUiError(err, 'Não foi possível aprovar a solicitação.');
            }
        });

        card.querySelector('[data-action="rejeitar"]')?.addEventListener('click', async () => {
            const confirmar = confirm(`Rejeitar solicitação de "${requesterName}"?`);
            if (!confirmar) return;

            try {
                await groupService.rejeitarSolicitacaoEntrada(state.groupId, request.id);
                criarMensagem(`Solicitação de "${requesterName}" rejeitada.`, MensagemTipo.INFO);
                await carregarPagina();
            } catch (err) {
                handleUiError(err, 'Não foi possível rejeitar a solicitação.');
            }
        });

        container.appendChild(card);
    });
}


function renderConvitesPendentes() {
    const container = document.getElementById('convites-lista');
    if (!container) return;

    container.innerHTML = '';

    if (!state.pendingInvites.length) {
        container.appendChild(criarCardGestaoVazio('Nenhum convite pendente no momento.'));
        return;
    }

    state.pendingInvites.forEach(invite => {
        const card = document.createElement('article');
        const isDirectInvite = invite.inviteType === 'DIRECT';
        card.className = `gestao-item-card ${isDirectInvite ? '' : 'is-copyable-token'}`.trim();
        card.title = isDirectInvite ? '' : 'Clique para copiar o token';

        const invitedUser = obterNomeConvidado(invite);
        const expires = formatarDataHora(invite.expiresAt);
        const inviteTypeLabel = isDirectInvite ? 'Convite específico' : 'Convite genérico';
        const inviteTypeCss = isDirectInvite ? 'invite-type-direct' : 'invite-type-generic';
        const inviteTypeIcon = isDirectInvite ? 'fa-solid fa-user-check' : 'fa-solid fa-ticket';
        const inviteDescription = isDirectInvite
            ? `Apenas ${invitedUser} pode aceitar este convite na seção "Convites recebidos".`
            : 'Compartilhe o token abaixo para permitir entrada no grupo.';

        card.innerHTML = `
            <div class="gestao-item-info">
                <div class="invite-type-row">
                    <span class="invite-type-badge ${inviteTypeCss}">
                        <i class="${inviteTypeIcon}"></i>
                        ${inviteTypeLabel}
                    </span>
                    <strong>${invitedUser}</strong>
                </div>
                <span>Usos: ${invite.usesCount || 0}/${invite.maxUses || '∞'} • Expira: ${expires}</span>
                <span class="invite-type-description">${inviteDescription}</span>
                ${isDirectInvite ? '<span>Token oculto para convite específico.</span>' : `<code>${invite.token}</code>`}
            </div>
            <div class="gestao-item-acoes">
                <button type="button" class="btn-membro-action danger-light" data-action="revogar">Revogar</button>
            </div>
        `;

        card.querySelector('[data-action="revogar"]')?.addEventListener('click', async () => {
            const confirmar = confirm('Deseja revogar este convite?');
            if (!confirmar) return;

            try {
                await groupService.revogarConvite(state.groupId, invite.id);
                criarMensagem('Convite revogado com sucesso.', MensagemTipo.INFO);
                await carregarPagina();
            } catch (err) {
                handleUiError(err, 'Não foi possível revogar o convite.');
            }
        });

        card.addEventListener('click', async (event) => {
            if (isDirectInvite) return;
            if (event.target.closest('button')) return;
            const copied = await copyTextToClipboard(invite.token);
            if (copied) {
                criarMensagem('Token copiado para a area de transferencia.', MensagemTipo.INFO);
            } else {
                criarMensagem('Nao foi possivel copiar o token automaticamente.', MensagemTipo.ALERT);
            }
        });

        container.appendChild(card);
    });
}

function createBanimentoCard(ban) {
        const card = document.createElement('article');
        card.className = 'gestao-item-card';

        const memberName = ban.member?.name || `Usuário #${ban.member?.id}`;
        const bannedByName = ban.bannedBy?.name || '—';
        const isTemporaryBan = Boolean(ban.expiresAt);
        const expires = formatarDataHora(ban.expiresAt);
        const expiresRelative = formatarExpiracaoRelativa(ban.expiresAt);

        card.innerHTML = `
            <div class="gestao-item-info">
                <div class="ban-item-header">
                    <strong>${memberName}</strong>
                    <span class="ban-type-badge ${isTemporaryBan ? 'is-temporary' : 'is-permanent'}">
                        <i class="fa-solid ${isTemporaryBan ? 'fa-hourglass-half' : 'fa-infinity'}"></i>
                        ${isTemporaryBan ? 'Temporário' : 'Permanente'}
                    </span>
                </div>
                <span>Motivo: ${ban.reason}</span>
                <span>Banido por: ${bannedByName} • ${isTemporaryBan ? `Expira em: ${expires}${expiresRelative ? ` (${expiresRelative})` : ''}` : 'Sem expiração'}</span>
            </div>
            <div class="gestao-item-acoes">
                <button type="button" class="btn-membro-action danger-light" data-action="desbanir">Desbanir</button>
            </div>
        `;

        card.querySelector('[data-action="desbanir"]')?.addEventListener('click', async () => {
            const confirmar = confirm(`Deseja remover o banimento de "${memberName}"?`);
            if (!confirmar) return;

            try {
                await groupService.removerBanimento(state.groupId, ban.member.id);
                criarMensagem(`Banimento de "${memberName}" removido.`, MensagemTipo.SUCCESS);
                await carregarPagina();
            } catch (err) {
                handleUiError(err, 'Não foi possível remover o banimento.');
            }
        });

        return card;
}

function renderBanimentosAtivos() {
    const temporaryContainer = document.getElementById('banimentos-temporarios-lista');
    const permanentContainer = document.getElementById('banimentos-permanentes-lista');
    if (!temporaryContainer || !permanentContainer) return;

    temporaryContainer.innerHTML = '';
    permanentContainer.innerHTML = '';

    const temporaryBans = state.bans
        .filter(ban => Boolean(ban?.expiresAt))
        .sort((a, b) => {
            const aTime = Number.isFinite(new Date(a?.expiresAt).getTime())
                ? new Date(a.expiresAt).getTime()
                : Number.MAX_SAFE_INTEGER;
            const bTime = Number.isFinite(new Date(b?.expiresAt).getTime())
                ? new Date(b.expiresAt).getTime()
                : Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
        });
    const permanentBans = state.bans.filter(ban => !ban?.expiresAt);

    if (!temporaryBans.length) {
        temporaryContainer.appendChild(criarCardGestaoVazio('Nenhum banimento temporário ativo no momento.'));
    } else {
        temporaryBans.forEach(ban => temporaryContainer.appendChild(createBanimentoCard(ban)));
    }

    if (!permanentBans.length) {
        permanentContainer.appendChild(criarCardGestaoVazio('Nenhum banimento permanente ativo no momento.'));
    } else {
        permanentBans.forEach(ban => permanentContainer.appendChild(createBanimentoCard(ban)));
    }
}

function renderGestao() {
    const tabGestao = document.getElementById('tab-gestao');
    const tabGestaoBtn = document.getElementById('tab-gestao-btn');

    if (!tabGestao || !tabGestaoBtn) return;

    const canManage = Boolean(state.permissions?.canManage);
    tabGestao.classList.toggle('inativo', !canManage);
    tabGestaoBtn.classList.toggle('inativo', !canManage);

    if (!canManage) {
        if (tabGestao.classList.contains('active')) {
            tabGestao.classList.remove('active');
            document.getElementById('tab-membros')?.classList.add('active');
            document.querySelector('.grupo-tab[data-tab="membros"]')?.classList.add('active');
        }
        return;
    }

    renderSolicitacoesPendentes();
    renderConvitesPendentes();
    renderBanimentosAtivos();
    configurarBuscaCandidatosConvite();
    ativarSubabaGestao(state.gestaoSubtab || 'convites');
}

function preencherFormularioEdicao() {
    if (!state.group) return;

    const nameInput = document.getElementById('edit-nome');
    const tagInput = document.getElementById('edit-tag');
    const slugInput = document.getElementById('edit-slug');

    if (nameInput) {
        nameInput.value = state.group.name || '';
        delete nameInput.dataset.touched;
    }

    if (tagInput) {
        tagInput.value = state.group.tag || '';
        delete tagInput.dataset.touched;
        delete tagInput.dataset.manuallyEdited;
    }

    if (slugInput) {
        slugInput.value = state.group.slug || '';
        delete slugInput.dataset.touched;
        delete slugInput.dataset.manuallyEdited;
    }

    document.getElementById('edit-visibility').value = state.group.visibility || 'PUBLIC';
    document.getElementById('edit-join-policy').value = state.group.joinPolicy || 'OPEN';
    document.getElementById('edit-vote-deadline').value = state.group.voteChangeDeadlineDays ?? 0;
    document.getElementById('edit-movie-new-days').value = state.group.movieNewDays ?? 0;
    document.getElementById('edit-invite-max').value = state.group.inviteMaxUses ?? 0;
    document.getElementById('edit-only-admin-movie').checked = Boolean(state.group.onlyAdminAddMovie);
    document.getElementById('edit-allow-global-votes').checked = Boolean(state.group.allowGlobalVotes);

    resetarEstadoDisponibilidadeEdicaoGrupo();
    atualizarEstadoDisponibilidadeEdicao('tag', { value: state.group.tag || '', available: true, checking: false, error: false });
    atualizarEstadoDisponibilidadeEdicao('slug', { value: state.group.slug || '', available: true, checking: false, error: false });
    atualizarContadoresEdicaoGrupo();
    atualizarPreviewEdicaoGrupo();
    validarFormularioEdicaoGrupo();
}

function preencherFormularioTransferenciaOwner() {
    const select = document.getElementById('transfer-owner-select');
    if (!select) return;

    const candidates = getTransferOwnershipCandidates();
    select.innerHTML = '';

    if (!candidates.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Nenhum membro elegível no momento';
        select.appendChild(option);
        select.disabled = true;
        return;
    }

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecione um membro';
    select.appendChild(placeholder);

    candidates.forEach(member => {
        const option = document.createElement('option');
        option.value = String(member.member?.id);
        option.textContent = `${member.member?.name || 'Membro'} • ${getRoleMeta(member.role).label}`;
        select.appendChild(option);
    });

    select.disabled = false;
    select.value = '';
}

function abrirModalVotoGrupo(voteType = null) {
    state.voteTypeTarget = voteType;

    const title = document.getElementById('voto-grupo-modal-title');
    const subtitle = document.querySelector('#modal-voto-grupo .modal-subtitle');
    const salvar = document.getElementById('btn-salvar-voto-grupo');
    const nome = document.getElementById('voto-grupo-name');
    const descricao = document.getElementById('voto-grupo-description');
    const corHex = document.getElementById('voto-grupo-color-hex');
    const corPicker = document.getElementById('voto-grupo-color-picker');
    const emoji = document.getElementById('voto-grupo-emoji-input');

    if (!title || !nome || !descricao || !corHex || !corPicker || !emoji || !salvar) return;

    if (voteType) {
        title.textContent = 'Editar voto do grupo';
        if (subtitle) subtitle.textContent = 'Atualize os dados do tipo de voto deste grupo';
        salvar.textContent = 'Atualizar';
        nome.value = voteType.name || '';
        descricao.value = voteType.description || '';
        corHex.value = voteType.color || '#9810FA';
        corPicker.value = voteType.color || '#9810FA';
        emoji.value = voteType.emoji || '⭐';
    } else {
        title.textContent = 'Novo voto do grupo';
        if (subtitle) subtitle.textContent = 'Cadastre um novo tipo de voto para este grupo';
        salvar.textContent = 'Criar Tipo de Voto';
        nome.value = '';
        descricao.value = '';
        corHex.value = '#9810FA';
        corPicker.value = '#9810FA';
        emoji.value = '⭐';
    }

    atualizarPreviewVotoGrupo();
    abrirModal(document.getElementById('modal-voto-grupo'));
}

function atualizarPreviewVotoGrupo() {
    const preview = document.getElementById('preview-voto-grupo');
    if (!preview) return;

    const nome = document.getElementById('voto-grupo-name')?.value?.trim();
    const descricao = document.getElementById('voto-grupo-description')?.value?.trim();
    const corHex = document.getElementById('voto-grupo-color-hex')?.value?.trim() || '#9810FA';
    const emoji = document.getElementById('voto-grupo-emoji-input')?.value?.trim() || '⭐';

    const emojiPreview = preview.querySelector('.emoji-voto');
    const nomePreview = preview.querySelector('.descricao div:first-child');
    const descricaoPreview = preview.querySelector('.descricao .secundario');

    if (emojiPreview) emojiPreview.textContent = emoji;
    if (nomePreview) nomePreview.textContent = nome || 'Nome do Voto';
    if (descricaoPreview) {
        descricaoPreview.textContent = descricao || 'Descrição do voto';
        descricaoPreview.style.color = corHex;
    }
}

function configurarModalVotoGrupoInteractions() {
    const btnEmoji = document.getElementById('voto-grupo-btn-emoji');
    const picker = document.getElementById('voto-grupo-emoji-picker');
    const emojiInput = document.getElementById('voto-grupo-emoji-input');
    const colorPicker = document.getElementById('voto-grupo-color-picker');
    const colorHex = document.getElementById('voto-grupo-color-hex');
    const nome = document.getElementById('voto-grupo-name');
    const descricao = document.getElementById('voto-grupo-description');

    if (!btnEmoji || !picker || !emojiInput || !colorPicker || !colorHex || !nome || !descricao) return;

    picker.innerHTML = '';
    emojis.forEach(emoji => {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.addEventListener('click', () => {
            emojiInput.value = emoji;
            picker.classList.add('inativo');
            atualizarPreviewVotoGrupo();
        });
        picker.appendChild(span);
    });

    btnEmoji.addEventListener('click', (event) => {
        event.stopPropagation();
        picker.classList.toggle('inativo');
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('#modal-voto-grupo .emoji-container')) {
            picker.classList.add('inativo');
        }
    });

    colorPicker.addEventListener('input', () => {
        colorHex.value = colorPicker.value.toUpperCase();
        atualizarPreviewVotoGrupo();
    });

    colorHex.addEventListener('input', () => {
        if (/^#([0-9A-Fa-f]{6})$/.test(colorHex.value)) {
            colorPicker.value = colorHex.value;
        }
        atualizarPreviewVotoGrupo();
    });

    nome.addEventListener('input', atualizarPreviewVotoGrupo);
    descricao.addEventListener('input', atualizarPreviewVotoGrupo);
    emojiInput.addEventListener('input', atualizarPreviewVotoGrupo);
}

function abrirModalBanimento(member) {
    state.memberTarget = member;
    document.getElementById('ban-membro-nome').textContent = member.member?.name || 'Membro';
    document.getElementById('ban-reason').value = '';
    document.getElementById('ban-expires').value = '';
    abrirModal(document.getElementById('modal-banir-membro'));
}

function abrirModalExpulsao(member) {
    state.memberTarget = member;
    document.getElementById('expulsar-membro-nome').textContent = member.member?.name || 'Membro';
    abrirModal(document.getElementById('modal-expulsar-membro'));
}

function configurarTabs() {
    const tabs = document.querySelectorAll('.grupo-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            if (tabName !== 'gestao') {
                resetInviteCandidateSelection({ clearInput: true });
            }

            tabs.forEach(item => item.classList.remove('active'));
            contents.forEach(content => content.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`tab-${tabName}`)?.classList.add('active');
        });
    });
}

function configurarModais() {
    const modalEditar = document.getElementById('modal-editar-grupo');
    const modalTransferirOwner = document.getElementById('modal-transferir-owner');
    const modalBanir = document.getElementById('modal-banir-membro');
    const modalExpulsar = document.getElementById('modal-expulsar-membro');
    const modalVotoGrupo = document.getElementById('modal-voto-grupo');
    const editNameInput = document.getElementById('edit-nome');
    const editTagInput = document.getElementById('edit-tag');
    const editSlugInput = document.getElementById('edit-slug');
    const editVisibilityInput = document.getElementById('edit-visibility');
    const editJoinPolicyInput = document.getElementById('edit-join-policy');

    document.getElementById('fechar-modal-editar')?.addEventListener('click', () => fecharModal(modalEditar));
    document.getElementById('btn-cancelar-editar')?.addEventListener('click', () => fecharModal(modalEditar));
    document.getElementById('fechar-modal-transferir-owner')?.addEventListener('click', () => fecharModal(modalTransferirOwner));
    document.getElementById('btn-cancelar-transferir-owner')?.addEventListener('click', () => fecharModal(modalTransferirOwner));
    document.getElementById('fechar-modal-ban')?.addEventListener('click', () => fecharModal(modalBanir));
    document.getElementById('btn-cancelar-ban')?.addEventListener('click', () => fecharModal(modalBanir));
    document.getElementById('fechar-modal-expulsar')?.addEventListener('click', () => fecharModal(modalExpulsar));
    document.getElementById('btn-cancelar-expulsar')?.addEventListener('click', () => fecharModal(modalExpulsar));
    document.getElementById('fechar-modal-voto-grupo')?.addEventListener('click', () => fecharModal(modalVotoGrupo));
    document.getElementById('btn-cancelar-voto-grupo')?.addEventListener('click', () => fecharModal(modalVotoGrupo));
    document.getElementById('btn-novo-voto-grupo')?.addEventListener('click', () => abrirModalVotoGrupo());

    [modalEditar, modalTransferirOwner, modalBanir, modalExpulsar, modalVotoGrupo].forEach(modal => {
        modal?.addEventListener('click', (event) => {
            if (event.target === modal) {
                fecharModal(modal);
            }
        });
    });

    editNameInput?.addEventListener('input', () => {
        editNameInput.dataset.touched = 'true';

        if (!editSlugInput?.dataset.manuallyEdited) {
            editSlugInput.value = slugifyGroupName(editNameInput.value, EDIT_GROUP_LIMITS.slug);
        }

        if (!editTagInput?.dataset.manuallyEdited && (!editTagInput.value || editTagInput.value.length < 4)) {
            editTagInput.value = gerarTagGrupo(editNameInput.value, EDIT_GROUP_LIMITS.tag);
        }

        validarFormularioEdicaoGrupo();
        agendarValidacaoDisponibilidadeEdicaoGrupo();
    });

    editTagInput?.addEventListener('input', () => {
        editTagInput.dataset.touched = 'true';
        editTagInput.dataset.manuallyEdited = 'true';
        editTagInput.value = gerarTagGrupo(editTagInput.value, EDIT_GROUP_LIMITS.tag);
        validarFormularioEdicaoGrupo();
        agendarValidacaoDisponibilidadeEdicaoGrupo();
    });

    editSlugInput?.addEventListener('input', () => {
        editSlugInput.dataset.touched = 'true';
        editSlugInput.dataset.manuallyEdited = 'true';
        editSlugInput.value = slugifyGroupName(editSlugInput.value, EDIT_GROUP_LIMITS.slug);
        validarFormularioEdicaoGrupo();
        agendarValidacaoDisponibilidadeEdicaoGrupo();
    });

    editVisibilityInput?.addEventListener('change', validarFormularioEdicaoGrupo);
    editJoinPolicyInput?.addEventListener('change', validarFormularioEdicaoGrupo);

    document.getElementById('form-editar-grupo')?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const payload = {
            name: document.getElementById('edit-nome').value.trim(),
            tag: document.getElementById('edit-tag').value.trim() || state.group?.tag,
            slug: document.getElementById('edit-slug').value.trim(),
            visibility: document.getElementById('edit-visibility').value,
            joinPolicy: document.getElementById('edit-join-policy').value,
            onlyAdminAddMovie: document.getElementById('edit-only-admin-movie').checked,
            allowGlobalVotes: document.getElementById('edit-allow-global-votes').checked,
            voteChangeDeadlineDays: Number(document.getElementById('edit-vote-deadline').value || 0),
            movieNewDays: Number(document.getElementById('edit-movie-new-days').value || 0),
            inviteMaxUses: Number(document.getElementById('edit-invite-max').value || 0)
        };

        if (editNameInput) editNameInput.dataset.touched = 'true';
        if (editTagInput) editTagInput.dataset.touched = 'true';
        if (editSlugInput) editSlugInput.dataset.touched = 'true';

        if (!validarFormularioEdicaoGrupo(true)) {
            criarMensagem('Revise os campos destacados antes de salvar o grupo.', MensagemTipo.ALERT);
            return;
        }

        try {
            const availability = await validarDisponibilidadeEdicaoGrupoAgora();
            if (!availability.tagAvailable || !availability.slugAvailable) {
                criarMensagem('A tag ou o slug informados já estão em uso. Revise os campos destacados.', MensagemTipo.ALERT);
                return;
            }

            await groupService.atualizarGrupo(state.groupId, payload);
            fecharModal(modalEditar);

            if (isCurrentGroupSelected()) {
                await loadCurrentGroup();
                state.currentGroup = getCurrentGroup();
            }

            criarMensagem('Grupo atualizado com sucesso.', MensagemTipo.SUCCESS);
            await carregarPagina();
        } catch (err) {
            handleUiError(err, 'Não foi possível atualizar o grupo.');
        }
    });

    document.getElementById('form-transferir-owner')?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const select = document.getElementById('transfer-owner-select');
        const newOwnerId = Number(select?.value || 0);
        if (!newOwnerId) {
            criarMensagem('Selecione um membro para transferir a ownership.', MensagemTipo.ALERT);
            return;
        }

        const member = state.members.find(item => Number(item.member?.id) === newOwnerId);
        const memberName = member?.member?.name || 'o membro selecionado';

        try {
            await groupService.transferirOwnership(state.groupId, newOwnerId);
            fecharModal(modalTransferirOwner);
            criarMensagem(`Ownership do grupo transferida para "${memberName}".`, MensagemTipo.SUCCESS);
            await carregarPagina();
        } catch (err) {
            handleUiError(err, 'Não foi possível transferir a ownership deste grupo.');
        }
    });

    document.getElementById('form-banir-membro')?.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!state.memberTarget) return;

        const reason = document.getElementById('ban-reason').value.trim();
        const expiresRaw = document.getElementById('ban-expires').value;
        const expiresAt = normalizarDateTimeLocal(expiresRaw);

        if (!reason) {
            criarMensagem('Informe um motivo para o banimento.', MensagemTipo.ALERT);
            return;
        }

        if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
            criarMensagem('A data de expiração deve estar no futuro.', MensagemTipo.ALERT);
            return;
        }

        try {
            const target = state.memberTarget;
            await groupService.banirMembro(state.groupId, target.member.id, reason, expiresAt);
            fecharModal(modalBanir);
            criarMensagem(`"${target.member.name}" foi banido do grupo.`, MensagemTipo.SUCCESS);
            state.memberTarget = null;
            await carregarPagina();
        } catch (err) {
            handleUiError(err, 'Não foi possível banir este membro.');
        }
    });

    document.getElementById('btn-confirmar-expulsar')?.addEventListener('click', async () => {
        if (!state.memberTarget) return;

        try {
            const target = state.memberTarget;
            await groupService.removerMembro(state.groupId, target.member.id);
            fecharModal(modalExpulsar);
            criarMensagem(`"${target.member.name}" foi removido do grupo.`, MensagemTipo.SUCCESS);
            state.memberTarget = null;
            await carregarPagina();
        } catch (err) {
            handleUiError(err, 'Não foi possível expulsar este membro.');
        }
    });

    document.getElementById('form-voto-grupo')?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const payload = {
            id: state.voteTypeTarget?.id,
            name: document.getElementById('voto-grupo-name')?.value?.trim(),
            description: document.getElementById('voto-grupo-description')?.value?.trim(),
            color: document.getElementById('voto-grupo-color-hex')?.value?.trim() || '#9810FA',
            emoji: document.getElementById('voto-grupo-emoji-input')?.value?.trim() || '⭐'
        };

        if (!payload.name || !payload.description) {
            criarMensagem('Informe nome e descrição do voto.', MensagemTipo.ALERT);
            return;
        }

        try {
            if (state.voteTypeTarget?.id) {
                await votoService.atualizarTipoVotoDoGrupo(state.groupId, payload);
                criarMensagem(`Voto "${payload.name}" atualizado com sucesso.`, MensagemTipo.SUCCESS);
            } else {
                await votoService.criarTipoVotoDoGrupo(state.groupId, payload);
                criarMensagem(`Voto "${payload.name}" criado com sucesso.`, MensagemTipo.SUCCESS);
            }

            state.voteTypeTarget = null;
            fecharModal(modalVotoGrupo);
            await carregarPagina();
        } catch (err) {
            handleUiError(err, 'Não foi possível salvar o voto do grupo.');
        }
    });
}

function exibirConviteGerado(invite) {
    const resultado = document.getElementById('convite-gerado-resultado');
    if (!resultado || !invite) return;

    resultado.classList.remove('inativo');
    resultado.innerHTML = `
        <p><strong>Convite criado com sucesso.</strong></p>
        <p>Token:</p>
        <code>${invite.token}</code>
    `;
}

function ocultarConviteGerado() {
    const resultado = document.getElementById('convite-gerado-resultado');
    if (!resultado) return;

    resultado.classList.add('inativo');
    resultado.innerHTML = '';
}

function configurarGestaoHandlers() {
    const formConviteUsuario = document.getElementById('form-convite-usuario');
    const formConviteGenerico = document.getElementById('form-convite-generico');

    formConviteUsuario?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const invitedUserId = Number(document.getElementById('convite-user-id')?.value);
        if (!invitedUserId) {
            criarMensagem('Selecione um usuário para convidar.', MensagemTipo.ALERT);
            return;
        }

        const payload = {
            invitedUserId
        };

        try {
            await groupService.criarConvite(state.groupId, payload);
            criarMensagem('Convite específico criado com sucesso.', MensagemTipo.SUCCESS);
            formConviteUsuario.reset();
            resetInviteCandidateSelection({ clearInput: true });
            ocultarConviteGerado();
            await carregarPagina();
        } catch (err) {
            handleUiError(err, 'Não foi possível criar o convite específico.');
        }
    });

    formConviteGenerico?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const maxUsesRaw = document.getElementById('convite-generico-max-uses')?.value;
        const expiresAt = normalizarDateTimeLocal(document.getElementById('convite-generico-expires')?.value);

        const payload = {
            invitedUserId: null,
            maxUses: maxUsesRaw ? Number(maxUsesRaw) : null,
            expiresAt: expiresAt || null
        };

        try {
            const invite = await groupService.criarConvite(state.groupId, payload);
            criarMensagem('Convite genérico criado com sucesso.', MensagemTipo.SUCCESS);
            formConviteGenerico.reset();
            exibirConviteGerado(invite);
            await carregarPagina();
        } catch (err) {
            handleUiError(err, 'Não foi possível criar o convite genérico.');
        }
    });
}

async function carregarDados() {
    const [group, groupWithMembers, permissions, groupWithMovies, currentGroup] = await Promise.all([
        groupService.buscarGrupoPorId(state.groupId),
        groupService.buscarMembrosDoGrupo(state.groupId),
        groupService.buscarPermissoes(state.groupId),
        filmeService.buscarFilmesDoGrupo(state.groupId),
        loadCurrentGroup()
    ]);

    state.group = group || groupWithMembers;
    state.members = groupWithMembers.members || [];
    state.permissions = permissions;
    state.movies = groupWithMovies.movies || [];
    state.currentGroup = currentGroup || getCurrentGroup();

    state.pendingRequests = [];
    state.pendingInvites = [];
    state.bans = [];
    state.groupVotes = [];
    state.globalVotes = [];
    state.rankingVoteTypes = [];
    state.rankingSummaryStats = [];
    state.rankingStats = [];
    state.rankingSelectedVoteTypeId = null;

    const [groupVotesResult, globalVotesResult, rankingVoteTypesResult, rankingSummaryResult] = await Promise.allSettled([
        votoService.buscarTiposVotosDoGrupo(state.groupId),
        votoService.buscarTiposVotosGlobaisNoGrupo(state.groupId),
        votoService.buscarTiposVotosDisponiveis(state.groupId),
        votoService.buscarRankingVotosRecebidosGrupo(state.groupId)
    ]);

    if (groupVotesResult.status === 'fulfilled') {
        state.groupVotes = groupVotesResult.value || [];
    }

    if (globalVotesResult.status === 'fulfilled') {
        state.globalVotes = globalVotesResult.value || [];
    }

    if (rankingVoteTypesResult.status === 'fulfilled') {
        state.rankingVoteTypes = rankingVoteTypesResult.value || [];
        state.rankingSelectedVoteTypeId = Number(state.rankingVoteTypes[0]?.id || null);
    }

    if (rankingSummaryResult.status === 'fulfilled') {
        state.rankingSummaryStats = rankingSummaryResult.value || [];
    }

    if (state.rankingSelectedVoteTypeId) {
        const rankingFilteredResult = await Promise.allSettled([
            votoService.buscarRankingVotosRecebidosGrupo(state.groupId, state.rankingSelectedVoteTypeId)
        ]);

        if (rankingFilteredResult[0].status === 'fulfilled') {
            state.rankingStats = rankingFilteredResult[0].value || [];
        }
    }

    if (state.permissions?.canManage) {
        const [pendingRequestsResult, pendingInvitesResult, bansResult] = await Promise.allSettled([
            groupService.buscarSolicitacoesPendentes(state.groupId),
            groupService.buscarConvitesPendentes(state.groupId),
            groupService.buscarBanimentosAtivos(state.groupId)
        ]);

        if (pendingRequestsResult.status === 'fulfilled') {
            state.pendingRequests = pendingRequestsResult.value || [];
        }

        if (pendingInvitesResult.status === 'fulfilled') {
            state.pendingInvites = pendingInvitesResult.value || [];
        }

        if (bansResult.status === 'fulfilled') {
            state.bans = bansResult.value || [];
        }
    }
}

async function carregarPagina() {
    const moviesContainer = document.getElementById('filmes-lista');
    renderMovieSkeletons(moviesContainer, 8);

    await carregarDados();
    renderHero();
    renderMembers();
    renderMovies();
    renderVotesTab();
    renderRankingRecebidos();
    renderGestao();
}

function handleUiError(err, fallbackMessage) {
    if (err instanceof ApiError) {
        criarMensagem(err.detail || fallbackMessage, MensagemTipo.ERROR);
        return;
    }

    criarMensagem(fallbackMessage, MensagemTipo.ERROR);
}

document.addEventListener('DOMContentLoaded', async () => {
    exibirFlashMessage();

    const container = document.getElementById('container');
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';

    try {
        await authService.requireLogin();

        state.usuario = await authService.getUsuarioLogado();
        if (!state.usuario) {
            window.location.href = './login.html';
            return;
        }

        const groupId = Number(getQueryParam('id'));
        if (!groupId) {
            setFlashMessage('Grupo inválido para visualizar detalhes.', 'ALERT');
            window.location.href = './meus-grupos.html';
            return;
        }

        state.groupId = groupId;
        configurarFiltroFilmesGrupo();
        await carregarPagina();
        configurarTabs();
        configurarSubabasGestao();
        configurarModais();
        configurarModalVotoGrupoInteractions();
        configurarRankingRecebidosTab();
        configurarGestaoHandlers();
        ativarSubabaGestao(state.gestaoSubtab || 'convites');
    } catch (err) {
        if (err instanceof ApiError && [403, 404].includes(err.status)) {
            setFlashMessage(err.detail || 'Você não possui acesso a este grupo.', 'ALERT');
            window.location.href = './meus-grupos.html';
            return;
        }

        handleUiError(err, 'Erro ao carregar os detalhes do grupo.');
    } finally {
        if (container) container.classList.remove('inativo-js');
        if (loader) loader.style.display = 'none';
    }
});

