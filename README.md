# Botta Indicadores Disparos

Dashboard de disparos, conversas e overview operacional.

## Stack atual

- `Next.js`
- `React`
- `Tailwind`
- `TypeScript`

## Estrutura

- `frontend/` contem a interface do dashboard
- `backend/` fica reservado para a futura API e processamento
- `docker-compose.yml` sobe o frontend em container

## Rodar o frontend

```bash
cd frontend
npm install
npm run dev
```

## Build do frontend

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
http://localhost:3000
```

Para parar:

```bash
docker compose down
```

## Contexto atual

O frontend ainda usa dados mockados, mas agora a base ja esta migrada para Next e pronta para receber a integracao real com Chatwoot e a camada de IA no proprio codigo.
