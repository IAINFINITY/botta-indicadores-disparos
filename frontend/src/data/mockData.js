export const mockDashboardData = {
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
    { day: "Sáb", novasConversas: 151, acumulado: 1243 },
    { day: "Dom", novasConversas: 97, acumulado: 1340 },
  ],
  topicos: [
    {
      name: "Agendamento de consulta",
      share: 34,
      resume:
        "Conversas focadas em disponibilidade, confirmação de horário e retomada de pacientes que não concluíram o agendamento.",
    },
    {
      name: "Dúvidas sobre tratamentos",
      share: 27,
      resume:
        "Pacientes pedem explicações rápidas sobre procedimentos, benefícios, duração e cuidados iniciais.",
    },
    {
      name: "Valores e condições",
      share: 21,
      resume:
        "Pedidos de orçamento, parcelamento e comparação entre opções de atendimento ou pacote.",
    },
    {
      name: "Pós-atendimento",
      share: 18,
      resume:
        "Mensagens com feedback, orientações complementares e acompanhamento depois da consulta.",
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
      lastMessage: "Quero saber os horários disponíveis para esta semana.",
      topic: "Agendamento de consulta",
      time: "09:12",
    },
    {
      patient: "Carlos R.",
      status: "Em análise",
      channel: "Infinity Chat",
      lastMessage: "Vocês conseguem me passar uma média de valor do tratamento?",
      topic: "Valores e condições",
      time: "08:46",
    },
    {
      patient: "Patrícia S.",
      status: "Resolvido",
      channel: "WhatsApp",
      lastMessage: "Obrigada, já consegui confirmar meu retorno.",
      topic: "Pós-atendimento",
      time: "08:15",
    },
    {
      patient: "Eduardo L.",
      status: "Quente",
      channel: "Infinity Chat",
      lastMessage:
        "Tenho dúvida sobre como funciona o procedimento e o tempo de recuperação.",
      topic: "Dúvidas sobre tratamentos",
      time: "07:52",
    },
  ],
};
