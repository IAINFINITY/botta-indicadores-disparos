"use client";

import { useCallback, useEffect, useState } from "react";
import { getConversationThread, getDashboardData } from "./services/dashboard";
import type {
  AccumulatedDay,
  ConversationContact,
  ConversationThread,
  DashboardData,
  FunnelStage,
  RecentConversation,
  ThreadAuthor,
  ThreadMessage,
  TopicSummary,
} from "./types/dashboard";

const PERIOD_OPTIONS: { label: string; days: number }[] = [
  { label: "24h", days: 1 },
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
];

type DrilldownView = "disparos" | "interacoes" | "engajados" | "oportunidades";

const DRILLDOWN_META: Record<DrilldownView, { eyebrow: string; noun: string }> = {
  disparos: { eyebrow: "Disparos realizados", noun: "disparos enviados no período" },
  interacoes: { eyebrow: "Interações no período", noun: "contatos que interagiram no período" },
  engajados: { eyebrow: "Clientes engajados", noun: "contatos que interagiram" },
  oportunidades: { eyebrow: "Oportunidades", noun: "leads em aberto" },
};

function filterContacts(view: DrilldownView, contacts: ConversationContact[]): ConversationContact[] {
  if (view === "disparos") {
    return contacts.filter((contact) => contact.disparoNoPeriodo);
  }
  if (view === "interacoes") {
    return contacts.filter((contact) => contact.interagiuNoPeriodo);
  }
  if (view === "engajados") {
    return contacts.filter((contact) => contact.respondeu);
  }
  if (view === "oportunidades") {
    return contacts.filter((contact) => !contact.aguardandoHumano);
  }
  return contacts;
}

const STATUS_LEGEND: { status: string; meaning: string }[] = [
  { status: "quente", meaning: "ainda sem resposta do contato" },
  { status: "em análise", meaning: "respondeu e aguarda atendimento humano" },
  { status: "resolvido", meaning: "respondeu e fluxo encaminhado" },
];

const shellClass =
  "mx-auto w-full max-w-[1240px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8";
const panelClass =
  "rounded-[24px] border border-[rgba(82,117,191,0.16)] bg-[rgba(255,255,255,0.85)] p-5 shadow-[0_14px_40px_rgba(46,51,64,0.10)] backdrop-blur-[12px] sm:p-6";
const softCardClass =
  "rounded-[18px] border border-[rgba(46,51,64,0.08)] bg-[#f5f8fc] p-4 sm:p-5";
const sectionTitleClass =
  "font-[family-name:var(--font-display)] text-[clamp(1.35rem,2.2vw,1.9rem)] leading-[1.1] tracking-tight text-[#2e3340]";

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

function formatShortDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
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
      return "bg-[#2e9e8f]";
    case "coral":
      return "bg-[#78c8f0]";
    case "ink":
      return "bg-[#2e3340]";
    case "sun":
    default:
      return "bg-[#5275bf]";
  }
}

function getStatusClass(status: string): string {
  const normalized = getStatusClassName(status);
  switch (normalized) {
    case "quente":
      return "bg-[rgba(120,200,240,0.18)] text-[#1e6fa8]";
    case "em-analise":
      return "bg-[rgba(82,117,191,0.14)] text-[#3a57a0]";
    case "resolvido":
      return "bg-[rgba(46,158,143,0.16)] text-[#1c7a6e]";
    default:
      return "bg-[rgba(46,51,64,0.12)] text-[#2e3340]";
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
    <article className={softCardClass}>
      <div className={`mb-3 h-1.5 w-10 rounded-full ${getAccentBarClass(accent)}`} />
      <span className="block text-[0.82rem] leading-5 text-[#697586]">{label}</span>
      <strong className="my-2 block font-[family-name:var(--font-display)] text-[clamp(1.6rem,4vw,2.1rem)] leading-none tracking-tight text-[#2e3340]">
        {value}
      </strong>
      <span className="block text-[0.8rem] leading-5 text-[#697586]">{helper}</span>
    </article>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  helper: string;
  accent: "sun" | "mint" | "coral" | "ink";
  onClick?: () => void;
  actionLabel?: string;
}

function KpiCard({ label, value, helper, accent, onClick, actionLabel }: KpiCardProps) {
  const inner = (
    <>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${getAccentBarClass(accent)}`} />
        <span className="text-[0.72rem] font-semibold uppercase leading-tight tracking-[0.08em] text-[#697586]">
          {label}
        </span>
      </div>
      <strong className="mt-3 block font-[family-name:var(--font-display)] text-[clamp(1.7rem,5vw,2.3rem)] leading-none tracking-tight text-[#2e3340]">
        {value}
      </strong>
      <span className="mt-2 block text-[0.82rem] leading-5 text-[#697586]">{helper}</span>
      {actionLabel ? (
        <span className="mt-2 inline-flex items-center gap-1 text-[0.78rem] font-semibold text-[#2e9e8f]">
          {actionLabel} <span aria-hidden>→</span>
        </span>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${softCardClass} w-full cursor-pointer text-left transition hover:border-[#5275bf] hover:shadow-[0_12px_30px_rgba(82,117,191,0.18)]`}
      >
        {inner}
      </button>
    );
  }

  return <article className={softCardClass}>{inner}</article>;
}

