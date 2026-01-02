# 🎬 Cinebaianos Web

![HTML](https://img.shields.io/badge/HTML-5-orange)
![CSS](https://img.shields.io/badge/CSS-3-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![Node.js](https://img.shields.io/badge/Node.js-20-green)

O **Cinebaianos Web** é a interface frontend do projeto Cinebaianos, feita em **HTML, CSS e JavaScript puro**, sem frameworks.  
Ele se conecta à **Cinebaianos API** para exibir/cadastrar filmes, votos, rankings e perfis de usuários, utilizando um **servidor Node.js como proxy**.

---

## 🛠 Tecnologias utilizadas

* **HTML5 + CSS3** – Estrutura e estilo do frontend.
* **JavaScript (ES6)** – Lógica do frontend.
* **Node.js + Express** – Servidor para servir arquivos estáticos e criar proxy da API.
* **dotenv** – Gerenciamento de variáveis de ambiente.
* **node-fetch** – Proxy de requisições para a API backend.
* **Nodemon** – Desenvolvimento com reload automático.

---

## 🌐 Funcionalidades principais

* Listar filmes assistidos e recentes.
* Registrar votos de usuários (Da Hora, Lixo, Não Assisti).
* Consultar rankings e estatísticas de usuários.
* Filtrar filmes por gêneros e votos.
* Proxy seguro para a API backend.
* Configuração de variáveis globais para frontend via `/config.js`.

---

## 🔧 Variáveis Globais

As variáveis abaixo são definidas no arquivo `.env` do Node.js e expostas para o frontend via `/config.js`:

```env
NODE_ENV=development          # 'development' ou 'production'
API_URL_DEV=http://localhost:8080/api
API_URL_PROD=https://cinebaianos-api-production.up.railway.app/api
PORT=3000
MY_DISCORD_ID=000000000000001
FILME_RECENTE_DIAS=15
```

---

## 🚀 Iniciar a aplicação

Como rodar o projeto localmente

```powershell
# 1️⃣ Clonar o repositório e entrar na pasta
git clone https://github.com/brunoreolon/cinebaianos-web.git
cd cinebaianos-web

# 2️⃣ Instalar dependências
npm install

# 4️⃣ Rodar em desenvolvimento
npm run dev

# 5️⃣ Rodar em produção
npm start
```