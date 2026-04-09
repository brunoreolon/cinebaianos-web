// Sistema de Doação - CineBaianos
import { DONATION_PIX_KEY, DONATION_PIX_NAME, DONATION_PIX_CITY } from '../../../config.js';

function resolvePixKeyFromEnvironment() {
    return normalizePixKey(DONATION_PIX_KEY);
}

function resolvePixNameFromEnvironment() {
    return normalizePixKey(DONATION_PIX_NAME) || 'CINEBAIANOS';
}

function resolvePixCityFromEnvironment() {
    return normalizePixKey(DONATION_PIX_CITY) || 'CIDADE';
}

export const donationService = {
    pixKey: resolvePixKeyFromEnvironment(),
    pixOwner: resolvePixNameFromEnvironment(),
    pixCity: resolvePixCityFromEnvironment(),

    getSuggestedValues() {
        return [
            { label: 'R$ 5', value: 5 },
            { label: 'R$ 10', value: 10 },
            { label: 'R$ 25', value: 25 },
            { label: 'R$ 50', value: 50 }
        ];
    },

    formatPixValue(amount) {
        if (!amount) return null;
        return parseFloat(amount).toFixed(2);
    }
};

let currentPixPayload = '';

function normalizePixKey(value) {
    return (value || '').trim();
}

/**
 * Inicializa o sistema de doação
 */
export function initDonationSystem() {
    const donationBtn = document.getElementById('btn-donate');
    const donationModal = document.getElementById('donation-modal');
    const closeDonationBtn = document.getElementById('close-donation-modal');
    const modalOverlay = document.querySelector('.donation-modal-overlay');

    if (!donationBtn) return;

    // Abrir modal
    donationBtn.addEventListener('click', () => {
        if (donationModal) {
            donationModal.classList.add('active');
            disableBodyScroll();
            renderDonationModal();
        }
    });

    // Fechar modal
    if (closeDonationBtn) {
        closeDonationBtn.addEventListener('click', () => {
            donationModal?.classList.remove('active');
            enableBodyScroll();
        });
    }

    // Fechar ao clicar fora (apenas no overlay)
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            // Só fecha se clicou no overlay, não no modal-content
            if (e.target === modalOverlay) {
                donationModal?.classList.remove('active');
                enableBodyScroll();
            }
        });
    }

}

/**
 * Desabilita scroll do body (quando modal está aberto)
 */
function disableBodyScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = getScrollbarWidth() + 'px';
}

/**
 * Habilita scroll do body (quando modal fecha)
 */
function enableBodyScroll() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
}

/**
 * Calcula a largura da scrollbar para evitar layout shift
 */
function getScrollbarWidth() {
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    document.body.appendChild(outer);

    const inner = document.createElement('div');
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    outer.parentNode.removeChild(outer);

    return scrollbarWidth;
}
function renderDonationModal() {
    const valuesContainer = document.getElementById('donation-values-buttons');
    if (!valuesContainer) return;

    const suggestedValues = donationService.getSuggestedValues();

    valuesContainer.innerHTML = '';
    suggestedValues.forEach(({ label, value }) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'donation-value-btn';
        btn.textContent = label;
        btn.dataset.value = value;

        btn.addEventListener('click', () => {
            document.querySelectorAll('.donation-value-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('donation-custom-input').value = value;
            atualizarPixComValor(value);
        });

        valuesContainer.appendChild(btn);
    });

    // Configurar campo customizado
    const customInput = document.getElementById('donation-custom-input');
    if (customInput) {
        customInput.oninput = (e) => {
            document.querySelectorAll('.donation-value-btn').forEach(b => b.classList.remove('active'));
            atualizarPixComValor(e.target.value);
        };
    }

    donationService.pixKey = resolvePixKeyFromEnvironment();
    donationService.pixOwner = resolvePixNameFromEnvironment();
    donationService.pixCity = resolvePixCityFromEnvironment();

    const pixText = document.getElementById('pix-key-display');
    if (pixText && !donationService.pixKey) {
        pixText.textContent = 'Chave PIX nao configurada. Defina DONATION_PIX_KEY no ambiente.';
    }

    // Configurar botão de copiar
    setupCopyPixButton();

    // Gerar QR inicial (sem valor pré-definido)
    atualizarPixComValor(null);
}

/**
 * Configura o botão de copiar PIX
 */
