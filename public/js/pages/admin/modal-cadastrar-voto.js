import { ApiError } from '../../exception/api-error.js';
import { criarMensagem } from '../../components/mensagens.js';
import { MensagemTipo } from '../../components/mensagem-tipo.js';
import { criarTipoVoto, atualizarTipoVoto } from '../../services/voto-service.js';
import { renderVotos } from '../../pages/admin/painel-admin.js';
import { ordenarVotosPorDescricao } from '../../global.js';
import { emojis } from '../../emojis.js';

export async function abrirModalVoto(voto = null, votos) {
    const modal = document.getElementById("modal-cadastrar-voto");
    modal.classList.remove("inativo");
    modal.classList.add("ativo");

    const btnFinalizar = modal.querySelector('.btn-criar-voto');
    const inputNome = modal.querySelector('input[placeholder^="Ex: Amei"]');
    const inputDescricao = modal.querySelector('input[placeholder^="Ex: Esse fime foi incrível!"]');
    const inputCor = modal.querySelector('.campo-cor-inputs input[type="text"]');
    const inputEmoji = modal.querySelector('#emoji-input');

    // Se for edição, preencher os campos
    if (voto) {
        inputNome.value = voto.name || '';
        inputDescricao.value = voto.description || '';
        inputColor.value = voto.color || '#9810fa'; 
        inputCor.value = voto.color || '#9810fa';
        inputEmoji.value = voto.emoji || '';

        btnFinalizar.textContent = 'Atualizar';
    } else {
        inputNome.value = '';
        inputDescricao.value = '';
        inputColor.value = '#9810fa'; 
        inputCor.value = '#9810fa';
        inputEmoji.value = emojis[0];

        btnFinalizar.textContent = 'Criar Tipo de Voto';
    }

    // Atualiza preview em tempo real
    const previewEmoji = modal.querySelector('#preview .emoji-voto');
    const previewNome = modal.querySelector('#preview .descricao div:first-child');
    const previewDescricao = modal.querySelector('#preview .descricao .secundario');

    function atualizarPreview() {
        previewEmoji.textContent = inputEmoji.value;
        previewNome.textContent = inputNome.value || "Nome do Voto";
        previewDescricao.textContent = inputDescricao.value || "Descrição do voto";
        previewDescricao.style.color = inputCor.value;
    }

    inputNome.addEventListener('input', atualizarPreview);
    inputDescricao.addEventListener('input', atualizarPreview);
    inputEmoji.addEventListener('input', atualizarPreview);
    inputCor.addEventListener('input', () => {
        previewDescricao.style.color = inputCor.value;
    });

    atualizarPreview();

    // Botão finalizar
    btnFinalizar.onclick = async () => {
        if (!inputNome.value.trim() || !inputDescricao.value.trim()) {
            alert("Preencha nome e descrição do voto!");
            return;
        }

        try {
            if (voto) {
                // Atualiza voto existente
                voto.name = inputNome.value.trim();
                voto.description = inputDescricao.value.trim();
                voto.color = inputCor.value;
                voto.emoji = inputEmoji.value;

                const tipoVotoAtualizado = await atualizarTipoVoto(voto);
                criarMensagem(`Voto ${voto.description} atualizado com sucesso!`, MensagemTipo.SUCCESS);

                const index = votos.findIndex(v => v.id === voto.id);
                if (index !== -1) votos[index] = tipoVotoAtualizado;
            } else {
                // Cria novo voto
                const novoVoto = {
                    name: inputNome.value.trim(),
                    description: inputDescricao.value.trim(),
                    color: inputCor.value,
                    emoji: inputEmoji.value,
                    active: true
                };
                
                const tipoVotoNovo = await criarTipoVoto(novoVoto);
                criarMensagem(`Voto ${novoVoto.description} criado com sucesso!`, MensagemTipo.SUCCESS);

                votos.push(tipoVotoNovo);
            }
        } catch(err) {
            if (err instanceof ApiError) {
                criarMensagem(err.detail || "Erro ao cadastrar tipo de voto.", MensagemTipo.ERROR);
            } else {
                criarMensagem("Erro de conexão com o servidor.", MensagemTipo.ERROR);
            }
        }

        renderVotos(ordenarVotosPorDescricao(votos));
        fecharModal(modal);
    };

    // fechar modal
    modal.querySelector('.close').onclick = () => fecharModal(modal);
    modal.querySelector('.btn-cancelar').onclick = () => fecharModal(modal);
    modal.onclick = e => { if (e.target === modal) fecharModal(modal); };
}

function fecharModal(modal) {
    modal.classList.remove('ativo');
    setTimeout(() => modal.classList.add('inativo'), 300); 
}

// Emoji Picker
const btnEmoji = document.getElementById("btn-emoji");
const picker = document.getElementById("emoji-picker");

btnEmoji.addEventListener("click", (e) => {
    e.stopPropagation(); // evita fechar o picker imediatamente
    if (picker.classList.contains("inativo")) {
        picker.innerHTML = "";

        emojis.forEach(emoji => {
            const span = document.createElement("span");
            span.textContent = emoji;
            span.addEventListener("click", () => {
                document.getElementById("emoji-input").value = emoji;
                picker.classList.add("inativo");
                document.getElementById("emoji-input").dispatchEvent(new Event('input')); // atualiza preview
            });
            picker.appendChild(span);
        });
        picker.classList.remove("inativo");
    } else {
        picker.classList.add("inativo");
    }
});

document.addEventListener("click", () => {
    picker.classList.add("inativo");
});

// Inputs de cor
const inputColor = document.querySelector('.campo-cor-inputs input[type="color"]');
const inputColorText = document.querySelector('.campo-cor-inputs input[type="text"]');
const previewDescricao = document.querySelector('#preview .descricao .secundario');

// Atualiza input text quando muda o color picker
inputColor.addEventListener('input', () => {
    inputColorText.value = inputColor.value.toUpperCase();
    previewDescricao.style.color = inputColor.value;
});

// Atualiza color picker quando muda o text input (apenas se for válido)
inputColorText.addEventListener('input', () => {
    // Regex simples para checar hexadecimal válido
    if (/^#([0-9A-Fa-f]{6})$/.test(inputColorText.value)) {
        inputColor.value = inputColorText.value;
        previewDescricao.style.color = inputColorText.value;
    }
});