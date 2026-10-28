import { useEffect } from "react";
import { Form, useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  CONTENT_TYPES,
  createEntry,
  deleteEntry,
  getContentType,
  getEntry,
  listEntries,
  updateEntry,
  validate,
} from "../models/content.server";

const gid = (id) => `gid://shopify/Metaobject/${id}`;
// The API returns app-owned types in their expanded form, e.g. "app--1234--wa_faq" for "$app:wa_faq".
const isType = (actual, configured) =>
  actual === configured || actual.endsWith(`--${configured.replace("$app:", "")}`);

export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const config = getContentType(params.type);
  const isNew = params.id === "new";
  const entry = isNew ? null : await getEntry(admin, gid(params.id));
  if (entry && !isType(entry.type, config.type)) throw new Response("Not found", { status: 404 });

  const needsAgents = config.fields.some((f) => f.kind === "agent");
  const agents = needsAgents
    ? (await listEntries(admin, CONTENT_TYPES.agents)).map((a) => ({ id: a.id, name: a.values.name }))
    : [];

  return { type: params.type, config, isNew, values: entry?.values ?? {}, agents };
};

export const action = async ({ request, params }) => {
  const { admin, redirect } = await authenticate.admin(request);
  const config = getContentType(params.type);
  const form = await request.formData();
  const listUrl = `/app/manage/${params.type}`;

  if (form.get("intent") === "delete") {
    const error = await deleteEntry(admin, gid(params.id));
    return error ? { errors: error } : redirect(listUrl);
  }

  const { values, errors } = validate(config, form);
  if (Object.keys(errors).length) return { errors, values };

  let error;
  if (params.id === "new") {
    const existing = await listEntries(admin, config);
    const position = existing.reduce((max, e) => Math.max(max, e.position + 1), 0);
    error = await createEntry(admin, config, values, position);
  } else {
    error = await updateEntry(admin, gid(params.id), values);
  }
  return error ? { errors: error, values } : redirect(listUrl);
};

function Field({ field, value, error, agents }) {
  const common = { label: field.label, name: field.key, details: field.details, error };
  if (field.kind === "textarea") {
    return <s-text-area {...common} value={value} placeholder={field.placeholder} rows={4} required={field.required} />;
  }
  if (field.kind === "agent") {
    return (
      <s-select {...common} value={value}>
        <s-option value="">First agent</s-option>
        {agents.map((agent) => (
          <s-option key={agent.id} value={agent.id}>
            {agent.name}
          </s-option>
        ))}
      </s-select>
    );
  }
  return (
    <s-text-field {...common} value={value} placeholder={field.placeholder} required={field.required} />
  );
}

export default function ContentForm() {
  const { type, config, isNew, values: saved, agents } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const shopify = useAppBridge();
  const submit = useSubmit();
  const values = actionData?.values ?? saved;
  const errors = actionData?.errors ?? {};
  const saving = navigation.state === "submitting";
  const heading = isNew ? `Add ${config.singular}` : saved[config.titleField];

  useEffect(() => {
    if (errors.form) shopify.toast.show(errors.form, { isError: true });
  }, [errors.form, shopify]);

  return (
    <s-page heading={heading} inlineSize="small">
      <s-link slot="breadcrumb-actions" href={`/app/manage/${type}`}>
        {config.title}
      </s-link>
      {!isNew && (
        <s-button slot="secondary-actions" tone="critical" commandFor="delete-modal" command="--show">
          Delete
        </s-button>
      )}

      <Form method="post" data-save-bar={isNew ? undefined : true}>
        <s-section>
          <s-stack gap="base">
            {errors.form && (
              <s-banner tone="critical" heading="Couldn’t save">
                <s-paragraph>{errors.form}</s-paragraph>
              </s-banner>
            )}
            {config.fields.map((field) => (
              <Field key={field.key} field={field} value={values[field.key] ?? ""} error={errors[field.key]} agents={agents} />
            ))}
            <s-stack direction="inline" gap="base">
              <s-button type="submit" variant="primary" loading={saving}>
                Save
              </s-button>
              <s-button href={`/app/manage/${type}`}>Cancel</s-button>
            </s-stack>
          </s-stack>
        </s-section>
      </Form>

      {!isNew && (
        <s-modal id="delete-modal" heading={`Delete ${config.singular}?`}>
          <s-paragraph>
            “{saved[config.titleField]}” will be removed from the chat widget. This can’t be undone.
          </s-paragraph>
          <s-button
            slot="primary-action"
            tone="critical"
            variant="primary"
            loading={saving}
            onClick={() => submit({ intent: "delete" }, { method: "post" })}
          >
            Delete
          </s-button>
          <s-button slot="secondary-actions" commandFor="delete-modal" command="--hide">
            Cancel
          </s-button>
        </s-modal>
      )}
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
