const CLIENT_ID = '792ea0ba7ee2d6e04b56e07da08bcb9a';
const EMBED_HANDLE = 'whatsapp-chat';
const THEME_EDITOR_URL = `shopify:admin/themes/current/editor?context=apps&activateAppId=${CLIENT_ID}/${EMBED_HANDLE}`;

export default function HomePage() {
  return (
    <s-page heading="WhatsApp Chat">
      <s-button slot="primary-action" variant="primary" href={THEME_EDITOR_URL}>
        Turn on chat button
      </s-button>

      <s-section heading="Set up your WhatsApp chat button">
        <s-stack gap="base">
          <s-paragraph>
            Show a floating button on your online store that opens a WhatsApp
            chat with your business number.
          </s-paragraph>
          <s-ordered-list>
            <s-list-item>
              Click <s-text type="strong">Turn on chat button</s-text>. Your
              theme editor opens with the WhatsApp Chat app embed turned on.
            </s-list-item>
            <s-list-item>
              Enter your WhatsApp number with the country code and no leading
              zero, for example 923001234567.
            </s-list-item>
            <s-list-item>
              Adjust the message, label, colours and position, then click{' '}
              <s-text type="strong">Save</s-text>.
            </s-list-item>
          </s-ordered-list>
          <s-button href={THEME_EDITOR_URL}>Open theme editor</s-button>
        </s-stack>
      </s-section>

      <s-section slot="aside" heading="Good to know">
        <s-paragraph>
          The button only appears after you turn on the app embed and save your
          theme. To hide it, turn off the embed or clear the phone number.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}
