(() => {
  const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const MONDAY_FIRST = [1, 2, 3, 4, 5, 6, 0];

  const toMinutes = (value) => {
    const [hours, minutes] = String(value || '0:0').split(':').map(Number);
    return hours * 60 + minutes;
  };

  const offsetToMinutes = (offset) => {
    const match = /^([+-])(\d{2}):?(\d{2})$/.exec(offset || '');
    if (!match) return 0;
    const total = Number(match[2]) * 60 + Number(match[3]);
    return match[1] === '-' ? -total : total;
  };

  const zonedNow = (timeZone, offset) => {
    if (timeZone && timeZone !== 'store') {
      try {
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone,
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        }).formatToParts(new Date());
        const part = (type) => parts.find((p) => p.type === type).value;
        return { day: WEEKDAYS[part('weekday')], minutes: Number(part('hour')) * 60 + Number(part('minute')) };
      } catch (error) {
        // Unknown time zone: fall back to the store offset below.
      }
    }
    const shifted = new Date(Date.now() + offsetToMinutes(offset) * 60000);
    return { day: shifted.getUTCDay(), minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
  };

  const isOpen = (days, open, close, now) => {
    if (open === close) return days.includes(now.day);
    if (open < close) return days.includes(now.day) && now.minutes >= open && now.minutes < close;
    return (days.includes(now.day) && now.minutes >= open) || (days.includes((now.day + 6) % 7) && now.minutes < close);
  };

  const zoneLabel = (timeZone, offset) => {
    if (timeZone && timeZone !== 'store') {
      try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' }).formatToParts(new Date());
        return parts.find((p) => p.type === 'timeZoneName').value;
      } catch (error) {
        // Fall through to the store offset.
      }
    }
    const minutes = offsetToMinutes(offset);
    const sign = minutes < 0 ? '-' : '+';
    const abs = Math.abs(minutes);
    const rest = abs % 60;
    return `GMT${sign}${Math.floor(abs / 60)}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`;
  };

  const hoursSummary = (root, days, open, close) => {
    const locale = document.documentElement.lang || undefined;
    const dayName = (day) =>
      new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 7 + day)));
    const time = (minutes) =>
      new Intl.DateTimeFormat(locale, {
        hour: 'numeric',
        minute: minutes % 60 ? '2-digit' : undefined,
        timeZone: 'UTC',
      }).format(new Date(Date.UTC(2024, 0, 1, Math.floor(minutes / 60), minutes % 60)));

    const runs = [];
    MONDAY_FIRST.forEach((day) => {
      if (!days.includes(day)) return;
      const last = runs[runs.length - 1];
      if (last && MONDAY_FIRST.indexOf(last[last.length - 1]) === MONDAY_FIRST.indexOf(day) - 1) last.push(day);
      else runs.push([day]);
    });
    const dayText = runs
      .map((run) => (run.length > 2 ? `${dayName(run[0])}–${dayName(run[run.length - 1])}` : run.map(dayName).join(', ')))
      .join(', ');
    const timeText = open === close ? root.dataset.open24Label : `${time(open)}–${time(close)}`;
    return `${dayText}, ${timeText} (${zoneLabel(root.dataset.timeZone, root.dataset.storeOffset)})`;
  };

  const applyHours = (root) => {
    const days = (root.dataset.days || '').split(',').filter(Boolean).map(Number);
    const open = toMinutes(root.dataset.open);
    const close = toMinutes(root.dataset.close);
    const online = isOpen(days, open, close, zonedNow(root.dataset.timeZone, root.dataset.storeOffset));
    const summary = days.length ? hoursSummary(root, days, open, close) : '';

    root.dataset.state = online ? 'online' : 'offline';
    const status = root.querySelector('[data-wa-status]');
    status.querySelector('[data-wa-status-text]').textContent = online ? root.dataset.onlineLabel : root.dataset.awayLabel;
    status.querySelector('[data-wa-hours]').textContent = summary;
    status.hidden = false;

    const offline = root.querySelector('[data-wa-offline]');
    offline.textContent = offline.dataset.template.replaceAll('[hours]', summary);
    offline.hidden = online;

    const heading = root.querySelector('[data-wa-list-heading]');
    heading.textContent = online ? root.dataset.onlineHeading : root.dataset.offlineHeading;
  };

  const init = (root) => {
    if (root.dataset.waReady) return;
    root.dataset.waReady = 'true';
    const details = root.querySelector('details');
    const summary = details.querySelector('summary');
    const close = () => {
      details.open = false;
      summary.focus();
    };

    root.querySelector('[data-wa-close]').addEventListener('click', close);
    root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && details.open) close();
    });
    document.addEventListener('click', (event) => {
      if (details.open && !root.contains(event.target)) details.open = false;
    });

    if (root.dataset.hoursEnabled === 'true') {
      applyHours(root);
      setInterval(() => applyHours(root), 60000);
    }
  };

  const initAll = () => document.querySelectorAll('[data-wa-chat]').forEach(init);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll);
  else initAll();
  document.addEventListener('shopify:section:load', initAll);
  document.addEventListener('shopify:block:select', (event) => {
    const root = event.target.closest?.('[data-wa-chat]') || event.target.querySelector?.('[data-wa-chat]');
    if (root) root.querySelector('details').open = true;
  });
})();
