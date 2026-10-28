// Connects the analytics web pixel (extensions/wa-chat-analytics) and keeps its endpoint
// pointing at this app, since the app URL changes between dev tunnels and production.

const PIXEL_QUERY = `#graphql
  query AppPixel {
    webPixel {
      id
      settings
    }
  }`;

const PIXEL_CREATE = `#graphql
  mutation PixelCreate($webPixel: WebPixelInput!) {
    webPixelCreate(webPixel: $webPixel) {
      webPixel {
        id
        settings
      }
      userErrors {
        field
        message
        code
      }
    }
  }`;

const PIXEL_UPDATE = `#graphql
  mutation PixelUpdate($id: ID!, $webPixel: WebPixelInput!) {
    webPixelUpdate(id: $id, webPixel: $webPixel) {
      webPixel {
        id
        settings
      }
      userErrors {
        field
        message
        code
      }
    }
  }`;

export async function ensurePixel(admin) {
  const appUrl = process.env.SHOPIFY_APP_URL;
  if (!appUrl) return { connected: false, error: "SHOPIFY_APP_URL isn’t set." };
  const settings = JSON.stringify({ endpoint: new URL("/api/events", appUrl).toString() });

  let pixel = null;
  try {
    const response = await admin.graphql(PIXEL_QUERY);
    pixel = (await response.json()).data?.webPixel ?? null;
  } catch {
    // webPixel returns an error when the app has no pixel yet.
  }
  if (pixel?.settings === settings) return { connected: true };

  const response = pixel
    ? await admin.graphql(PIXEL_UPDATE, { variables: { id: pixel.id, webPixel: { settings } } })
    : await admin.graphql(PIXEL_CREATE, { variables: { webPixel: { settings } } });
  const json = await response.json();
  const result = pixel ? json.data?.webPixelUpdate : json.data?.webPixelCreate;
  const message = json.errors?.[0]?.message ?? result?.userErrors?.[0]?.message;
  return message ? { connected: false, error: message } : { connected: true };
}
