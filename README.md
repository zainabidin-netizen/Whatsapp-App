# WhatsApp Chat Pro

A Shopify app that adds a floating WhatsApp chat widget to the online store. Customers pick a team (for example Sales, Support or Order Help), tap a quick question, or search FAQs, and continue the conversation on WhatsApp.

## Features

| Feature | How it works |
| --- | --- |
| Multiple agents | Any number of agents, each with a name, description and WhatsApp number. |
| Quick question buttons | Buttons such as “Help me choose a size” that open WhatsApp with a prefilled message, sent to a chosen agent (or the first agent). |
| Searchable FAQs | An FAQ tab with instant search across questions and answers, and a “Chat on WhatsApp” button for further help. |
| Business hours | Working days, opening and closing times (30-minute steps, overnight supported) and a time zone. The popup shows **Online** or **Away**. |
| Offline message | Shown outside working hours, with `[hours]` replaced by the schedule. Customers can still leave a WhatsApp message. |
| Product message | On product pages, prefilled messages can include `[product_title]` and `[product_url]`. |
| Click analytics | Widget opens, agent clicks, quick question clicks, FAQ views and FAQ → WhatsApp clicks, broken down by page type, page and device, on the app dashboard. |
| Multilingual widget | Built-in labels in English, Urdu, Arabic, French, Spanish and German, with right-to-left layout for Urdu and Arabic. Merchant content is translatable with Shopify’s Translate & Adapt app. |
| Accessibility | Keyboard-operable popup, tabs with arrow-key navigation, Escape to close, focus moved into the popup and returned to the button, screen-reader announcements for FAQ search, 44px touch targets, and automatic correction of low-contrast colour choices. |
| Custom styling | Colours, position, distance from bottom, button label or icon only, mobile/desktop visibility. |

Online/Away follows the configured schedule only. It doesn't detect whether anyone is using WhatsApp, and the offline message isn't an automatic WhatsApp reply.

## Architecture

```text
Admin (embedded app, React Router)            Storefront
┌──────────────────────────────┐   metaobjects   ┌──────────────────────────────┐
│ Dashboard · Agents · Quick   │ ──────────────▶ │ Theme app extension          │
│ questions · FAQs · Widget    │  ($app:wa_*,    │ (app embed: Liquid, CSS, JS) │
│ text                         │  translatable)  └──────────────┬───────────────┘
└──────────────▲───────────────┘                                │ Shopify.analytics.publish
               │ Prisma (WidgetEvent)                           ▼
┌──────────────┴───────────────┐   POST /api/events   ┌──────────────────────────┐
│ App server                   │ ◀─────────────────── │ Web pixel extension      │
│                              │                      │ (runs with analytics     │
└──────────────────────────────┘                      │  consent only)           │
                                                      └──────────────────────────┘
```

| Path | What it is |
| --- | --- |
| [app/routes/app._index.jsx](./app/routes/app._index.jsx) | Dashboard: setup steps, analytics and language info. Also connects the web pixel and keeps its endpoint up to date. |
| [app/routes/app.manage.$type._index.jsx](./app/routes/app.manage.$type._index.jsx), [app.manage.$type.$id.jsx](./app/routes/app.manage.$type.$id.jsx) | List, reorder, add, edit and delete agents, quick questions and FAQs. |
| [app/routes/app.text.jsx](./app/routes/app.text.jsx) | Greeting, button label and prefilled/offline messages. Empty fields use the built-in translated text. |
| [app/routes/api.events.jsx](./app/routes/api.events.jsx) | Public endpoint that receives widget events from the web pixel. |
| [app/routes/webhooks.compliance.jsx](./app/routes/webhooks.compliance.jsx) | Mandatory privacy webhooks; `shop/redact` deletes the shop's events. |
| [app/models/](./app/models/) | Metaobject content, analytics queries and web pixel connection. |
| [extensions/whatsapp-chat/](./extensions/whatsapp-chat/) | Theme app extension: the app embed, its stylesheet and script, and storefront translations. |
| [extensions/wa-chat-analytics/](./extensions/wa-chat-analytics/) | Web pixel that forwards widget events to the app. |
| [shopify.app.toml](./shopify.app.toml) | App configuration, metaobject definitions, access scopes and webhooks. |