interface PeriodFilterProps {
  value: number;
  busy: boolean;
  onChange: (days: number) => void;
}

function PeriodFilter({ value, busy, onChange }: PeriodFilterProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-[rgba(46,51,64,0.12)] bg-[rgba(255,255,255,0.9)] p-1">
      {PERIOD_OPTIONS.map((option) => {
        const active = option.days === value;
        return (
          <button
            key={option.days}
            type="button"
            onClick={() => onChange(option.days)}
            disabled={busy}
            aria-pressed={active}
            className={`rounded-full px-3 py-1.5 text-[0.78rem] font-semibold transition disabled:opacity-60 ${
              active ? "bg-[#5275bf] text-[#ffffff]" : "text-[#697586] hover:text-[#2e3340]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function getThreadAuthorMeta(author: ThreadAuthor): { label: string; bubble: string; row: string } {
  switch (author) {
    case "infinity":
      return { label: "Dr. Bem Estar (IA)", bubble: "bg-[#5275bf] text-[#ffffff]", row: "justify-end" };
    case "equipe":
      return { label: "Equipe", bubble: "bg-[#2e3340] text-[#ffffff]", row: "justify-end" };
    case "sistema":
      return { label: "Sistema", bubble: "bg-[rgba(46,51,64,0.06)] text-[#697586]", row: "justify-center" };
    case "contato":
    default:
      return { label: "Cliente", bubble: "bg-[#e6f4fc] text-[#2e3340]", row: "justify-start" };
  }
}

function StatusLegend() {
  return (
    <div className="mb-3 grid gap-1.5 rounded-[14px] border border-[rgba(46,51,64,0.10)] bg-[#f5f8fc] p-3">
      {STATUS_LEGEND.map((item) => (
        <div key={item.status} className="flex items-center gap-2 text-[0.78rem] text-[#697586]">
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${getStatusClass(item.status)}`}
          >
            {item.status}
          </span>
          <span>{item.meaning}</span>
        </div>
      ))}
    </div>
  );
}

interface EngagedListProps {
  items: ConversationContact[];
  onSelect: (conversation: ConversationContact) => void;
  loadingId: number | null;
  emptyLabel: string;
}

