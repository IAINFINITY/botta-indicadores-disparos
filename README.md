# Dr Bem Estar

Projeto full stack do dashboard de conversas do Dr Bem Estar.

## Estrutura

```text
.
├── backend/
│   └── README.md
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

## Frontend

Dashboard em React + Vite para acompanhar:

- scrapping e volume de conversas do Dr Bem Estar
- relatorio acumulativo diario de novas conversas no Infinity Chat
- overview operacional e temas mais tratados

### Rodar local sem Docker

```bash
cd frontend
npm install
npm run dev
```

### Build de producao

```bash
cd frontend
npm run build
```

## Rodar com Docker

Na raiz do projeto:

```bash
docker compose up --build -d
```

Depois acesse:

```text
http://localhost:5173
```

Para parar:

```bash
docker compose down
```

## Backend

A pasta `backend/` ficou separada para a equipe implementar a API, jobs de scrapping e integracao com banco sem misturar com a camada visual.

## Estrutura pensada para integracao

Os dados mockados estao em [mockData.js](</C:/Users/Silva/LENILSON/PROJETOS IA INFINITY/Dr BEM ESTAR/frontend/src/data/mockData.js:1>) e o ponto de entrada da futura integracao esta em [dashboard.js](</C:/Users/Silva/LENILSON/PROJETOS IA INFINITY/Dr BEM ESTAR/frontend/src/services/dashboard.js:1>).

Quando o backend estiver pronto, a troca principal deve ser substituir o retorno mockado por uma chamada real, mantendo o mesmo formato:

- `summary` para os cards principais
- `acumuladoDiario` para o grafico do Infinity Chat
- `topicos` para o resumo das conversas
- `overview`, `funil` e `conversasRecentes` para a visao operacional