function setupCopyPixButton() {
    const copyBtn = document.getElementById('btn-copy-pix');
    const pixText = document.getElementById('pix-key-display');

    if (copyBtn && pixText && copyBtn.dataset.bound !== 'true') {
        copyBtn.dataset.bound = 'true';
        copyBtn.addEventListener('click', async () => {
            try {
                const text = currentPixPayload || pixText.textContent;
                if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    // Fallback para navegadores antigos
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                }

                // Feedback visual
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copiado!';
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
            } catch (err) {
                console.error('Erro ao copiar PIX:', err);
            }
        });
    }
}

function atualizarPixComValor(rawAmount) {
    if (!donationService.pixKey) {
        currentPixPayload = '';
        const pixText = document.getElementById('pix-key-display');
        if (pixText) {
            pixText.textContent = 'Chave PIX nao configurada. Defina DONATION_PIX_KEY no ambiente.';
        }
        generateQRCode('');
        return;
    }

    const amount = parseDonationAmount(rawAmount);
    currentPixPayload = buildPixPayload(donationService.pixKey, amount, donationService.pixOwner, donationService.pixCity);

    const pixText = document.getElementById('pix-key-display');
    if (pixText) {
        pixText.textContent = currentPixPayload;
    }

    generateQRCode(currentPixPayload);
}

function parseDonationAmount(rawValue) {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
        return null;
    }

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return null;
    }

    return parsed;
}

function buildPixPayload(pixKey, amount, merchantName = 'CINEBAIANOS', merchantCity = 'FEIRA') {
    const key = normalizePixKey(pixKey);
    if (!key) return '';

    const gui = tlv('00', 'BR.GOV.BCB.PIX');
    const chave = tlv('01', key);
    const merchantAccountInfo = tlv('26', `${gui}${chave}`);

    const payload = [
        tlv('00', '01'),
        merchantAccountInfo,
        tlv('52', '0000'),
        tlv('53', '986'),
        ...(amount ? [tlv('54', Number(amount).toFixed(2))] : []),
        tlv('58', 'BR'),
        tlv('59', sanitizeMerchantName(merchantName)),
        tlv('60', sanitizeMerchantCity(merchantCity)),
        tlv('62', tlv('05', '***'))
    ].join('');

    const withoutCrc = `${payload}6304`;
    const crc = crc16Ccitt(withoutCrc);
    return `${withoutCrc}${crc}`;
}

function tlv(id, value) {
    const length = String(value.length).padStart(2, '0');
    return `${id}${length}${value}`;
}

function sanitizeMerchantName(name) {
    const normalized = normalizePixKey(name).toUpperCase();
    return (normalized || 'CINEBAIANOS').slice(0, 25);
}

function sanitizeMerchantCity(city) {
    const normalized = normalizePixKey(city).toUpperCase();
    return (normalized || 'FEIRA').slice(0, 15);
}

function crc16Ccitt(payload) {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
            crc &= 0xffff;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}


/**
 * Mostra/esconde o botão de doação baseado no status de login
 */
export function updateDonationButtonVisibility(isLoggedIn) {
    const donationBtn = document.getElementById('btn-donate');
    if (donationBtn) {
        donationBtn.style.display = isLoggedIn ? 'flex' : 'none';
    }
}

/**
 * Gera o QR Code para o PIX
 */
function generateQRCode(value) {
    const qrCanvas = document.getElementById('donation-qrcode-canvas');
    const qrImg = document.getElementById('donation-qrcode-img');

    if (!qrCanvas || !qrImg) return;

    try {
        if (!value) {
            qrImg.alt = 'QR Code PIX indisponivel';
            qrImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23fff" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="12" font-family="Arial"%3EPIX nao configurado%3C/text%3E%3C/svg%3E';
            qrImg.style.display = 'block';
            qrImg.style.margin = '0 auto';
            return;
        }

        // Usar QRious (biblioteca carregada via CDN)
        if (typeof QRious !== 'undefined') {
            const qr = new QRious({
                element: qrCanvas,
                size: 200,
                value: value || donationService.pixKey,
                level: 'H',
                mime: 'image/png'
            });

            // Converter canvas para imagem
            qrImg.src = qrCanvas.toDataURL('image/png');
            qrImg.style.display = 'block';
            qrImg.style.margin = '0 auto';
        } else {
            console.warn('QRious não está carregado. Verifique o CDN.');
            // Fallback: mostrar uma imagem de placeholder
            qrImg.alt = 'QR Code PIX';
            qrImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23fff" width="200" height="200"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23ccc" font-size="14" font-family="Arial"%3EQR Code%3C/text%3E%3C/svg%3E';
        }
    } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
        qrImg.alt = 'Erro ao gerar QR Code';
    }
}
