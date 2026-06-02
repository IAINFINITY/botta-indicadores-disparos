import { useEffect, useState } from "react";
import { getDashboardData } from "./services/dashboard";

function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDecimal(value) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusClassName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function MetricCard({ label, value, helper, accent }) {
  return (
    <article className={`metric-card accent-${accent}`}>
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
      <span className="metric-helper">{helper}</span>
    </article>
  );
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function BarChart({ items }) {
  const maxValue = Math.max(...items.map((item) => item.acumulado));

  return (
    <div className="chart-card">
      <div className="chart-grid">
        {items.map((item) => (
          <div className="chart-column" key={item.day}>
            <div
              className="chart-bar"
              style={{ height: `${(item.acumulado / maxValue) * 100}%` }}
            >
              <span>{formatNumber(item.acumulado)}</span>
            </div>
            <small>{item.day}</small>
            <strong>+{item.novasConversas}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopicList({ topics }) {
  return (
    <div className="topics-list">
      {topics.map((topic) => (
        <article className="topic-card" key={topic.name}>
          <div className="topic-header">
            <strong>{topic.name}</strong>
            <span>{topic.share}%</span>
          </div>
          <div className="topic-progress">
            <span style={{ width: `${topic.share}%` }} />
          </div>
          <p>{topic.resume}</p>
        </article>
      ))}
    </div>
  );
}

function Funnel({ stages }) {
  const maxValue = Math.max(...stages.map((stage) => stage.value));

  return (
    <div className="funnel">
      {stages.map((stage) => (
        <div className="funnel-row" key={stage.label}>
          <div className="funnel-meta">
            <span>{stage.label}</span>
            <strong>{formatNumber(stage.value)}</strong>
          </div>
          <div className="funnel-track">
            <span
              className="funnel-fill"
              style={{ width: `${(stage.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConversationFeed({ items }) {
  return (
    <div className="conversation-feed">
      {items.map((item) => (
        <article className="conversation-card" key={`${item.patient}-${item.time}`}>
          <div className="conversation-top">
            <div>
              <strong>{item.patient}</strong>
              <span>
                {item.channel} • {item.topic}
              </span>
            </div>
            <span className={`status-chip status-${getStatusClassName(item.status)}`}>
              {item.status}
            </span>
          </div>
          <p>{item.lastMessage}</p>
          <small>{item.time}</small>
        </article>
      ))}
    </div>
  );
}

function IntegrationNotes() {
  return (
    <aside className="integration-card">
      <span className="eyebrow">Integração futura</span>
      <h3>Payload sugerido para o backend</h3>
      <ul>
        <li>`summary.disparosRealizados`</li>
        <li>`summary.contatosInteragiram`</li>
        <li>`summary.mediaInteracoesPorContato`</li>
        <li>`topicos[].name`, `topicos[].share`, `topicos[].resume`</li>
        <li>`acumuladoDiario[].novasConversas`, `acumuladoDiario[].acumulado`</li>
        <li>`conversasRecentes[]` para o overview operacional</li>
      </ul>
    </aside>
  );
}

export default function App() {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    let active = true;

    getDashboardData().then((response) => {
      if (active) {
        setDashboard(response);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!dashboard) {
    return (
      <main className="loading-shell">
        <div className="loading-card">
          <span className="eyebrow">Dr Bem Estar</span>
          <h1>Carregando dashboard de conversas...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy" aria-hidden="true" />

        <div className="hero-panel">
          <span className="hero-kicker">Última atualização</span>
          <strong>{formatDateTime(dashboard.updatedAt)}</strong>
          <p>Dados mockados, prontos para serem substituídos pela integração real.</p>
        </div>
      </section>

      <section className="grid-two">
        <div className="panel">
          <SectionHeading
            eyebrow="Dr Bem Estar"
            title="Saúde da operação de disparos"
            description="Os indicadores principais já estão separados para o time bater o olho e entender tração e qualidade do contato."
          />

          <div className="metric-grid">
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

        <div className="panel">
          <SectionHeading
            eyebrow="Infinity Chat"
            title="Relatório de novas conversas"
            description="Leitura acumulativa diária para identificar picos, sazonalidade e evolução do volume ao longo da semana."
          />
          <BarChart items={dashboard.acumuladoDiario} />
        </div>
      </section>

      <section className="grid-two">
        <div className="panel">
          <SectionHeading
            eyebrow="Tópicos tratados"
            title="Resumo temático das conversas"
            description="Uma leitura rápida dos principais assuntos ajuda a orientar campanhas, atendimento humano e próximos testes."
          />
          <TopicList topics={dashboard.topicos} />
        </div>

        <div className="stack">
          <div className="panel">
            <SectionHeading
              eyebrow="Overview"
              title="Panorama operacional"
              description="Números de acompanhamento para saber o que foi respondido, o que precisa de apoio humano e onde estão as oportunidades."
            />

            <div className="overview-grid">
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

          <IntegrationNotes />
        </div>
      </section>

      <section className="grid-two bottom-grid">
        <div className="panel">
          <SectionHeading
            eyebrow="Funil"
            title="Da entrega ao encaminhamento"
            description="Uma leitura simples do funil ajuda a alinhar marketing, automação e operação comercial."
          />
          <Funnel stages={dashboard.funil} />
        </div>

        <div className="panel">
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
