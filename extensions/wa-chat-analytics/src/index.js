import {register} from "@shopify/web-pixels-extension";

// Custom events published by the WhatsApp Chat Pro widget (extensions/whatsapp-chat/assets/whatsapp-chat.js).
const EVENTS = ["widget_open", "agent_click", "quick_question_click", "faq_open", "faq_contact_click"];

register(({analytics, init, settings}) => {
  const shop = init.data.shop.myshopifyDomain;

  EVENTS.forEach((type) => {
    analytics.subscribe(`wa_chat_pro:${type}`, (event) => {
      const data = event.customData || {};
      // text/plain keeps this a simple CORS request, so the browser doesn't send a preflight.
      fetch(settings.endpoint, {
        method: "POST",
        headers: {"Content-Type": "text/plain"},
        body: JSON.stringify({
          shop,
          type,
          target: data.target || "",
          pageType: data.pageType || "",
          path: event.context.document.location.pathname,
          device: data.device || "",
        }),
        keepalive: true,
      }).catch(() => {});
    });
  });
});
