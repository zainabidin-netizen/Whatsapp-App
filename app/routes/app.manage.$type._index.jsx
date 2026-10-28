import { useEffect, useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { CONTENT_TYPES, deleteEntry, getContentType, listEntries, moveEntry } from "../models/content.server";

const idFromGid = (gid) => gid.split("/").pop();
const truncate = (text, length = 60) => (text.length > length ? `${text.slice(0, length - 1)}…` : text);

export const loader = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const config = getContentType(params.type);
  const entries = await listEntries(admin, config);
  const sections = Object.entries(CONTENT_TYPES).map(([key, c]) => ({ key, title: c.title }));
  return { type: params.type, config, entries, sections };
};

export const action = async ({ request, params }) => {
  const { admin } = await authenticate.admin(request);
  const config = getContentType(params.type);
  const form = await request.formData();
  const id = String(form.get("id"));

  if (form.get("intent") === "delete") {
    const error = await deleteEntry(admin, id);
    return { error: error?.form, deleted: !error };
  }
  const error = await moveEntry(admin, config, id, String(form.get("direction")));
  return { error: error?.form };
};

export default function ContentIndex() {
  const { type, config, entries, sections } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [pendingDelete, setPendingDelete] = useState(null);
  const busy = fetcher.state !== "idle";
  const newUrl = `/app/manage/${type}/new`;

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (fetcher.data.error) shopify.toast.show(fetcher.data.error, { isError: true });
    if (fetcher.data.deleted) shopify.toast.show(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} deleted`);
  }, [fetcher.state, fetcher.data, config.singular, shopify]);

  const move = (entry, direction) => fetcher.submit({ id: entry.id, direction }, { method: "post" });
  // Submit first, then close: a commandFor="--hide" on this button closes the admin-hosted modal
  // before the click reaches the app.
  const confirmDelete = () => {
    fetcher.submit({ id: pendingDelete.id, intent: "delete" }, { method: "post" });
    document.getElementById("delete-modal")?.hideOverlay?.();
  };
  const cell = (entry, column) => {
    const value = column.key === "agentName" ? entry.agentName : entry.values[column.key];
    return value ? truncate(value) : column.empty ?? "—";
  };

  return (
    <s-page heading={config.title}>
      <s-button slot="primary-action" variant="primary" icon="plus" href={newUrl}>
        Add {config.singular}
      </s-button>
      <s-link slot="breadcrumb-actions" href="/app">Dashboard</s-link>

      <s-box paddingBlockEnd="base">
        <s-stack direction="inline" gap="small-200">
          {sections.map((section) => (
            <s-button key={section.key} href={`/app/manage/${section.key}`} variant={section.key === type ? "primary" : "secondary"}>
              {section.title}
            </s-button>
          ))}
          <s-button href="/app/text" variant="secondary">
            Widget text
          </s-button>
        </s-stack>
      </s-box>

      {entries.length === 0 ? (
        <s-section accessibilityLabel={`No ${config.plural} yet`}>
          <s-grid gap="base" justifyItems="center" paddingBlock="large-400">
            <s-icon type={config.icon} />
            <s-stack alignItems="center" gap="small-200">
              <s-heading>No {config.plural} yet</s-heading>
              <s-paragraph>{config.description}</s-paragraph>
            </s-stack>
            <s-button variant="primary" icon="plus" href={newUrl}>
              Add {config.singular}
            </s-button>
          </s-grid>
        </s-section>
      ) : (
        <s-section padding="none" accessibilityLabel={config.title}>
          <s-table>
            <s-table-header-row>
              <s-table-header listSlot="primary">{config.fields[0].label}</s-table-header>
              {config.columns.map((column, index) => (
                <s-table-header key={column.key} listSlot={index === 0 ? "secondary" : "labeled"}>
                  {column.label}
                </s-table-header>
              ))}
              <s-table-header listSlot="inline">Actions</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {entries.map((entry, index) => {
                const title = entry.values[config.titleField];
                return (
                  <s-table-row key={entry.id}>
                    <s-table-cell>
                      <s-link href={`/app/manage/${type}/${idFromGid(entry.id)}`}>{title}</s-link>
                    </s-table-cell>
                    {config.columns.map((column) => (
                      <s-table-cell key={column.key}>{cell(entry, column)}</s-table-cell>
                    ))}
                    <s-table-cell>
                      <s-stack direction="inline" gap="small-300">
                        <s-button icon="edit" href={`/app/manage/${type}/${idFromGid(entry.id)}`}>
                          Edit
                        </s-button>
                        <s-button
                          icon="arrow-up"
                          variant="tertiary"
                          accessibilityLabel={`Move ${title} up`}
                          disabled={busy || index === 0}
                          onClick={() => move(entry, "up")}
                        />
                        <s-button
                          icon="arrow-down"
                          variant="tertiary"
                          accessibilityLabel={`Move ${title} down`}
                          disabled={busy || index === entries.length - 1}
                          onClick={() => move(entry, "down")}
                        />
                        <s-button
                          icon="delete"
                          variant="tertiary"
                          tone="critical"
                          accessibilityLabel={`Delete ${title}`}
                          commandFor="delete-modal"
                          command="--show"
                          onClick={() => setPendingDelete({ id: entry.id, title })}
                        />
                      </s-stack>
                    </s-table-cell>
                  </s-table-row>
                );
              })}
            </s-table-body>
          </s-table>
        </s-section>
      )}

      <s-modal id="delete-modal" heading={`Delete ${config.singular}?`}>
        <s-paragraph>
          “{pendingDelete?.title}” will be removed from the chat widget. This can’t be undone.
        </s-paragraph>
        <s-button slot="primary-action" variant="primary" tone="critical" onClick={confirmDelete}>
          Delete
        </s-button>
        <s-button slot="secondary-actions" commandFor="delete-modal" command="--hide">
          Cancel
        </s-button>
      </s-modal>

      <s-section slot="aside" heading={`About ${config.plural}`}>
        <s-paragraph>{config.description}</s-paragraph>
        <s-paragraph>The widget shows them in this order. Use the arrows to reorder.</s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