### Content

Content is stored in app-owned metaobjects declared in `shopify.app.toml`: `$app:wa_agent`, `$app:wa_quick_question`, `$app:wa_faq` and `$app:wa_widget_text`. They have the `translatable` capability, so merchants translate them in **Settings › Languages**. The theme extension reads them in Liquid with `shop.metaobjects["$app:..."]` and sorts them by their `position` field.

The theme editor keeps the settings that don't need translating: business hours, product message on/off, colours, position and visibility.

### Analytics and privacy

The widget publishes `wa_chat_pro:*` custom events with `Shopify.analytics.publish`. The web pixel declares `analytics = true` (no marketing, no sale of data), so Shopify only runs it when the customer allows analytics. It sends the event type, target (the metaobject handle), page type, path and device to `/api/events`. No customer identifiers are stored. Events from shops without the app installed are ignored.

The app requests `write_pixels` and `read_customer_events`, which are needed to connect the pixel. Metaobjects are app-owned and need no extra scopes.

## Development

Requires [Shopify CLI](https://shopify.dev/docs/apps/tools/cli), Node.js 22.12+ and a development store in the same organization as the app.

```shell
npm install
shopify app dev --store <your-dev-store>.myshopify.com
```

If the CLI reports `Could not start Cloudflare tunnel … failed to dial to edge with quic`, the network is blocking QUIC (UDP). Run the tunnel over HTTP/2 instead:

```shell
TUNNEL_TRANSPORT_PROTOCOL=http2 shopify app dev --store <your-dev-store>.myshopify.com
```

Press **P** to open the app and accept the new permissions. Add at least one agent, then click **Turn on in theme editor** and save. Opening the dashboard connects the analytics pixel; check **Settings › Customer events** in the store admin.

The database is SQLite at `prisma/dev.sqlite` in development. To change the schema, edit [prisma/schema.prisma](./prisma/schema.prisma) and run `npx prisma migrate dev`.

## Deployment

1. Host the app server (for example on Fly.io, Render or Google Cloud Run) with a production database. Prisma supports PostgreSQL and MySQL; update the `datasource` in `prisma/schema.prisma`.
2. Set `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `SCOPES` and `DATABASE_URL` on the host.
3. Set `application_url` and `redirect_urls` in `shopify.app.toml` to the hosted URL, then run `shopify app deploy`.

See [Deploy your app](https://shopify.dev/docs/apps/launch/deployment).

## Testing checklist

- The widget appears on the homepage, collection and product pages after the embed is turned on.
- Each agent and quick question opens the right WhatsApp number with the right message; product pages include the product's name and link.
- FAQ search finds questions by words in the question or answer; “Chat on WhatsApp” opens the first agent.
- Online/Away and the offline message match the schedule, including at opening and closing times and overnight.
- Switching the store language translates the built-in labels; Urdu and Arabic display right-to-left.
- Keyboard: Tab to the button, Enter opens it, arrow keys switch tabs, Escape closes and returns focus.
- After a few clicks, the dashboard shows the events (with analytics consent given on the storefront).
- Check on a real phone and a desktop browser; WhatsApp's handling depends on the device and login state.

## Resources

- [Theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)
- [App-owned metaobjects](https://shopify.dev/docs/apps/build/custom-data/ownership)
- [Web pixels](https://shopify.dev/docs/apps/build/marketing/build-web-pixels)
- [Privacy compliance webhooks](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)
- [Shopify app React Router template](https://github.com/Shopify/shopify-app-template-react-router)
