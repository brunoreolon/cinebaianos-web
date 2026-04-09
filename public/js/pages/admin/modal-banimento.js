function formatarDataHoraLocalParaInput(data) {
    const pad = value => String(value).padStart(2, '0');
    return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())}T${pad(data.getHours())}:${pad(data.getMinutes())}`;
}

function normalizarExpiracao(value) {
    if (!value) return null;
    return value.length === 16 ? `${value}:00` : value;
}

function atualizarErroCampo(campo, mensagem) {
    if (!campo) return;
    campo.textContent = mensagem || '';
    campo.classList.toggle('inativo', !mensagem);
}

function fecharModal(modal) {
    modal.classList.remove('ativo');
    window.setTimeout(() => modal.classList.add('inativo'), 250);
}

function abrirModal(modal) {
    modal.classList.remove('inativo');
    window.requestAnimationFrame(() => modal.classList.add('ativo'));
}

export function abrirModalBanimento(config) {
    const modal = document.getElementById('modal-banimento');
    const content = modal?.querySelector('.modal-banimento-content');

    if (!modal || !content) {
        return Promise.resolve(null);
    }

    const isUnban = config.mode === 'unban';

    const titulo = modal.querySelector('.banimento-titulo');
    const subtitulo = modal.querySelector('.banimento-subtitulo');
    const contexto = modal.querySelector('.banimento-contexto');
    const nome = modal.querySelector('.banimento-nome');
    const identificador = modal.querySelector('.banimento-identificador');
    const formulario = modal.querySelector('.banimento-formulario');
    const confirmacao = modal.querySelector('.banimento-confirmacao');
    const confirmacaoTexto = modal.querySelector('.banimento-confirmacao-texto');
    const motivoInput = modal.querySelector('#banimento-motivo');
    const motivoErro = modal.querySelector('#banimento-motivo-erro');
    const motivoContador = modal.querySelector('#banimento-motivo-contador');
    const expiraInput = modal.querySelector('#banimento-expira');
    const expiraErro = modal.querySelector('#banimento-expira-erro');
    const closeButton = modal.querySelector('.close');
    const cancelButton = modal.querySelector('.btn-cancelar');
    const confirmButton = modal.querySelector('.btn-confirmar-banimento');

    titleCaseBadge(contexto, config.targetType);
    if (nome) nome.textContent = config.name || '-';
    if (identificador) identificador.textContent = config.identifier || '';

    if (titulo) titulo.textContent = isUnban ? `Desbanir ${config.targetLabel}` : `Banir ${config.targetLabel}`;
    if (subtitulo) {
        subtitulo.textContent = isUnban
            ? `Confirme a remoção do banimento global de ${config.targetLabel.toLowerCase()}.`
            : `Defina os detalhes do banimento global de ${config.targetLabel.toLowerCase()}.`;
    }

    if (confirmButton) confirmButton.textContent = isUnban ? `Desbanir ${config.targetLabel}` : `Confirmar banimento`;

    content.classList.toggle('modo-desbanir', isUnban);
    formulario?.classList.toggle('inativo', isUnban);
    confirmacao?.classList.toggle('inativo', !isUnban);

    if (confirmacaoTexto && isUnban) {
        confirmacaoTexto.textContent = `Tem certeza que deseja remover o banimento global ${config.targetType === 'user' ? 'deste usuário' : 'deste grupo'}?`;
    }

    if (motivoInput) {
        motivoInput.value = '';
        motivoInput.disabled = isUnban;
        motivoInput.classList.remove('input-invalido');
    }

    if (expiraInput) {
        expiraInput.value = '';
        expiraInput.disabled = isUnban;
        expiraInput.min = formatarDataHoraLocalParaInput(new Date());
        expiraInput.classList.remove('input-invalido');
    }

    atualizarErroCampo(motivoErro, '');
    atualizarErroCampo(expiraErro, '');

    const atualizarContadorMotivo = () => {
        if (!motivoContador || !motivoInput) return;
        motivoContador.textContent = `${motivoInput.value.length}/200`;
    };

    const validarMotivo = () => {
        if (isUnban) return true;
        const reason = motivoInput?.value?.trim() || '';
        if (!reason) {
            atualizarErroCampo(motivoErro, 'Informe o motivo do banimento.');
            motivoInput?.classList.add('input-invalido');
            return false;
        }

        atualizarErroCampo(motivoErro, '');
        motivoInput?.classList.remove('input-invalido');
        return true;
    };

    const validarExpiracao = () => {
        if (isUnban) return true;
        const expiresAt = normalizarExpiracao(expiraInput?.value?.trim());
        if (!expiresAt) {
            atualizarErroCampo(expiraErro, '');
            expiraInput?.classList.remove('input-invalido');
            return true;
        }

        if (new Date(expiresAt) <= new Date()) {
            atualizarErroCampo(expiraErro, 'A expiração deve ser uma data futura.');
            expiraInput?.classList.add('input-invalido');
            return false;
        }

        atualizarErroCampo(expiraErro, '');
        expiraInput?.classList.remove('input-invalido');
        return true;
    };

    const atualizarEstadoConfirmacao = () => {
        if (!confirmButton) return;
        if (isUnban) {
            confirmButton.disabled = false;
            return;
        }
        confirmButton.disabled = !(validarMotivo() && validarExpiracao());
    };

    atualizarContadorMotivo();
    atualizarEstadoConfirmacao();

    return new Promise(resolve => {
        let finalizado = false;

        const cleanup = () => {
            closeButton?.removeEventListener('click', onCancel);
            cancelButton?.removeEventListener('click', onCancel);
            confirmButton?.removeEventListener('click', onConfirm);
            motivoInput?.removeEventListener('input', onMotivoInput);
            motivoInput?.removeEventListener('blur', onMotivoBlur);
            expiraInput?.removeEventListener('change', onExpiraChange);
            expiraInput?.removeEventListener('blur', onExpiraBlur);
            modal.removeEventListener('click', onBackdropClick);
            window.removeEventListener('keydown', onKeyDown);
        };

        const finalizar = payload => {
            if (finalizado) return;
            finalizado = true;
            cleanup();
            fecharModal(modal);
            resolve(payload);
        };

        const onCancel = () => finalizar(null);

        const onBackdropClick = event => {
            if (event.target === modal) {
                finalizar(null);
            }
        };

        const onKeyDown = event => {
            if (event.key === 'Escape') {
                finalizar(null);
            }
        };

        const onConfirm = () => {
            if (isUnban) {
                finalizar({ confirmed: true });
                return;
            }

            const motivoValido = validarMotivo();
            const expiracaoValida = validarExpiracao();
            if (!motivoValido || !expiracaoValida) {
                atualizarEstadoConfirmacao();
                if (!motivoValido) {
                    motivoInput?.focus();
                    return;
                }
                if (!expiracaoValida) {
                    expiraInput?.focus();
                }
                return;
            }

            const reason = motivoInput?.value?.trim() || '';
            if (!reason) {
                motivoInput?.focus();
                return;
            }

            const expiresAt = normalizarExpiracao(expiraInput?.value?.trim());
            finalizar({ confirmed: true, reason, expiresAt: expiresAt || null });
        };

        const onMotivoInput = () => {
            atualizarContadorMotivo();
            validarMotivo();
            atualizarEstadoConfirmacao();
        };

        const onMotivoBlur = () => {
            validarMotivo();
            atualizarEstadoConfirmacao();
        };

        const onExpiraChange = () => {
            validarExpiracao();
            atualizarEstadoConfirmacao();
        };

        const onExpiraBlur = () => {
            validarExpiracao();
            atualizarEstadoConfirmacao();
        };

        closeButton?.addEventListener('click', onCancel);
        cancelButton?.addEventListener('click', onCancel);
        confirmButton?.addEventListener('click', onConfirm);
        motivoInput?.addEventListener('input', onMotivoInput);
        motivoInput?.addEventListener('blur', onMotivoBlur);
        expiraInput?.addEventListener('change', onExpiraChange);
        expiraInput?.addEventListener('blur', onExpiraBlur);
        modal.addEventListener('click', onBackdropClick);
        window.addEventListener('keydown', onKeyDown);

        abrirModal(modal);
    });
}

function titleCaseBadge(element, targetType) {
    if (!element) return;
    element.textContent = targetType === 'user' ? 'Usuário' : 'Grupo';
}

