import { parseEvent, recordEvent } from "../models/analytics.server";

// Receives widget events from the web pixel, which runs in a sandbox on the storefront.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MAX_BODY_LENGTH = 2000;

export const loader = () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const action = async ({ request }) => {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: CORS_HEADERS });

  const body = await request.text();
  const event = body.length <= MAX_BODY_LENGTH ? parseEvent(body) : null;
  if (event) await recordEvent(event);

  return new Response(null, { status: 204, headers: CORS_HEADERS });
};
