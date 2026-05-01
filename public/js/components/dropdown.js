import { form, criarElemento, buildPerfilUrl } from '../global.js';
import { authService } from '../services/auth-service.js';

export function montarMenuUsuario(usuario, grupoAtual = null) {
    const avatarContainer = form.avatarContainer();
    const dropdownContainer = form.dropdownContainer();

    const divAvatar = criarElemento('div', ['avatar-wrapper']);

    const linkAvatar = criarElemento('a', ['link']);
    linkAvatar.href = '#';

    const img = criarElemento('img', ['avatar']);
    img.src = usuario.avatar || './assets/img/placeholder-avatar.png';

    const nomeUsuario = criarElemento('p', ['nome-usuario'], usuario.name);

    linkAvatar.append(img, nomeUsuario);
    divAvatar.appendChild(linkAvatar);
    avatarContainer.appendChild(divAvatar);

    const menu = criarElemento('div', ['dropdown-menu', 'border']);
    const currentGroupEntry = grupoAtual?.id ? `
                <li>
                    <a href="./detalhes-grupo.html?id=${grupoAtual.id}">
                        <i class="fa-solid fa-people-group space"></i>
                        Detalhes do grupo atual
                    </a>
                </li>
    ` : '';

    menu.innerHTML = `
        <nav>
            <ul>
                <li>
                    <a href="./meus-grupos.html">
                        <i class="fa-solid fa-layer-group space"></i>
                        Meus Grupos
                    </a>
                </li>
                ${currentGroupEntry}
                <li class="separator"></li>
                <li>
                    <a href="${buildPerfilUrl(usuario)}">
                        <i class="fa-regular fa-user space"></i>
                        Meu Perfil
                    </a>
                </li>
                <li>
                    <a href="./edicao-perfil.html?id=${encodeURIComponent(String(usuario?.id ?? ''))}">
                        <i class="fa-solid fa-gear space"></i>
                        Editar perfil
                    </a>
                </li>
                <li class="separator"></li>
                <li>
                    <a href="#" id="logout-link">
                        <i class="fa-solid fa-arrow-right-from-bracket space"></i>
                        <span class="vermelho">Sair</span>
                    </a>
                </li>
            </ul>
        </nav>
    `;

    dropdownContainer.appendChild(menu);

    const logoutLink = menu.querySelector('#logout-link');
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        authService.logout();
    });
}

export async function exibirMenuUsuario() {
    const avatarContainer = form.avatarContainer();
    const dropdownContainer = form.dropdownContainer();
    const menu = dropdownContainer.querySelector('.dropdown-menu');

    avatarContainer.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        menu.classList.toggle('active');
    });

    dropdownContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = e.target.closest('a');

        if (item) {
            menu.classList.remove('active');
        }
    });

    document.addEventListener('click', (e) => {
        if (!dropdownContainer.contains(e.target) && !avatarContainer.contains(e.target)) {
            menu.classList.remove('active');
        }
    });
}
