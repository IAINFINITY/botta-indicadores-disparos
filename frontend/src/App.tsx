"use client";

import { useEffect, useState } from "react";
import { getDashboardData } from "./services/dashboard";
import type {
  AccumulatedDay,
  DashboardData,
  FunnelStage,
  RecentConversation,
  TopicSummary,
} from "./types/dashboard";

const shellClass =
  "mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8";
const panelClass =
  "rounded-[28px] border border-[rgba(55,42,24,0.12)] bg-[rgba(255,251,244,0.76)] p-6 shadow-[0_18px_50px_rgba(46,30,9,0.1)] backdrop-blur-[16px] sm:p-7";
const softCardClass =
  "rounded-[22px] border border-[rgba(32,23,13,0.08)] bg-[#fff9f0] p-5";
const sectionTitleClass =
  "font-[family-name:var(--font-display)] text-[clamp(1.6rem,2.4vw,2.4rem)] leading-[1.05] tracking-tight text-[#20170d]";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusClassName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function getAccentBarClass(accent: "sun" | "mint" | "coral" | "ink"): string {
  switch (accent) {
    case "mint":
      return "bg-[#2d8666]";
    case "coral":
      return "bg-[#dc6a4d]";
    case "ink":
      return "bg-[#2d3f66]";
    case "sun":
    default:
      return "bg-[#ef9b28]";
  }
}

function getStatusClass(status: string): string {
  const normalized = getStatusClassName(status);
  switch (normalized) {
    case "quente":
      return "bg-[rgba(239,155,40,0.14)] text-[#9a5b00]";
    case "em-analise":
      return "bg-[rgba(45,63,102,0.12)] text-[#2d3f66]";
    case "resolvido":
      return "bg-[rgba(45,134,102,0.14)] text-[#1d6248]";
    default:
      return "bg-[rgba(32,23,13,0.12)] text-[#20170d]";
  }
}

interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
  accent: "sun" | "mint" | "coral" | "ink";
}

function MetricCard({ label, value, helper, accent }: MetricCardProps) {
  return (
    <article className={`${softCardClass} min-h-[170px]`}>
      <div className={`mb-4 h-1.5 w-14 rounded-full ${getAccentBarClass(accent)}`} />
      <div className="flex h-[calc(100%-1rem)] flex-col justify-between">
        <span className="text-[0.95rem] leading-6 text-[#6f604d]">{label}</span>
        <strong className="my-4 font-[family-name:var(--font-display)] text-[clamp(2rem,2vw,2.8rem)] leading-none tracking-tight text-[#20170d]">
          {value}
        </strong>
        <span className="text-[0.95rem] leading-6 text-[#6f604d]">{helper}</span>
      </div>
    </article>
  );
}

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description: string;
}

function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="mb-5">
      <span className="mb-3 inline-flex items-center gap-2 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[#dc6a4d]">
        {eyebrow}
      </span>
      <h2 className={`${sectionTitleClass} mb-2`}>{title}</h2>
      <p className="m-0 leading-6 text-[#6f604d]">{description}</p>
    </div>
  );
}

interface BarChartProps {
  items: AccumulatedDay[];
}

