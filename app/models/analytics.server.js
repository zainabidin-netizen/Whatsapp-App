import db from "../db.server";
import { DEVICES, EVENT_TYPES } from "./events";

const SHOP_PATTERN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;
const clip = (value, length) => String(value ?? "").slice(0, length);

// Validates an event sent by the web pixel. Returns null when the payload should be ignored.
export function parseEvent(body) {
  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return null;
  }
  if (!event || typeof event !== "object") return null;
  if (!SHOP_PATTERN.test(event.shop ?? "") || !(event.type in EVENT_TYPES)) return null;
  return {
    shop: event.shop,
    type: event.type,
    target: clip(event.target, 100),
    pageType: clip(event.pageType, 40),
    path: clip(event.path, 200),
    device: DEVICES.includes(event.device) ? event.device : "",
  };
}

export async function recordEvent(event) {
  const installed = await db.session.findFirst({ where: { shop: event.shop }, select: { id: true } });
  if (!installed) return false;
  await db.widgetEvent.create({ data: event });
  return true;
}

const countBy = async (where, by) => {
  const rows = await db.widgetEvent.groupBy({ by, where, _count: { _all: true } });
  return rows.map((row) => ({ ...row, count: row._count._all }));
};

export async function getSummary(shop, days) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where = { shop, createdAt: { gte: since } };
  const clickTypes = ["agent_click", "quick_question_click", "faq_contact_click"];

  const [byType, byPageType, byDevice, byPath, byTarget] = await Promise.all([
    countBy(where, ["type"]),
    countBy(where, ["pageType", "type"]),
    countBy(where, ["device", "type"]),
    countBy(where, ["path", "type"]),
    countBy({ ...where, type: { in: ["agent_click", "quick_question_click", "faq_open"] } }, ["type", "target"]),
  ]);

  const totals = Object.fromEntries(Object.keys(EVENT_TYPES).map((type) => [type, 0]));
  byType.forEach((row) => (totals[row.type] = row.count));
  const chatClicks = clickTypes.reduce((sum, type) => sum + totals[type], 0);

  const breakdown = (rows, key) => {
    const groups = new Map();
    for (const row of rows) {
      const name = row[key] || "unknown";
      const group = groups.get(name) ?? { name, opens: 0, clicks: 0 };
      if (row.type === "widget_open") group.opens += row.count;
      if (clickTypes.includes(row.type)) group.clicks += row.count;
      groups.set(name, group);
    }
    return [...groups.values()].sort((a, b) => b.opens + b.clicks - (a.opens + a.clicks));
  };

  const top = (type) =>
    byTarget
      .filter((row) => row.type === type)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((row) => ({ handle: row.target, count: row.count }));

  return {
    days,
    totals,
    chatClicks,
    clickRate: totals.widget_open ? Math.round((chatClicks / totals.widget_open) * 100) : 0,
    byPageType: breakdown(byPageType, "pageType"),
    byDevice: breakdown(byDevice, "device"),
    byPath: breakdown(byPath, "path").slice(0, 10),
    topAgents: top("agent_click"),
    topQuickQuestions: top("quick_question_click"),
    topFaqs: top("faq_open"),
  };
}

export async function deleteShopData(shop) {
  await db.widgetEvent.deleteMany({ where: { shop } });
}
