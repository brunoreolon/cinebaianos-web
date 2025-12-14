import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos (public)
app.use(express.static(path.join(process.cwd(), 'public')));

// Gerar config.js dinamicamente para o front-end
app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  // O front-end sempre acessa via '/api', que é o proxy
  res.send(`
    export const API_URL = '/api';
    export const MY_DISCORD_ID = '${process.env.MY_DISCORD_ID}';
  `);
});

// Middleware para interpretar JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Proxy para API
app.use('/api', async (req, res) => {
  const apiUrl = process.env.NODE_ENV === 'production'
    ? process.env.API_URL_PROD
    : process.env.API_URL_DEV;

  const url = `${apiUrl}${req.originalUrl.replace('/api', '')}`;

  try {
    // Clonar headers, removendo apenas o que pode gerar CORS
    const headers = { ...req.headers };
    delete headers['host'];
    delete headers['origin'];
    
    const fetchOptions = {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? null : JSON.stringify(req.body),
    };

    const response = await fetch(url, fetchOptions);
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      res.status(response.status).json(data);
    } catch {
      res.status(response.status).send(text);
    }

  } catch (err) {
    console.error('Erro no proxy da API:', err);
    res.status(500).json({ error: err.message });
  }
});

// Inicializar servidor
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));