function BarChart({ items }: BarChartProps) {
  const maxValue = Math.max(1, ...items.map((item) => item.acumulado));

  return (
    <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.52),rgba(250,239,220,0.74))] p-3 pb-1">
      <div className="grid min-h-[220px] grid-cols-7 items-end gap-2 sm:min-h-[300px] sm:gap-3">
        {items.map((item) => (
          <div key={item.day} className="grid justify-items-center gap-2">
            <div
              className="flex min-h-12 w-full items-start justify-center rounded-[22px_22px_10px_10px] bg-[linear-gradient(180deg,#2d8666,#8cc4a9)] pt-3 font-bold text-[#fff9ef] shadow-[inset_0_-14px_20px_rgba(255,255,255,0.16)]"
              style={{ height: `${(item.acumulado / maxValue) * 100}%` }}
            >
              <span className="text-[0.85rem] sm:text-[1rem]">{formatNumber(item.acumulado)}</span>
            </div>
            <small className="text-[#6f604d]">{item.day}</small>
            <strong className="text-[#6f604d]">+{item.novasConversas}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TopicListProps {
  topics: TopicSummary[];
}

function TopicList({ topics }: TopicListProps) {
  return (
    <div className="grid gap-3">
      {topics.map((topic) => (
        <article
          key={topic.name}
          className="rounded-[22px] border border-[rgba(55,42,24,0.12)] bg-[rgba(255,250,241,0.82)] p-4 sm:p-[18px]"
        >
          <div className="flex items-start justify-between gap-4">
            <strong className="mb-1 block text-[#20170d]">{topic.name}</strong>
            <span className="font-[family-name:var(--font-display)] text-[1.1rem] text-[#20170d]">
              {topic.share}%
            </span>
          </div>
          <div className="my-3 h-2 overflow-hidden rounded-full bg-[rgba(32,23,13,0.08)]">
            <span
              className="block h-full rounded-full bg-[linear-gradient(90deg,#ef9b28,#dc6a4d)]"
              style={{ width: `${topic.share}%` }}
            />
          </div>
          <p className="m-0 leading-6 text-[#20170d] opacity-85">{topic.resume}</p>
        </article>
      ))}
    </div>
  );
}

interface FunnelProps {
  stages: FunnelStage[];
}

function Funnel({ stages }: FunnelProps) {
  const maxValue = Math.max(1, ...stages.map((stage) => stage.value));

  return (
    <div className="grid gap-3">
      {stages.map((stage) => (
        <div
          key={stage.label}
          className="rounded-[20px] border border-[rgba(55,42,24,0.12)] bg-[rgba(255,250,241,0.82)] p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <span className="text-[#20170d]">{stage.label}</span>
            <strong className="font-[family-name:var(--font-display)] text-[#20170d]">
              {formatNumber(stage.value)}
            </strong>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(32,23,13,0.08)]">
            <span
              className="block h-full rounded-full bg-[linear-gradient(90deg,#ef9b28,#dc6a4d)]"
              style={{ width: `${(stage.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ConversationFeedProps {
  items: RecentConversation[];
}

function ConversationFeed({ items }: ConversationFeedProps) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article
          key={`${item.patient}-${item.time}`}
          className="rounded-[22px] border border-[rgba(55,42,24,0.12)] bg-[rgba(255,250,241,0.82)] p-4 sm:p-[18px]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <strong className="mb-1 block text-[#20170d]">{item.patient}</strong>
              <span className="text-[0.92rem] text-[#6f604d]">
                {item.channel} • {item.topic}
              </span>
            </div>
            <span
              className={`rounded-full px-3 py-2 text-[0.82rem] font-bold whitespace-nowrap ${getStatusClass(
                item.status,
              )}`}
            >
              {item.status}
            </span>
          </div>
          <p className="mb-2 mt-4 leading-6 text-[#20170d]">{item.lastMessage}</p>
          <small className="text-[#6f604d]">{item.time}</small>
        </article>
      ))}
    </div>
  );
}

export default function App() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await getDashboardData();

        if (active) {
          setDashboard(response);
        }
      } catch (loadError) {
        if (active) {
          setDashboard(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Não foi possível carregar o dashboard.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [retryCount]);

  if (loading) {
    return (
      <main className={`${shellClass} grid min-h-screen place-items-center`}>
        <div className={`${panelClass} w-full max-w-[540px]`}>
          <span className="mb-3 inline-flex items-center gap-2 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[#dc6a4d]">
            Botta Indicadores
          </span>
          <h1 className="m-0 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight text-[#20170d]">
            Carregando dados da operacao...
          </h1>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={`${shellClass} grid min-h-screen place-items-center`}>
        <div className={`${panelClass} w-full max-w-[540px]`}>
          <span className="mb-3 inline-flex items-center gap-2 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[#dc6a4d]">
            Botta Indicadores
          </span>
          <h1 className="m-0 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight text-[#20170d]">
            Nao conseguimos carregar o dashboard
          </h1>
          <p className="mt-4 leading-6 text-[#6f604d]">{error}</p>
          <button
            type="button"
            onClick={() => setRetryCount((current) => current + 1)}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#20170d] px-5 py-3 text-sm font-semibold text-[#fff9ef] transition hover:bg-[#2d3f66]"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <main className={shellClass}>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="mb-2 inline-flex items-center gap-2 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[#dc6a4d]">
            Botta Indicadores
          </span>
          <h1 className={`${sectionTitleClass} text-[clamp(2rem,3vw,3rem)]`}>
            Dashboard de disparos, conversas e visão operacional
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[rgba(55,42,24,0.12)] bg-[rgba(255,250,241,0.82)] px-3 py-2 text-[0.82rem] font-semibold text-[#20170d] shadow-[0_10px_28px_rgba(46,30,9,0.08)]">
            Chatwoot ativo
          </span>
        </div>
      </header>

      <section className="mb-5 grid gap-5 lg:grid-cols-[1.5fr_minmax(280px,0.8fr)]">
        <div className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,rgba(32,23,13,0.95),rgba(45,63,102,0.92)),linear-gradient(180deg,rgba(239,155,40,0.25),transparent)] p-9 text-[#fff9ef] shadow-[0_18px_50px_rgba(46,30,9,0.1)] sm:p-10">
          <div className="absolute inset-auto -bottom-12 -right-8 h-[220px] w-[220px] rounded-full bg-[rgba(239,155,40,0.16)] blur-[6px]" />
          <div className="relative z-10 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#fff9ef]">
              Painel executivo
            </span>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#fff9ef]">
              Dados reais
            </span>
          </div>
          <h2 className="relative z-10 mt-5 max-w-[12ch] font-[family-name:var(--font-display)] text-[clamp(2.4rem,4vw,4.5rem)] leading-[1.02] tracking-tight">
            Botta Indicadores
          </h2>
          <p className="relative z-10 mt-5 max-w-[54ch] leading-6 opacity-90">
            Dashboard de disparos, conversas e visão operacional conectado ao
            Chatwoot para leitura real da operação, com foco em tração,
            engajamento e acompanhamento das últimas interações.
          </p>
        </div>

        <div className="flex flex-col justify-end rounded-[28px] border border-[rgba(55,42,24,0.12)] bg-[linear-gradient(180deg,rgba(255,248,234,0.92),rgba(246,232,209,0.78)),rgba(255,251,244,0.76)] p-7 shadow-[0_18px_50px_rgba(46,30,9,0.1)] backdrop-blur-[16px]">
          <span className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[#dc6a4d]">
            Última atualização
          </span>
          <strong className="mt-3 font-[family-name:var(--font-display)] text-[1.65rem] leading-tight tracking-tight text-[#20170d]">
            {formatDateTime(dashboard.updatedAt)}
          </strong>
          <p className="m-0 mt-2 leading-6 text-[#20170d] opacity-85">
            Dados servidos pela API do backend com base real do Chatwoot.
          </p>
        </div>
      </section>

      <section className="mb-5 grid gap-5 lg:grid-cols-2">
        <div className={panelClass}>
          <SectionHeading
            eyebrow="Botta Indicadores"
            title="Saúde da operação de disparos"
            description="Os indicadores principais já estão separados para o time bater o olho e entender tração e qualidade do contato."
          />

          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard
              label="Quantidade de disparos realizados"
              value={formatNumber(dashboard.summary.disparosRealizados)}
              helper="Volume total enviado no período"
              accent="sun"
            />
            <MetricCard
              label="Quantidade de contatos que interagiram"
              value={formatNumber(dashboard.summary.contatosInteragiram)}
              helper={`${formatDecimal(dashboard.summary.taxaEngajamento)}% de engajamento`}
              accent="mint"
            />
            <MetricCard
              label="Média de interações por contato"
              value={formatDecimal(dashboard.summary.mediaInteracoesPorContato)}
              helper="Indica profundidade das conversas"
              accent="coral"
            />
          </div>
        </div>

        <div className={panelClass}>
          <SectionHeading
            eyebrow="Chatwoot"
            title="Evolucao das novas conversas"
            description="Leitura acumulada para identificar picos, sazonalidade e o ritmo de crescimento do volume ao longo da janela analisada."
          />
          <BarChart items={dashboard.acumuladoDiario} />
        </div>
      </section>

      <section className="mb-5 grid gap-5 lg:grid-cols-2">
        <div className={panelClass}>
          <SectionHeading
            eyebrow="Tópicos tratados"
            title="Resumo temático das conversas"
            description="Uma leitura rápida dos principais assuntos ajuda a orientar campanhas, atendimento humano e próximos testes."
          />
          <TopicList topics={dashboard.topicos} />
        </div>

        <div className={panelClass}>
          <SectionHeading
            eyebrow="Panorama"
            title="Panorama operacional"
            description="Números de acompanhamento para saber o que foi respondido, o que precisa de apoio humano e onde estão as oportunidades."
          />

          <div className="grid gap-3 md:grid-cols-2">
            <MetricCard
              label="Total de conversas"
              value={formatNumber(dashboard.overview.totalConversas)}
              helper="Base consolidada no período"
              accent="sun"
            />
            <MetricCard
              label="Respondidas"
              value={formatNumber(dashboard.overview.respondidas)}
              helper="Fluxos concluídos ou bem encaminhados"
              accent="mint"
            />
            <MetricCard
              label="Aguardando humano"
              value={formatNumber(dashboard.overview.aguardandoHumano)}
              helper="Casos para atendimento do time"
              accent="coral"
            />
            <MetricCard
              label="Oportunidades"
              value={formatNumber(dashboard.overview.oportunidades)}
              helper="Leads aquecidos ou retomadas"
              accent="ink"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className={panelClass}>
          <SectionHeading
            eyebrow="Funil"
            title="Da entrega ao encaminhamento"
            description="Uma leitura simples do funil ajuda a alinhar marketing, automação e operação comercial."
          />
          <Funnel stages={dashboard.funil} />
        </div>

        <div className={panelClass}>
          <SectionHeading
            eyebrow="Conversas recentes"
            title="Fila de acompanhamento"
            description="Bloco visual para o time entender rapidamente contexto, urgência e assunto das últimas interações."
          />
          <ConversationFeed items={dashboard.conversasRecentes} />
        </div>
      </section>
    </main>
  );
}
