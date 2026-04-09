const VISIBILITY_LABELS = {
    PUBLIC: 'Público',
    PRIVATE: 'Privado'
};

const JOIN_POLICY_LABELS = {
    OPEN: 'Aberto',
    REQUEST: 'Solicitação',
    INVITE_ONLY: 'Somente convite'
};

function getVisibilityLabel(value) {
    return VISIBILITY_LABELS[value] || value || 'Não informado';
}

function getJoinPolicyLabel(value) {
    return JOIN_POLICY_LABELS[value] || value || 'Não informado';
}

export function renderGroupPreviewCard(container, {
    name,
    tag,
    slug,
    visibility,
    joinPolicy,
    ownerName,
    membersCount,
    accentLabel,
    accentIcon,
    primaryActionLabel,
    secondaryActionLabel,
    host
} = {}) {
    if (!container) return;

    const resolvedName = name || 'Nome do grupo';
    const resolvedTag = tag || 'TAG';
    const resolvedSlug = slug || 'grupo-demo';
    const resolvedVisibility = getVisibilityLabel(visibility || 'PUBLIC');
    const resolvedJoinPolicy = getJoinPolicyLabel(joinPolicy || 'OPEN');
    const resolvedOwnerName = ownerName || 'Você';
    const resolvedMembersCount = Number.isFinite(Number(membersCount)) ? Number(membersCount) : 1;
    const resolvedAccentLabel = accentLabel || 'Grupo novo';
    const resolvedAccentIcon = accentIcon || 'fa-solid fa-sparkles';
    const resolvedPrimaryActionLabel = primaryActionLabel || 'Acessar grupo';
    const resolvedSecondaryActionLabel = secondaryActionLabel || 'Configurar depois';
    const resolvedHost = host || window.location.host || 'cinebaianos.com';

    container.innerHTML = `
        <article class="preview-group-card">
            <button type="button" class="preview-group-star is-selected" disabled aria-label="Grupo atual na prévia">
                <i class="fa-solid fa-star"></i>
            </button>
            <div class="preview-group-card-header">
                <span class="preview-group-tag">#${resolvedTag}</span>
                <h3>${resolvedName}</h3>
                <p class="preview-group-slug-line">${resolvedHost}/grupos/${resolvedSlug}</p>
            </div>
            <div class="preview-group-badges">
                <span class="preview-group-badge role-owner">
                    <i class="fa-solid fa-crown"></i>
                    Dono
                </span>
                <span class="preview-group-badge is-selected">
                    <i class="${resolvedAccentIcon}"></i>
                    ${resolvedAccentLabel}
                </span>
                <span class="preview-group-badge role-member">
                    <i class="fa-solid fa-eye"></i>
                    ${resolvedVisibility}
                </span>
                <span class="preview-group-badge role-member">
                    <i class="fa-solid fa-door-open"></i>
                    ${resolvedJoinPolicy}
                </span>
            </div>
            <div class="preview-group-meta">
                <div class="preview-group-meta-item">
                    <span>Membros</span>
                    <strong>${resolvedMembersCount}</strong>
                </div>
                <div class="preview-group-meta-item">
                    <span>Política</span>
                    <strong>${resolvedJoinPolicy}</strong>
                </div>
                <div class="preview-group-meta-item">
                    <span>Visibilidade</span>
                    <strong>${resolvedVisibility}</strong>
                </div>
                <div class="preview-group-meta-item">
                    <span>Dono</span>
                    <strong>${resolvedOwnerName}</strong>
                </div>
            </div>
            <div class="preview-group-footer">
                <button type="button" class="preview-group-btn-primary" disabled>${resolvedPrimaryActionLabel}</button>
                <button type="button" class="preview-group-btn-secondary" disabled>${resolvedSecondaryActionLabel}</button>
            </div>
        </article>
    `;
}

