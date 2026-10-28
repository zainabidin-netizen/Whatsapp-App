# WhatsApp Chat Pro

A Shopify app that shows a floating WhatsApp button on the online store. It opens a chat popup where customers pick a team (for example Sales, Support or Order Help) and start a WhatsApp chat with that team's number.

No server, database or Admin API access is needed: the app requests no access scopes.

## Features

| Feature | How it works |
| --- | --- |
| Multiple agents | Up to three agents, each with a name, short description and WhatsApp number. |
| Business hours | Working days, opening and closing times (30-minute steps, overnight supported) and a time zone. The popup shows **Online** or **Away**. |
| Offline message | Shown in the popup outside working hours. `[hours]` is replaced with the schedule, e.g. "Monday–Friday, 9 AM–6 PM (GMT+5)". Customers can still leave a WhatsApp message. |
| Product message | On product pages, the prefilled message can include `[product_title]` and `[product_url]`. |
| Custom styling | Colours, position, distance from bottom, greeting, agent names, button label or icon only, mobile/desktop visibility. |

Online/Away follows the configured schedule only. It doesn't detect whether anyone is using WhatsApp, and the offline message isn't an automatic WhatsApp reply.

## What's in the app

| Path | What it is |
| --- | --- |
| [extensions/whatsapp-chat/](./extensions/whatsapp-chat/) | Theme app extension: the app embed block (`target: body`), its stylesheet and script, and storefront translations. |
| [extensions/app-home/](./extensions/app-home/) | App Home UI extension (`admin.app.home.render`). The page merchants see when they open the app, with setup steps and a deep link that opens the theme editor with the embed turned on. |
| [shopify.app.toml](./shopify.app.toml) | App configuration. |

### How it works

- The popup is a `<details>` element, so it opens and closes without JavaScript. [whatsapp-chat.js](./extensions/whatsapp-chat/assets/whatsapp-chat.js) adds Escape and click-outside to close, and works out Online/Away in the browser. This has to happen client-side because storefront pages are cached.
- **Store time zone** uses the store's UTC offset at render time (`'now' | date: '%z'`). A named time zone uses the browser's `Intl` API and follows daylight saving time.
- Phone numbers may be typed with spaces, `+`, `-`, `.` or brackets; they are removed. A number that isn't 8–15 digits, or starts with `0`, is invalid. Invalid or blank agents are hidden on the storefront; the theme editor shows a notice naming each invalid number. With no valid agents, nothing renders.
- In the theme editor the popup starts open, so setting changes are visible straight away.
- Fixed storefront text (Online, Away, headings) lives in [locales/en.default.json](./extensions/whatsapp-chat/locales/en.default.json).

## Development

Requires [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) and a development store in the same organization as the app.

```shell
shopify app dev --store <your-dev-store>.myshopify.com
```

Press **P** to open the app and install it. Then click **Turn on chat button**, enter at least one agent's WhatsApp number and save the theme.

If the Cloudflare tunnel can't connect on your network, add `--use-localhost`.

To release a new version of the extensions:

```shell
shopify app deploy
```

## Testing checklist

- Button appears on the homepage, collection and product pages after the embed is turned on.
- The popup lists each agent with a number; each opens the right WhatsApp number with the exact prefilled message, including punctuation, `&`, line breaks and non-Latin text.
- Product pages use the product message with the product's name and link.
- Online/Away and the offline message match the schedule, including at opening and closing times and for overnight hours.
- Escape, the close button and clicking outside close the popup.
- Left/right position, icon-only mode and custom colours work.
- Mobile and desktop visibility settings work independently.
- Keyboard: Tab reaches the button, Enter opens it.
- Clearing the phone number, or turning off the embed, removes the button.
- Check on a real phone and a desktop browser; WhatsApp's handling depends on the device and login state.
- Check that cookie banners and sticky add-to-cart bars don't cover the button; raise the bottom distance if they do.

## Resources

- [Theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)
- [App embed deep linking](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration#deep-linking)
- [App Home UI extensions](https://shopify.dev/docs/api/admin-extensions)
- [Shopify CLI for apps](https://shopify.dev/docs/apps/build/cli-for-apps)
