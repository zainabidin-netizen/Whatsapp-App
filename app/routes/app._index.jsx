import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { CONTENT_TYPES, listEntries } from "../models/content.server";
import { getSummary } from "../models/analytics.server";
import { EVENT_TYPES } from "../models/events";
import { ensurePixel } from "../models/pixel.server";

const PERIODS = [7, 30, 90];
const EMBED_HANDLE = "whatsapp-chat";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const requested = Number(new URL(request.url).searchParams.get("days"));
  const days = PERIODS.includes(requested) ? requested : 30;

  const [pixel, summary, agents, quickQuestions, faqs] = await Promise.all([
    ensurePixel(admin),
    getSummary(session.shop, days),
    listEntries(admin, CONTENT_TYPES.agents),
    listEntries(admin, CONTENT_TYPES["quick-questions"]),
    listEntries(admin, CONTENT_TYPES.faqs),
  ]);

  const names = (entries, field) => Object.fromEntries(entries.map((e) => [e.handle, e.values[field]]));

  return {
    // eslint-disable-next-line no-undef
    themeEditorUrl: `shopify:admin/themes/current/editor?context=apps&activateAppId=${process.env.SHOPIFY_API_KEY}/${EMBED_HANDLE}`,
    pixel,
    summary,
    counts: { agents: agents.length, quickQuestions: quickQuestions.length, faqs: faqs.length },
    names: {
      agent_click: names(agents, "name"),
      quick_question_click: names(quickQuestions, "label"),
      faq_open: names(faqs, "question"),
    },
  };
};

