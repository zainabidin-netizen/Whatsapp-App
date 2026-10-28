import { useEffect } from "react";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { WIDGET_TEXT, getWidgetText, saveWidgetText } from "../models/content.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  return { fields: WIDGET_TEXT.fields, values: await getWidgetText(admin) };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const error = await saveWidgetText(admin, await request.formData());
  return { error, saved: !error };
};

export default function WidgetText() {
  const { fields, values } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const shopify = useAppBridge();

  useEffect(() => {
    if (actionData?.saved) shopify.toast.show("Widget text saved");
    if (actionData?.error) shopify.toast.show(actionData.error.form, { isError: true });
  }, [actionData, shopify]);

  return (
    <s-page heading="Widget text" inlineSize="small">
      <s-link slot="breadcrumb-actions" href="/app">Dashboard</s-link>
      <Form method="post" data-save-bar>
        <s-section>
          <s-stack gap="base">
            <s-paragraph color="subdued">
              Leave a field empty to use the built-in text, which is shown in the customer’s language.
            </s-paragraph>
            {fields.map((field) =>
              field.kind === "textarea" ? (
                <s-text-area
                  key={field.key}
                  label={field.label}
                  name={field.key}
                  value={values[field.key] ?? ""}
                  placeholder={field.placeholder}
                  details={field.details}
                  rows={3}
                />
              ) : (
                <s-text-field
                  key={field.key}
                  label={field.label}
                  name={field.key}
                  value={values[field.key] ?? ""}
                  placeholder={field.placeholder}
                  details={field.details}
                />
              ),
            )}
            <s-stack direction="inline">
              <s-button type="submit" variant="primary" loading={navigation.state === "submitting"}>
                Save
              </s-button>
            </s-stack>
          </s-stack>
        </s-section>
      </Form>

      <s-section slot="aside" heading="Translations">
        <s-paragraph>
          Translate this text into your store’s other languages in{" "}
          <s-link href="shopify:admin/settings/languages" target="_top">
            Settings › Languages
          </s-link>{" "}
          with Shopify’s Translate &amp; Adapt app.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
