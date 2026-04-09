import { authService } from '../services/auth-service.js';
import { criarMensagem } from '../components/mensagens.js';
import { MensagemTipo } from '../components/mensagem-tipo.js';
import { ApiError } from '../exception/api-error.js';

function mostrarFlashMessage() {
    const flash = sessionStorage.getItem('flashMessage');
    if (!flash) return;

    try {
        const { texto, tipo } = JSON.parse(flash);
        criarMensagem(texto, MensagemTipo[tipo]);
    } catch (_) {
        // Ignora payload inválido e só limpa a chave.
    } finally {
        sessionStorage.removeItem('flashMessage');
    }
}

function mensagemErroApi(err, fallback) {
    if (!(err instanceof ApiError)) {
        return 'Não foi possível conectar ao servidor.';
    }

    return err.detail || fallback;
}

function validarFormularioCadastro({ name, email, password, passwordConfirmation }) {
    if (!name || name.length < 3) {
        criarMensagem('Informe um nome com pelo menos 3 caracteres.', MensagemTipo.ALERT);
        return false;
    }

    if (!email) {
        criarMensagem('Informe um email válido.', MensagemTipo.ALERT);
        return false;
    }

    if (!password || password.length < 8) {
        criarMensagem('A senha deve ter pelo menos 8 caracteres.', MensagemTipo.ALERT);
        return false;
    }

    if (password !== passwordConfirmation) {
        criarMensagem('A confirmação de senha não confere.', MensagemTipo.ALERT);
        return false;
    }

    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    mostrarFlashMessage();

    const formCadastro = document.getElementById('form-cadastro');
    const formVerificacao = document.getElementById('form-verificacao');

    const nomeInput = document.getElementById('cadastro-nome');
    const emailInput = document.getElementById('cadastro-email');
    const senhaInput = document.getElementById('cadastro-senha');
    const confirmarSenhaInput = document.getElementById('cadastro-confirmar-senha');
    const codigoInput = document.getElementById('cadastro-codigo');

    const btnCadastrar = document.getElementById('btn-cadastrar');
    const btnVerificar = document.getElementById('btn-verificar');
    const btnReenviar = document.getElementById('btn-reenviar-codigo');
    const btnAlterar = document.getElementById('btn-alterar-email');

    const subtitulo = document.getElementById('cadastro-subtitulo');
    const textoEmail = document.getElementById('verificacao-texto-email');

    let stagedSignup = null;

    function atualizarTextoVerificacao(email) {
        if (!textoEmail) return;
        textoEmail.textContent = `Enviamos um código de 6 dígitos para ${email}.`;
    }

    function mostrarEtapaVerificacao() {
        formCadastro?.classList.add('inativo');
        formVerificacao?.classList.remove('inativo');
        if (subtitulo) subtitulo.textContent = 'Confirme seu email com o código recebido';
        codigoInput?.focus();
    }

    function mostrarEtapaCadastro() {
        formVerificacao?.classList.add('inativo');
        formCadastro?.classList.remove('inativo');
        if (subtitulo) subtitulo.textContent = 'Crie sua conta para entrar nos grupos';
        senhaInput?.focus();
    }

    formCadastro?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const payload = {
            name: nomeInput?.value?.trim(),
            email: emailInput?.value?.trim(),
            password: senhaInput?.value || '',
            passwordConfirmation: confirmarSenhaInput?.value || ''
        };

        if (!validarFormularioCadastro(payload)) return;

        if (btnCadastrar) {
            btnCadastrar.disabled = true;
            btnCadastrar.textContent = 'Enviando código...';
        }

        try {
            await authService.signupStart({
                name: payload.name,
                email: payload.email,
                password: payload.password
            });

            stagedSignup = {
                email: payload.email
            };

            atualizarTextoVerificacao(payload.email);
            mostrarEtapaVerificacao();
            criarMensagem('Código de confirmação enviado. Confira seu email.', MensagemTipo.SUCCESS);
        } catch (err) {
            criarMensagem(
                mensagemErroApi(err, 'Não foi possível iniciar o cadastro.'),
                MensagemTipo.ERROR
            );
        } finally {
            if (btnCadastrar) {
                btnCadastrar.disabled = false;
                btnCadastrar.textContent = 'Continuar';
            }
        }
    });

    formVerificacao?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const code = codigoInput?.value?.trim() || '';
        if (!/^\d{6}$/.test(code)) {
            criarMensagem('Informe um código válido com 6 dígitos.', MensagemTipo.ALERT);
            return;
        }

        if (!stagedSignup?.email) {
            criarMensagem('Sessão de cadastro expirada. Preencha os dados novamente.', MensagemTipo.ALERT);
            mostrarEtapaCadastro();
            return;
        }

        if (btnVerificar) {
            btnVerificar.disabled = true;
            btnVerificar.textContent = 'Confirmando...';
        }

        try {
            await authService.signupVerify({
                email: stagedSignup.email,
                code
            });

            sessionStorage.setItem('flashMessage', JSON.stringify({
                texto: 'Conta criada com sucesso! Faça login para continuar.',
                tipo: 'SUCCESS'
            }));

            window.location.href = './login.html';
        } catch (err) {
            criarMensagem(
                mensagemErroApi(err, 'Não foi possível confirmar o código.'),
                MensagemTipo.ERROR
            );
        } finally {
            if (btnVerificar) {
                btnVerificar.disabled = false;
                btnVerificar.textContent = 'Confirmar cadastro';
            }
        }
    });

    btnReenviar?.addEventListener('click', async () => {
        if (!stagedSignup?.email) {
            criarMensagem('Sessão de cadastro expirada. Preencha os dados novamente.', MensagemTipo.ALERT);
            mostrarEtapaCadastro();
            return;
        }

        try {
            await authService.signupResend(stagedSignup.email);
            criarMensagem('Novo código enviado para seu email.', MensagemTipo.INFO);
        } catch (err) {
            criarMensagem(
                mensagemErroApi(err, 'Não foi possível reenviar o código agora.'),
                MensagemTipo.ERROR
            );
        }
    });

    btnAlterar?.addEventListener('click', () => {
        stagedSignup = null;
        codigoInput.value = '';
        mostrarEtapaCadastro();
    });
});
