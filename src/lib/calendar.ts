import { addressFor, events, venues, wedding } from '../data/schedule.ts';
import type { ScheduleEvent } from '../data/schedule.ts';

export const CALENDAR_PATH = '/schedule.ics';
// Google no longer reliably accepts a prefilled `cid` subscription link. Its
// supported path is the calendar settings screen, where guests paste the feed.
export const GOOGLE_ADD_BY_URL = 'https://calendar.google.com/calendar/u/0/r/settings/addbyurl';

export function calendarLinks(origin: string) {
  const feed = new URL(CALENDAR_PATH, origin).href;
  return {
    feed,
    apple: feed.replace(/^https?:/, 'webcal:'),
    googleSetup: GOOGLE_ADD_BY_URL,
  };
}

function escapeText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/[,;]/g, '\\$&');
}

// RFC 5545 folds at 75 UTF-8 octets, without splitting a Unicode character.
function foldLine(value: string) {
  const encoder = new TextEncoder();
  let line = '';
  let bytes = 0;
  let result = '';
  for (const character of value) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) {
      result += `${line}\r\n`;
      line = ' ';
      bytes = 1;
    }
    line += character;
    bytes += size;
  }
  return result + line;
}

function utc(value: string | Date) {
  return new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

export function renderCalendar(items: ScheduleEvent[] = events, publishedAt = new Date()) {
  const stamp = utc(publishedAt);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Matt Telles//The Groom’s Crew//EN',
    'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapeText(`${wedding.groom}’s wedding · The groom’s crew`)}`,
    `X-WR-TIMEZONE:${wedding.timeZone}`,
    'X-WR-CALDESC:Thursday and Saturday. Times may change. Check the website for the latest plan.',
    // A refresh hint, not a guarantee: each calendar app controls its polling.
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ];

  for (const event of items) {
    // A deadline alone is not enough to manufacture a calendar start.
    if (!event.start) continue;
    const venue = event.location ? venues[event.location] : undefined;
    const description = [
      `${event.time} ${event.period || ''} · ${wedding.timeZoneLabel}${event.approximate ? ' (approximate)' : ''}`,
      event.notes,
      event.callout,
      event.locationLabel,
      venue?.note,
      'Times may change. Check the wedding website for the latest plan.',
    ].filter(Boolean).join('\n\n');
    lines.push(
      'BEGIN:VEVENT',
      // Keep this identity stable when titles, times, addresses or the host change.
      `UID:${event.id}@groomsman-site.matt-telles`,
      `DTSTAMP:${stamp}`,
      `LAST-MODIFIED:${stamp}`,
      `DTSTART:${utc(event.start)}`,
    );
    // A milestone has no fabricated duration (RFC 5545 §3.6.1).
    if (event.end) lines.push(`DTEND:${utc(event.end)}`);
    lines.push(
      `SUMMARY:${escapeText(event.title)}`,
      `DESCRIPTION:${escapeText(description)}`,
    );
    if (event.location && venue) {
      lines.push(`LOCATION:${escapeText(`${venue.name}, ${addressFor(event.location)}`)}`);
    }
    lines.push(`STATUS:${event.approximate ? 'TENTATIVE' : 'CONFIRMED'}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