const PAGE_TYPES = {
  index: "Home page",
  product: "Product pages",
  collection: "Collection pages",
  "list-collections": "Collections list",
  cart: "Cart",
  search: "Search",
  page: "Pages",
  blog: "Blog",
  article: "Blog posts",
  "404": "Not found",
};
const DEVICE_LABELS = { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop" };

function BreakdownTable({ heading, rows, label }) {
  return (
    <s-section heading={heading} padding="none">
      {rows.length ? (
        <s-table>
          <s-table-header-row>
            <s-table-header listSlot="primary">{heading}</s-table-header>
            <s-table-header listSlot="labeled" format="numeric">Opens</s-table-header>
            <s-table-header listSlot="labeled" format="numeric">Chat clicks</s-table-header>
          </s-table-header-row>
          <s-table-body>
            {rows.map((row) => (
              <s-table-row key={row.name}>
                <s-table-cell>{label(row.name)}</s-table-cell>
                <s-table-cell>{row.opens}</s-table-cell>
                <s-table-cell>{row.clicks}</s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      ) : (
        <s-box padding="base">
          <s-paragraph color="subdued">No activity in this period.</s-paragraph>
        </s-box>
      )}
    </s-section>
  );
}

function TopList({ heading, rows, names }) {
  return (
    <s-section heading={heading}>
      {rows.length ? (
        <s-stack gap="small-200">
          {rows.map((row) => (
            <s-grid key={row.handle} gridTemplateColumns="1fr auto" gap="base">
              <s-text>{names[row.handle] || "Deleted item"}</s-text>
              <s-text type="strong">{row.count}</s-text>
            </s-grid>
          ))}
        </s-stack>
      ) : (
        <s-paragraph color="subdued">No clicks in this period.</s-paragraph>
      )}
    </s-section>
  );
}

export default function Dashboard() {
  const { themeEditorUrl, pixel, summary, counts, names } = useLoaderData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const days = String(summary.days);

  const contentCards = [
    {
      title: "Agents",
      icon: "person",
      count: counts.agents,
      description: "Teams customers can chat with, each with its own WhatsApp number.",
      manageUrl: "/app/manage/agents",
      addUrl: "/app/manage/agents/new",
    },
    {
      title: "Quick questions",
      icon: "chat",
      count: counts.quickQuestions,
      description: "Buttons like “Help me choose a size” that open WhatsApp with a prefilled message.",
      manageUrl: "/app/manage/quick-questions",
      addUrl: "/app/manage/quick-questions/new",
    },
    {
      title: "FAQs",
      icon: "question-circle",
      count: counts.faqs,
      description: "Questions and answers customers can search inside the widget.",
      manageUrl: "/app/manage/faqs",
      addUrl: "/app/manage/faqs/new",
    },
    {
      title: "Widget text",
      icon: "text-block",
      description: "Greeting, button label, prefilled and offline messages.",
      manageUrl: "/app/text",
    },
  ];

  const metrics = [
    { label: EVENT_TYPES.widget_open, value: summary.totals.widget_open },
    { label: "Chat clicks", value: summary.chatClicks },
    { label: "Click rate", value: `${summary.clickRate}%` },
    { label: EVENT_TYPES.faq_open, value: summary.totals.faq_open },
  ];

  return (
    <s-page heading="WhatsApp Chat Pro">
      <s-button slot="primary-action" variant="primary" href={themeEditorUrl} target="_top">
        Turn on in theme editor
      </s-button>

      {!pixel.connected && (
        <s-banner tone="warning" heading="Analytics isn’t connected">
          <s-paragraph>The analytics pixel couldn’t be connected: {pixel.error}</s-paragraph>
        </s-banner>
      )}

      {counts.agents === 0 && (
        <s-section heading="Set up your chat widget">
          <s-ordered-list>
            <s-list-item>
              <s-link href="/app/manage/agents/new">Add an agent</s-link> with a WhatsApp number.
            </s-list-item>
            <s-list-item>
              Optionally add <s-link href="/app/manage/quick-questions">quick questions</s-link> and{" "}
              <s-link href="/app/manage/faqs">FAQs</s-link>, and edit the <s-link href="/app/text">widget text</s-link>.
            </s-list-item>
            <s-list-item>
              Click <s-text type="strong">Turn on in theme editor</s-text>, set business hours and colours, then save.
            </s-list-item>
          </s-ordered-list>
        </s-section>
      )}

      <s-section heading="Chat widget content">
        <s-grid gridTemplateColumns="repeat(auto-fit, minmax(240px, 1fr))" gap="base">
          {contentCards.map((card) => (
            <s-box key={card.title} padding="base" border="base" borderRadius="base">
              <s-stack gap="base">
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  <s-icon type={card.icon} />
                  <s-heading>{card.title}</s-heading>
                  {card.count !== undefined && (
                    <s-badge tone={card.count ? "success" : "neutral"}>{card.count}</s-badge>
                  )}
                </s-stack>
                <s-paragraph color="subdued">{card.description}</s-paragraph>
                <s-stack direction="inline" gap="small-200">
                  <s-button href={card.manageUrl} icon={card.count === undefined ? "edit" : undefined}>
                    {card.count === undefined ? "Edit text" : `Manage ${card.title === "FAQs" ? "FAQs" : card.title.toLowerCase()}`}
                  </s-button>
                  {card.addUrl && (
                    <s-button href={card.addUrl} variant="tertiary" icon="plus">
                      Add
                    </s-button>
                  )}
                </s-stack>
              </s-stack>
            </s-box>
          ))}
        </s-grid>
      </s-section>

      <s-section heading="Analytics">
        <s-stack gap="base">
          <s-select
            label="Period"
            name="days"
            value={days}
            onChange={(event) => {
              const params = new URLSearchParams(searchParams);
              params.set("days", event.currentTarget.value);
              navigate(`?${params}`);
            }}
          >
            <s-option value="7">Last 7 days</s-option>
            <s-option value="30">Last 30 days</s-option>
            <s-option value="90">Last 90 days</s-option>
          </s-select>
          <s-grid gridTemplateColumns="repeat(auto-fit, minmax(160px, 1fr))" gap="base">
            {metrics.map((metric) => (
              <s-box key={metric.label} padding="base" border="base" borderRadius="base">
                <s-stack gap="small-200">
                  <s-text color="subdued">{metric.label}</s-text>
                  <s-heading>{metric.value}</s-heading>
                </s-stack>
              </s-box>
            ))}
          </s-grid>
          <s-paragraph color="subdued">
            Chat clicks include agent, quick question and FAQ → WhatsApp clicks. Customers who decline analytics
            cookies aren’t counted.
          </s-paragraph>
        </s-stack>
      </s-section>

      <BreakdownTable heading="Page type" rows={summary.byPageType} label={(name) => PAGE_TYPES[name] ?? name} />
      <BreakdownTable heading="Device" rows={summary.byDevice} label={(name) => DEVICE_LABELS[name] ?? name} />
      <BreakdownTable heading="Top pages" rows={summary.byPath} label={(name) => name} />

      <TopList heading="Top agents" rows={summary.topAgents} names={names.agent_click} />
      <TopList heading="Top quick questions" rows={summary.topQuickQuestions} names={names.quick_question_click} />
      <TopList heading="Most viewed FAQs" rows={summary.topFaqs} names={names.faq_open} />

      <s-section slot="aside" heading="Languages">
        <s-paragraph>
          The widget follows the language customers choose in your store. Built-in labels are included in English,
          Urdu, Arabic, French, Spanish and German.
        </s-paragraph>
        <s-paragraph>
          To translate your agents, quick questions, FAQs and widget text, use{" "}
          <s-link href="shopify:admin/settings/languages" target="_top">
            Settings › Languages
          </s-link>{" "}
          with Shopify’s Translate &amp; Adapt app.
        </s-paragraph>
      </s-section>

      <s-section slot="aside" heading="Good to know">
        <s-paragraph>
          Online and Away follow your business hours. They don’t detect whether someone is using WhatsApp, and the
          offline message isn’t an automatic WhatsApp reply.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
