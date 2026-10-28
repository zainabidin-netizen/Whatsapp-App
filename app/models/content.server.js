// Widget content is stored in app-owned, translatable metaobjects declared in shopify.app.toml.
// The theme app extension reads the same entries in Liquid via shop.metaobjects["$app:..."].

export const CONTENT_TYPES = {
  agents: {
    type: "$app:wa_agent",
    title: "Agents",
    singular: "agent",
    plural: "agents",
    description:
      "Teams customers can chat with, such as Sales, Support or Order Help. Each agent has its own WhatsApp number.",
    titleField: "name",
    icon: "person",
    columns: [
      { key: "phone", label: "WhatsApp number" },
      { key: "description", label: "Description" },
    ],
    fields: [
      { key: "name", label: "Name", kind: "text", required: true, placeholder: "Sales" },
      { key: "description", label: "Description", kind: "text", placeholder: "Questions before you buy" },
      {
        key: "phone",
        label: "WhatsApp number",
        kind: "phone",
        required: true,
        placeholder: "923001234567",
        details: "Country code and number, digits only, no leading zero.",
      },
    ],
  },
  "quick-questions": {
    type: "$app:wa_quick_question",
    title: "Quick questions",
    singular: "quick question",
    plural: "quick questions",
    description:
      "Buttons such as “Help me choose a size” that open WhatsApp with a prefilled message.",
    titleField: "label",
    icon: "chat",
    columns: [
      { key: "message", label: "Prefilled message" },
      { key: "agentName", label: "Agent", empty: "First agent" },
    ],
    fields: [
      { key: "label", label: "Button label", kind: "text", required: true, placeholder: "Help me choose a size" },
      {
        key: "message",
        label: "Prefilled message",
        kind: "textarea",
        required: true,
        placeholder: "Hi! Can you help me choose the right size?",
        details: "On product pages, [product_title] and [product_url] are replaced with the product’s name and link.",
      },
      {
        key: "agent",
        label: "Send to agent",
        kind: "agent",
        details: "“First agent” sends the message to whichever agent is first in your Agents list.",
      },
    ],
  },
  faqs: {
    type: "$app:wa_faq",
    title: "FAQs",
    singular: "FAQ",
    plural: "FAQs",
    description:
      "Questions and answers customers can search in the widget, with an option to continue on WhatsApp.",
    titleField: "question",
    icon: "question-circle",
    columns: [{ key: "answer", label: "Answer" }],
    fields: [
      { key: "question", label: "Question", kind: "text", required: true, placeholder: "How long does delivery take?" },
      {
        key: "answer",
        label: "Answer",
        kind: "textarea",
        required: true,
        placeholder: "Orders arrive in 3–5 working days.",
      },
    ],
  },
};

export const WIDGET_TEXT = {
  type: "$app:wa_widget_text",
  handle: "default",
  fields: [
    { key: "greeting_title", label: "Greeting title", kind: "text", placeholder: "Need help?" },
    {
      key: "greeting_text",
      label: "Greeting message",
      kind: "textarea",
      placeholder: "Chat with our team on WhatsApp. Pick who you’d like to talk to.",
    },
    { key: "button_label", label: "Button label", kind: "text", placeholder: "Chat with us" },
    {
      key: "default_message",
      label: "Default prefilled message",
      kind: "textarea",
      placeholder: "Hi! I have a question about your products.",
    },
    {
      key: "product_message",
      label: "Product page prefilled message",
      kind: "textarea",
      placeholder: "Hi! I have a question about [product_title]: [product_url]",
      details: "[product_title] and [product_url] are replaced with the product’s name and link.",
    },
    {
      key: "offline_message",
      label: "Offline message",
      kind: "textarea",
      placeholder:
        "We’re currently away. Our working hours are [hours]. Leave us a WhatsApp message, and we’ll reply when we’re back.",
      details: "Shown outside business hours. [hours] is replaced with your working days and hours.",
    },
  ],
};

const LIST_QUERY = `#graphql
  query ContentList($type: String!) {
    metaobjects(type: $type, first: 100) {
      nodes {
        id
        handle
        fields {
          key
          value
          reference {
            ... on Metaobject {
              id
              displayName
            }
          }
        }
      }
    }
  }`;

const ENTRY_QUERY = `#graphql
  query ContentEntry($id: ID!) {
    metaobject(id: $id) {
      id
      handle
      type
      fields {
        key
        value
      }
    }
  }`;

const CREATE_MUTATION = `#graphql
  mutation ContentCreate($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject {
        id
      }
      userErrors {
        field
        message
        code
      }
    }
  }`;

const UPDATE_MUTATION = `#graphql
  mutation ContentUpdate($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject {
        id
      }
      userErrors {
        field
        message
        code
      }
    }
  }`;

