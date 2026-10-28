const CLIENT_ID = '792ea0ba7ee2d6e04b56e07da08bcb9a';
const EMBED_HANDLE = 'whatsapp-chat';
const THEME_EDITOR_URL = `shopify:admin/themes/current/editor?context=apps&activateAppId=${CLIENT_ID}/${EMBED_HANDLE}`;

export default function HomePage() {
  return (
    <s-page heading="WhatsApp Chat Pro">
      <s-button slot="primary-action" variant="primary" href={THEME_EDITOR_URL}>
        Turn on chat button
      </s-button>

      <s-section heading="Set up your WhatsApp chat">
        <s-stack gap="base">
          <s-paragraph>
            Show a floating button on your online store. Customers choose a
            team, such as Sales, Support or Order Help, and start a WhatsApp
            chat with that team’s number.
          </s-paragraph>
          <s-ordered-list>
            <s-list-item>
              Click <s-text type="strong">Turn on chat button</s-text>. Your
              theme editor opens with the WhatsApp Chat Pro app embed turned on.
            </s-list-item>
            <s-list-item>
              Under <s-text type="strong">Agents</s-text>, enter a WhatsApp
              number for each team with the country code and no leading zero,
              for example 923001234567. Leave a number blank to hide that
              team.
            </s-list-item>
            <s-list-item>
              Set your working days, hours and time zone under{' '}
              <s-text type="strong">Business hours</s-text>, and edit the
              offline message.
            </s-list-item>
            <s-list-item>
              Adjust the greeting, colours and position, then click{' '}
              <s-text type="strong">Save</s-text>.
            </s-list-item>
          </s-ordered-list>
          <s-button href={THEME_EDITOR_URL}>Open theme editor</s-button>
        </s-stack>
      </s-section>

      <s-section heading="Features">
        <s-unordered-list>
          <s-list-item>
            <s-text type="strong">Multiple agents:</s-text> up to three teams,
            each with its own WhatsApp number.
          </s-list-item>
          <s-list-item>
            <s-text type="strong">Business hours:</s-text> shows Online or Away
            based on your schedule and time zone.
          </s-list-item>
          <s-list-item>
            <s-text type="strong">Offline message:</s-text> shown in the chat
            popup outside working hours. Customers can still leave a WhatsApp
            message.
          </s-list-item>
          <s-list-item>
            <s-text type="strong">Product messages:</s-text> on product pages,
            the prefilled message includes the product name and link.
          </s-list-item>
          <s-list-item>
            <s-text type="strong">Custom styling:</s-text> colours, position,
            greeting and agent names.
          </s-list-item>
        </s-unordered-list>
      </s-section>

      <s-section slot="aside" heading="Good to know">
        <s-stack gap="base">
          <s-paragraph>
            Online and Away follow your configured schedule. They don’t detect
            whether someone is using WhatsApp right now.
          </s-paragraph>
          <s-paragraph>
            The offline message appears on your website only. It isn’t an
            automatic WhatsApp reply.
          </s-paragraph>
        </s-stack>
      </s-section>
    </s-page>
  );
}
