# WhatsApp Chat

A Shopify app that shows a floating button on the online store. Clicking it opens a WhatsApp chat with the store's number, with an optional prefilled message.

No server, database or Admin API access is needed: the app requests no access scopes.

## What's in the app

| Path | What it is |
| --- | --- |
| [extensions/whatsapp-chat/](./extensions/whatsapp-chat/) | Theme app extension. An app embed block (`target: body`) that renders the floating `wa.me` link, plus its stylesheet. |
| [extensions/app-home/](./extensions/app-home/) | App Home UI extension (`admin.app.home.render`). The page merchants see when they open the app, with setup steps and a deep link that opens the theme editor with the embed turned on. |
| [shopify.app.toml](./shopify.app.toml) | App configuration. |

### App embed settings

Merchants configure the button in **Online Store → Themes → Customize → App embeds → WhatsApp Chat**:

- WhatsApp phone number (country code + number, digits only, no leading zero, e.g. `923001234567`)
- Default message
- Button label, and whether to show it (icon-only otherwise)
- Position (bottom left or bottom right)
- Background and icon/text colours
- Distance from the bottom of the screen
- Show on mobile / show on desktop

The phone number may be typed with spaces, `+`, `-`, `.` or brackets; they are removed. A number that still isn't 8–15 digits, or starts with `0`, is treated as invalid: the button is hidden on the storefront and a notice explains the problem in the theme editor. A blank number also hides the button.

## Development

Requires [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) and a development store in the same organization as the app.

```shell
shopify app dev --store <your-dev-store>.myshopify.com
```

Press **P** to open the app and install it. Then click **Turn on chat button**, enter a WhatsApp number and save the theme.

If the Cloudflare tunnel can't connect on your network, add `--use-localhost`.

To release a new version of the extensions:

```shell
shopify app deploy
```

## Testing checklist

- Button appears on the homepage, collection and product pages after the embed is turned on.
- Clicking opens the intended WhatsApp number with the exact prefilled message, including punctuation, `&`, line breaks and non-Latin text.
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