const DELETE_MUTATION = `#graphql
  mutation ContentDelete($id: ID!) {
    metaobjectDelete(id: $id) {
      deletedId
      userErrors {
        field
        message
        code
      }
    }
  }`;

const TEXT_QUERY = `#graphql
  query WidgetText($handle: MetaobjectHandleInput!) {
    metaobjectByHandle(handle: $handle) {
      id
      fields {
        key
        value
      }
    }
  }`;

const TEXT_UPSERT = `#graphql
  mutation WidgetTextUpsert($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject {
        id
      }
      userErrors {
        field
        message
        code
      }
    }
  }`;

async function run(admin, query, variables) {
  const response = await admin.graphql(query, { variables });
  const json = await response.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data;
}

const fieldMap = (fields) => Object.fromEntries(fields.map((f) => [f.key, f]));

export function getContentType(key) {
  const config = CONTENT_TYPES[key];
  if (!config) throw new Response("Not found", { status: 404 });
  return config;
}

export async function listEntries(admin, config) {
  const data = await run(admin, LIST_QUERY, { type: config.type });
  return data.metaobjects.nodes
    .map((node) => {
      const fields = fieldMap(node.fields);
      return {
        id: node.id,
        handle: node.handle,
        position: Number(fields.position?.value ?? 0),
        values: Object.fromEntries(node.fields.map((f) => [f.key, f.value ?? ""])),
        agentName: fields.agent?.reference?.displayName ?? "",
      };
    })
    .sort((a, b) => a.position - b.position || a.handle.localeCompare(b.handle));
}

export async function getEntry(admin, id) {
  const data = await run(admin, ENTRY_QUERY, { id });
  if (!data.metaobject) throw new Response("Not found", { status: 404 });
  return {
    id: data.metaobject.id,
    type: data.metaobject.type,
    values: Object.fromEntries(data.metaobject.fields.map((f) => [f.key, f.value ?? ""])),
  };
}

export function normalizePhone(value) {
  return String(value ?? "").replace(/[\s+\-().]/g, "");
}

export function validate(config, form) {
  const errors = {};
  const values = {};
  for (const field of config.fields) {
    let value = String(form.get(field.key) ?? "").trim();
    if (field.kind === "phone") {
      value = normalizePhone(value);
      if (value && !/^[1-9]\d{7,14}$/.test(value)) {
        errors[field.key] = "Enter the country code and number, digits only, with no leading zero (8–15 digits).";
      }
    }
    if (field.required && !value) errors[field.key] = `${field.label} is required.`;
    values[field.key] = value;
  }
  return { values, errors };
}

const toFields = (values) =>
  Object.entries(values).map(([key, value]) => ({ key, value: value === "" ? "" : String(value) }));

const userErrors = (result) =>
  result.userErrors?.length ? { form: result.userErrors.map((e) => e.message).join(" ") } : null;

export async function createEntry(admin, config, values, position) {
  const data = await run(admin, CREATE_MUTATION, {
    metaobject: { type: config.type, fields: toFields({ ...values, position }) },
  });
  return userErrors(data.metaobjectCreate);
}

export async function updateEntry(admin, id, values) {
  const data = await run(admin, UPDATE_MUTATION, { id, metaobject: { fields: toFields(values) } });
  return userErrors(data.metaobjectUpdate);
}

export async function deleteEntry(admin, id) {
  const data = await run(admin, DELETE_MUTATION, { id });
  return userErrors(data.metaobjectDelete);
}

export async function moveEntry(admin, config, id, direction) {
  const entries = await listEntries(admin, config);
  const index = entries.findIndex((e) => e.id === id);
  const target = index + (direction === "up" ? -1 : 1);
  if (index < 0 || target < 0 || target >= entries.length) return null;
  [entries[index], entries[target]] = [entries[target], entries[index]];
  for (const [position, entry] of entries.entries()) {
    if (entry.position !== position) {
      const error = await updateEntry(admin, entry.id, { position });
      if (error) return error;
    }
  }
  return null;
}

export async function getWidgetText(admin) {
  const data = await run(admin, TEXT_QUERY, { handle: { type: WIDGET_TEXT.type, handle: WIDGET_TEXT.handle } });
  return Object.fromEntries((data.metaobjectByHandle?.fields ?? []).map((f) => [f.key, f.value ?? ""]));
}

export async function saveWidgetText(admin, form) {
  const values = Object.fromEntries(WIDGET_TEXT.fields.map((f) => [f.key, String(form.get(f.key) ?? "").trim()]));
  const data = await run(admin, TEXT_UPSERT, {
    handle: { type: WIDGET_TEXT.type, handle: WIDGET_TEXT.handle },
    metaobject: { fields: toFields(values) },
  });
  return userErrors(data.metaobjectUpsert);
}
