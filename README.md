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

## Melhorias futuras

### Refino dos "Principais questionamentos"

O card "Principais questionamentos" lista a primeira mensagem do contato apos o disparo,
agrupada e ordenada por frequencia em `buildQuestionamentos` (`backend/src/services/dashboardService.ts`).

Hoje essa lista pode incluir ruido que nao e uma duvida real do paciente, por exemplo:

- respostas automaticas do negocio (saudacoes, "estou em atendimento / fora do horario");
- mensagens com link de agendamento;
- textos muito longos (blocos institucionais em vez de pergunta).

Refino sugerido: aplicar um filtro em `buildQuestionamentos` antes do agrupamento para
descartar essas mensagens, por exemplo:

- ignorar mensagens que contenham URLs / links;
- ignorar mensagens acima de um limite de caracteres (ex.: > 280);
- manter uma lista de padroes de auto-resposta a serem descartados (saudacoes, ausencia).

Assim a lista passa a refletir apenas os questionamentos genuinos dos pacientes.