function EngagedList({ items, onSelect, loadingId, emptyLabel }: EngagedListProps) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-[0.92rem] text-[#697586]">{emptyLabel}</p>;
  }

  return (
    <div className="grid gap-2.5">
      <StatusLegend />
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item)}
          disabled={loadingId !== null}
          className="w-full rounded-[16px] border border-[rgba(46,51,64,0.12)] bg-[#f5f8fc] p-4 text-left transition hover:border-[#2e9e8f] disabled:opacity-60"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <strong className="block truncate text-[#2e3340]">{item.patient}</strong>
              <span className="text-[0.86rem] text-[#697586]">
                {item.channel} • {item.topic}
              </span>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[0.74rem] font-bold ${getStatusClass(item.status)}`}
            >
              {item.status}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-[0.9rem] leading-5 text-[#2e3340] opacity-85">
            {item.lastMessage}
          </p>
          <div className="mt-2 flex items-center justify-between text-[0.76rem] text-[#697586]">
            <span>{item.interacoes} interaç{item.interacoes === 1 ? "ão" : "ões"}</span>
            <span>{item.time}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

interface ThreadViewProps {
  thread: ConversationThread | null;
  loading: boolean;
  error: string | null;
}

function ThreadView({ thread, loading, error }: ThreadViewProps) {
  if (loading) {
    return <p className="py-6 text-center text-[0.92rem] text-[#697586]">Carregando conversa…</p>;
  }
  if (error) {
    return <p className="py-6 text-center text-[0.92rem] text-[#ca1a20]">{error}</p>;
  }
  if (!thread || thread.messages.length === 0) {
    return <p className="py-6 text-center text-[0.92rem] text-[#697586]">Sem mensagens nesta conversa.</p>;
  }

  return (
    <div className="grid gap-2.5">
      {thread.messages.map((message: ThreadMessage) => {
        const meta = getThreadAuthorMeta(message.author);
        return (
          <div key={message.id} className={`flex ${meta.row}`}>
            <div className={`max-w-[85%] rounded-[16px] px-3.5 py-2.5 ${meta.bubble}`}>
              <span className="block text-[0.66rem] font-semibold uppercase tracking-[0.08em] opacity-70">
                {meta.label}
              </span>
              <p className="mt-1 whitespace-pre-wrap text-[0.92rem] leading-5">{message.content}</p>
              <span className="mt-1 block text-right text-[0.66rem] opacity-70">{message.time}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface EngagedDrilldownProps {
  eyebrow: string;
  noun: string;
  items: ConversationContact[];
  thread: ConversationThread | null;
  loadingId: number | null;
  error: string | null;
  onSelect: (conversation: ConversationContact) => void;
  onBack: () => void;
  onClose: () => void;
}

function EngagedDrilldown({
  eyebrow,
  noun,
  items,
  thread,
  loadingId,
  error,
  onSelect,
  onBack,
  onClose,
}: EngagedDrilldownProps) {
  const showThread = loadingId !== null || thread !== null || error !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(20,28,40,0.45)] backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-[24px] border border-[rgba(82,117,191,0.16)] bg-[#ffffff] shadow-[0_20px_60px_rgba(20,28,40,0.22)] sm:rounded-[24px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[rgba(46,51,64,0.10)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            {showThread ? (
              <button
                type="button"
                onClick={onBack}
                aria-label="Voltar"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[rgba(46,51,64,0.14)] text-[#2e3340] transition hover:bg-[rgba(46,51,64,0.05)]"
              >
                ←
              </button>
            ) : null}
            <div className="min-w-0">
              <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[#5275bf]">
                {eyebrow}
              </span>
              <strong className="block truncate text-[#2e3340]">
                {showThread
                  ? thread?.patient || "Conversa"
                  : `${items.length} ${noun}`}
              </strong>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[rgba(46,51,64,0.14)] text-[#2e3340] transition hover:bg-[rgba(46,51,64,0.05)]"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {showThread ? (
            <ThreadView thread={thread} loading={loadingId !== null} error={error} />
          ) : (
            <EngagedList
              items={items}
              onSelect={onSelect}
              loadingId={loadingId}
              emptyLabel={`Nenhum registro de ${noun} no período selecionado.`}
            />
          )}
        </div>
      </div>
    </div>
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
      <span className="mb-3 inline-flex items-center gap-2 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[#5275bf]">
        {eyebrow}
      </span>
      <h2 className={`${sectionTitleClass} mb-2`}>{title}</h2>
      <p className="m-0 leading-6 text-[#697586]">{description}</p>
    </div>
  );
}

interface BarChartProps {
  items: AccumulatedDay[];
}

function BarChart({ items }: BarChartProps) {
  const maxValue = Math.max(1, ...items.map((item) => item.acumulado));

  return (
    <div className="rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.6),rgba(237,243,250,0.85))] p-3 pb-1">
      <div className="grid min-h-[220px] grid-cols-7 items-end gap-2 sm:min-h-[300px] sm:gap-3">
        {items.map((item) => (
          <div key={item.day} className="grid justify-items-center gap-2">
            <div
              className="flex min-h-12 w-full items-start justify-center rounded-[22px_22px_10px_10px] bg-[linear-gradient(180deg,#5275bf,#78c8f0)] pt-3 font-bold text-[#ffffff] shadow-[inset_0_-14px_20px_rgba(255,255,255,0.16)]"
              style={{ height: `${(item.acumulado / maxValue) * 100}%` }}
            >
              <span className="text-[0.85rem] sm:text-[1rem]">{formatNumber(item.acumulado)}</span>
            </div>
            <small className="text-[#697586]">{item.day}</small>
            <strong className="text-[#697586]">+{item.novasConversas}</strong>
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
          className="rounded-[22px] border border-[rgba(46,51,64,0.12)] bg-[rgba(255,255,255,0.9)] p-4 sm:p-[18px]"
        >
          <div className="flex items-start justify-between gap-4">
            <strong className="mb-1 block text-[#2e3340]">{topic.name}</strong>
            <span className="font-[family-name:var(--font-display)] text-[1.1rem] text-[#2e3340]">
              {topic.share}%
            </span>
          </div>
          <div className="my-3 h-2 overflow-hidden rounded-full bg-[rgba(46,51,64,0.08)]">
            <span
              className="block h-full rounded-full bg-[linear-gradient(90deg,#5275bf,#78c8f0)]"
              style={{ width: `${topic.share}%` }}
            />
          </div>
          <p className="m-0 leading-6 text-[#2e3340] opacity-85">{topic.resume}</p>
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
          className="rounded-[20px] border border-[rgba(46,51,64,0.12)] bg-[rgba(255,255,255,0.9)] p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <span className="text-[#2e3340]">{stage.label}</span>
            <strong className="font-[family-name:var(--font-display)] text-[#2e3340]">
              {formatNumber(stage.value)}
            </strong>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[rgba(46,51,64,0.08)]">
            <span
              className="block h-full rounded-full bg-[linear-gradient(90deg,#5275bf,#78c8f0)]"
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article
          key={`${item.patient}-${item.time}`}
          className="rounded-[22px] border border-[rgba(46,51,64,0.12)] bg-[rgba(255,255,255,0.9)] p-4 sm:p-[18px]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <strong className="mb-1 block text-[#2e3340]">{item.patient}</strong>
              <span className="text-[0.92rem] text-[#697586]">
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
          <p className="mb-2 mt-4 leading-6 text-[#2e3340]">{item.lastMessage}</p>
          <small className="text-[#697586]">{item.time}</small>
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
  const [days, setDays] = useState(1);

  const [drilldownView, setDrilldownView] = useState<DrilldownView | null>(null);
  const [activeThread, setActiveThread] = useState<ConversationThread | null>(null);
  const [threadLoadingId, setThreadLoadingId] = useState<number | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await getDashboardData(days);

        if (active) {
          setDashboard(response);
        }
      } catch (loadError) {
        if (active) {
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
  }, [retryCount, days]);

  const openDrilldown = useCallback((view: DrilldownView) => {
    setActiveThread(null);
    setThreadError(null);
    setThreadLoadingId(null);
    setDrilldownView(view);
  }, []);

  const closeDrilldown = useCallback(() => {
    setDrilldownView(null);
  }, []);

  const backToList = useCallback(() => {
    setActiveThread(null);
    setThreadError(null);
    setThreadLoadingId(null);
  }, []);

  const openThread = useCallback(async (conversation: ConversationContact) => {
    setThreadLoadingId(conversation.id);
    setThreadError(null);
    setActiveThread(null);

    try {
      const thread = await getConversationThread(conversation.id);
      setActiveThread(thread);
    } catch (threadErr) {
      setThreadError(
        threadErr instanceof Error ? threadErr.message : "Falha ao carregar a conversa.",
      );
    } finally {
      setThreadLoadingId(null);
    }
  }, []);

  useEffect(() => {
    if (!drilldownView) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrilldownView(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drilldownView]);

  if (loading && !dashboard) {
    return (
      <main className={`${shellClass} grid min-h-screen place-items-center`}>
        <div className={`${panelClass} w-full max-w-[540px]`}>
          <span className="mb-4 inline-flex items-center rounded-[14px] bg-[#2e3340] px-4 py-2.5 shadow-[0_8px_24px_rgba(46,51,64,0.18)]">
            <img src="/logo-drbemestar.png" alt="Dr. Bem-estar" className="h-8 w-auto" />
          </span>
          <span className="mb-3 block text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[#5275bf]">
            ANÁLISE DR BEM ESTAR
          </span>
          <h1 className="m-0 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight text-[#2e3340]">
            Carregando dados da operação...
          </h1>
        </div>
      </main>
    );
  }

  if (error && !dashboard) {
    return (
      <main className={`${shellClass} grid min-h-screen place-items-center`}>
        <div className={`${panelClass} w-full max-w-[540px]`}>
          <span className="mb-4 inline-flex items-center rounded-[14px] bg-[#2e3340] px-4 py-2.5 shadow-[0_8px_24px_rgba(46,51,64,0.18)]">
            <img src="/logo-drbemestar.png" alt="Dr. Bem-estar" className="h-8 w-auto" />
          </span>
          <span className="mb-3 block text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[#5275bf]">
            ANÁLISE DR BEM ESTAR
          </span>
          <h1 className="m-0 font-[family-name:var(--font-display)] text-[clamp(2rem,4vw,3rem)] leading-tight tracking-tight text-[#2e3340]">
            Nao conseguimos carregar o dashboard
          </h1>
          <p className="mt-4 leading-6 text-[#697586]">{error}</p>
          <button
            type="button"
            onClick={() => setRetryCount((current) => current + 1)}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#5275bf] px-5 py-3 text-sm font-semibold text-[#ffffff] transition hover:bg-[#3a57a0]"
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
      <header className="mb-6 flex flex-col gap-4 border-b border-[rgba(46,51,64,0.12)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="mb-3 inline-flex items-center rounded-[14px] bg-[#2e3340] px-3.5 py-2 shadow-[0_8px_24px_rgba(46,51,64,0.18)]">
            <img
              src="/logo-drbemestar.png"
              alt="Dr. Bem-estar"
              className="h-7 w-auto sm:h-8"
            />
          </span>
          <span className="mb-1.5 block text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#5275bf]">
            ANÁLISE DR BEM ESTAR
          </span>
          <h1 className={`${sectionTitleClass} text-[clamp(1.6rem,3vw,2.4rem)]`}>
            Dashboard Executivo
          </h1>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <PeriodFilter value={days} busy={loading} onChange={setDays} />
            {loading ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(46,158,143,0.12)] px-3 py-1.5 text-[0.76rem] font-semibold text-[#1c7a6e]">
                Atualizando…
              </span>
            ) : null}
            {error && dashboard ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(202,26,32,0.10)] px-3 py-1.5 text-[0.76rem] font-semibold text-[#ca1a20]">
                Falha ao atualizar
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(46,51,64,0.12)] bg-[rgba(255,255,255,0.9)] px-3 py-1.5 text-[0.78rem] font-semibold text-[#2e3340]">
              <span className="h-2 w-2 rounded-full bg-[#2e9e8f]" />
              Chatwoot ativo
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(46,51,64,0.12)] bg-[rgba(255,255,255,0.9)] px-3 py-1.5 text-[0.78rem] text-[#697586]">
              <span className="font-semibold text-[#2e3340]">Atualizado</span>
              <span className="hidden sm:inline">{formatDateTime(dashboard.updatedAt)}</span>
              <span className="sm:hidden">{formatShortDateTime(dashboard.updatedAt)}</span>
            </span>
          </div>
        </div>
      </header>

      <section className="mb-5">
        <div className="rounded-[24px] border border-[rgba(82,117,191,0.30)] bg-[linear-gradient(120deg,rgba(82,117,191,0.10),rgba(120,200,240,0.12))] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[#5275bf]">
              Últimas 24 horas
            </span>
            <span className="text-[0.74rem] text-[#697586]">
              Por data de envio · janela fixa, independe do filtro
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-8">
            <div>
              <strong className="block font-[family-name:var(--font-display)] text-[clamp(2rem,7vw,3rem)] leading-none tracking-tight text-[#2e3340]">
                {formatNumber((dashboard.ultimas24h ?? { chatsAbertos: 0 }).chatsAbertos)}
              </strong>
              <span className="mt-2 block text-[0.88rem] text-[#697586]">Disparos enviados nas últimas 24h</span>
            </div>
            <div>
              <strong className="block font-[family-name:var(--font-display)] text-[clamp(2rem,7vw,3rem)] leading-none tracking-tight text-[#1c7a6e]">
                {formatNumber((dashboard.ultimas24h ?? { comInteracao: 0 }).comInteracao)}
              </strong>
              <span className="mt-2 block text-[0.88rem] text-[#697586]">
                Tiveram interação · {formatDecimal((dashboard.ultimas24h ?? { taxaInteracao: 0 }).taxaInteracao)}%
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Disparos realizados"
          value={formatNumber(dashboard.summary.disparosNoPeriodo)}
          helper="Disparos enviados no período selecionado"
          accent="sun"
          onClick={() => openDrilldown("disparos")}
          actionLabel="ver contatos"
        />
        <KpiCard
          label="Interações no período"
          value={formatNumber(dashboard.summary.interacoesNoPeriodo)}
          helper="Contatos que interagiram dentro do filtro — mais recentes primeiro"
          accent="coral"
          onClick={() => openDrilldown("interacoes")}
          actionLabel="ver últimas"
        />
        <KpiCard
          label="Taxa de engajamento"
          value={`${formatDecimal(dashboard.summary.taxaEngajamento)}%`}
          helper={`${formatNumber(dashboard.summary.contatosInteragiram)} contatos interagiram`}
          accent="mint"
          onClick={() => openDrilldown("engajados")}
          actionLabel="ver conversas"
        />
        <KpiCard
          label="Interações por contato"
          value={formatDecimal(dashboard.summary.mediaInteracoesPorContato)}
          helper="Média de respostas do contato após o disparo (quanto maior, mais profunda a conversa)"
          accent="ink"
        />
        <KpiCard
          label="Oportunidades"
          value={formatNumber(dashboard.overview.oportunidades)}
          helper="Leads aquecidos ou retomadas"
          accent="sun"
          onClick={() => openDrilldown("oportunidades")}
          actionLabel="ver detalhes"
        />
      </section>

      <section className="mb-5 grid gap-4 lg:grid-cols-[1.4fr_1fr] lg:gap-5">
        <div className={panelClass}>
          <SectionHeading
            eyebrow="Chatwoot"
            title="Evolução das novas conversas"
            description="Leitura acumulada para identificar picos, sazonalidade e o ritmo de crescimento do volume."
          />
          <BarChart items={dashboard.acumuladoDiario} />
        </div>

        <div className={panelClass}>
          <SectionHeading
            eyebrow="Panorama"
            title="Status da operação"
            description="O que foi respondido, o que precisa de apoio humano e onde estão as oportunidades."
          />
          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="Total de conversas"
              value={formatNumber(dashboard.overview.totalConversas)}
              helper="Base consolidada no período"
              accent="sun"
            />
            <MetricCard
              label="Respondidas"
              value={formatNumber(dashboard.overview.respondidas)}
              helper="Fluxos bem encaminhados"
              accent="mint"
            />
            <MetricCard
              label="Aguardando humano"
              value={formatNumber(dashboard.overview.aguardandoHumano)}
              helper="Casos para o time"
              accent="coral"
            />
            <MetricCard
              label="Oportunidades"
              value={formatNumber(dashboard.overview.oportunidades)}
              helper="Leads aquecidos"
              accent="ink"
            />
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-4 lg:grid-cols-2 lg:gap-5">
        <div className={panelClass}>
          <SectionHeading
            eyebrow="Tópicos tratados"
            title="Resumo temático das conversas"
            description="Uma leitura rápida dos principais assuntos para orientar campanhas e atendimento."
          />
          <TopicList topics={dashboard.topicos} />
        </div>

        <div className={panelClass}>
          <SectionHeading
            eyebrow="Funil"
            title="Da entrega ao encaminhamento"
            description="Leitura simples do funil para alinhar marketing, automação e operação comercial."
          />
          <Funnel stages={dashboard.funil} />
        </div>
      </section>

      <section>
        <div className={panelClass}>
          <SectionHeading
            eyebrow="Conversas recentes"
            title="Fila de acompanhamento"
            description="Contexto, urgência e assunto das últimas interações para o time agir rápido."
          />
          <ConversationFeed items={dashboard.conversasRecentes} />
        </div>
      </section>

      {drilldownView ? (
        <EngagedDrilldown
          eyebrow={DRILLDOWN_META[drilldownView].eyebrow}
          noun={DRILLDOWN_META[drilldownView].noun}
          items={filterContacts(drilldownView, dashboard.contatos ?? [])}
          thread={activeThread}
          loadingId={threadLoadingId}
          error={threadError}
          onSelect={openThread}
          onBack={backToList}
          onClose={closeDrilldown}
        />
      ) : null}
    </main>
  );
}
