import { authenticate } from "../shopify.server";
import { deleteShopData } from "../models/analytics.server";

// Mandatory privacy webhooks. Widget events contain no customer data, so customer requests need no action;
// shop/redact (sent 48 hours after uninstall) deletes the shop's stored events.
export const action = async ({ request }) => {
  const { shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  if (topic === "SHOP_REDACT") {
    await deleteShopData(shop);
  }

  return new Response();
};
