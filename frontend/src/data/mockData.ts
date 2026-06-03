import type { DashboardData } from "../types/dashboard";

export const mockDashboardData: DashboardData = {
  updatedAt: "2026-06-02T09:30:00-03:00",
  summary: {
    disparosRealizados: 14820,
    contatosInteragiram: 4268,
    mediaInteracoesPorContato: 3.7,
    taxaEngajamento: 28.8,
  },
  acumuladoDiario: [
    { day: "Seg", novasConversas: 182, acumulado: 182 },
    { day: "Ter", novasConversas: 209, acumulado: 391 },
    { day: "Qua", novasConversas: 241, acumulado: 632 },
    { day: "Qui", novasConversas: 196, acumulado: 828 },
    { day: "Sex", novasConversas: 264, acumulado: 1092 },
    { day: "Sab", novasConversas: 151, acumulado: 1243 },
    { day: "Dom", novasConversas: 97, acumulado: 1340 },
  ],
  topicos: [
    {
      name: "Agendamento de consulta",
      share: 34,
      resume:
        "Conversas focadas em disponibilidade, confirmacao de horario e retomada de pacientes que nao concluiram o agendamento.",
    },
    {
      name: "Duvidas sobre tratamentos",
      share: 27,
      resume:
        "Pacientes pedem explicacoes rapidas sobre procedimentos, beneficios, duracao e cuidados iniciais.",
    },
    {
      name: "Valores e condicoes",
      share: 21,
      resume:
        "Pedidos de orcamento, parcelamento e comparacao entre opcoes de atendimento ou pacote.",
    },
    {
      name: "Pos-atendimento",
      share: 18,
      resume:
        "Mensagens com feedback, orientacoes complementares e acompanhamento depois da consulta.",
    },
  ],
  overview: {
    totalConversas: 1340,
    respondidas: 1178,
    aguardandoHumano: 92,
    oportunidades: 70,
  },
  funil: [
    { label: "Receberam disparo", value: 14820 },
    { label: "Responderam", value: 4268 },
    { label: "Conversas qualificadas", value: 1664 },
    { label: "Encaminhadas ao time", value: 412 },
  ],
  conversasRecentes: [
    {
      patient: "Juliana M.",
      status: "Quente",
      channel: "WhatsApp",
      lastMessage: "Quero saber os horarios disponiveis para esta semana.",
      topic: "Agendamento de consulta",
      time: "09:12",
    },
    {
      patient: "Carlos R.",
      status: "Em analise",
      channel: "Infinity Chat",
      lastMessage: "Vocês conseguem me passar uma media de valor do tratamento?",
      topic: "Valores e condicoes",
      time: "08:46",
    },
    {
      patient: "Patricia S.",
      status: "Resolvido",
      channel: "WhatsApp",
      lastMessage: "Obrigada, ja consegui confirmar meu retorno.",
      topic: "Pos-atendimento",
      time: "08:15",
    },
    {
      patient: "Eduardo L.",
      status: "Quente",
      channel: "Infinity Chat",
      lastMessage: "Tenho duvida sobre como funciona o procedimento e o tempo de recuperacao.",
      topic: "Duvidas sobre tratamentos",
      time: "07:52",
    },
  ],
};
