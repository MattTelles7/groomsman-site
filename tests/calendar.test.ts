import test from 'node:test';
import assert from 'node:assert/strict';
import ICAL from 'ical.js';
import { CALENDAR_PATH, GOOGLE_ADD_BY_URL, calendarLinks, renderCalendar } from '../src/lib/calendar';
import { addressFor, events } from '../src/data/schedule';

const published = new Date('2026-09-11T15:00:00Z');
const parse = (feed: string) => new ICAL.Component(ICAL.parse(feed)).getAllSubcomponents('vevent');

test('both days round-trip through an independent iCalendar parser with correct instants and addresses', () => {
  const parsed = parse(renderCalendar(events, published));
  const timed = events.filter((event) => event.start);
  assert.equal(parsed.length, timed.length);
  assert.equal(new Set(parsed.map((item) => item.getFirstPropertyValue('uid'))).size, timed.length);
  timed.forEach((source, i) => {
    const event = new ICAL.Event(parsed[i]);
    assert.equal(event.startDate.toJSDate().getTime(), Date.parse(source.start!));
    assert.equal(event.summary, source.title);
    assert.ok(event.description.includes(source.notes));
    if (source.location) assert.ok(event.location.includes(addressFor(source.location)));
    if (source.end) assert.equal(event.endDate.toJSDate().getTime(), Date.parse(source.end));
    else assert.equal(parsed[i].hasProperty('dtend'), false);
    if (source.approximate) {
      assert.equal(parsed[i].getFirstPropertyValue('status'), 'TENTATIVE');
      assert.ok(event.description.includes('(approximate)'));
    }
  });
  assert.equal(new ICAL.Event(parsed[0]).startDate.toString(), '2026-09-24T21:15:00Z');
  assert.equal(new ICAL.Event(parsed.find((item) => item.getFirstPropertyValue('uid') === 'mass@groomsman-site.matt-telles')!).startDate.toString(), '2026-09-26T18:00:00Z');
});

test('new publications update event content and modification time without changing its identity', () => {
  const source = events.find((event) => event.id === 'meet')!;
  const before = parse(renderCalendar([source], published))[0];
  const after = parse(renderCalendar([{ ...source, title: 'Updated meetup', start: '2026-09-26T12:20:00-04:00' }], new Date('2026-09-12T15:00:00Z')))[0];
  assert.equal(before.getFirstPropertyValue('uid'), after.getFirstPropertyValue('uid'));
  assert.notEqual(String(before.getFirstPropertyValue('last-modified')), String(after.getFirstPropertyValue('last-modified')));
  assert.equal(new ICAL.Event(after).summary, 'Updated meetup');
  assert.equal(new ICAL.Event(after).startDate.toString(), '2026-09-26T16:20:00Z');
});

test('escaping and UTF-8 folding preserve punctuation, newlines, and multibyte characters', () => {
  const source = { ...events[0], title: 'Café, photos; friends \\ family 🎉'.repeat(8), notes: 'Line one\r\nLine two, with; punctuation \\ and emoji 🎉' };
  const feed = renderCalendar([source], published);
  assert.ok(feed.endsWith('\r\n'));
  assert.ok(feed.includes('\r\n '));
  for (const line of feed.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
  const event = new ICAL.Event(parse(feed)[0]);
  assert.equal(event.summary, source.title);
  assert.ok(event.description.includes(source.notes.replace(/\r\n/g, '\n')));
  assert.equal(feed.replace(/\r\n/g, '').includes('\n'), false);
});

test('unknown start times are omitted even when an arrival deadline exists', () => {
  const source = { ...events[0], start: null, end: undefined, deadline: '2026-09-24T17:15:00-04:00' };
  assert.equal(parse(renderCalendar([source], published)).length, 0);
});

test('subscriptions use a stable feed and Google’s supported setup page', () => {
  const links = calendarLinks('https://crew.example.com');
  assert.equal(links.feed, `https://crew.example.com${CALENDAR_PATH}`);
  assert.equal(links.apple, `webcal://crew.example.com${CALENDAR_PATH}`);
  assert.equal(links.googleSetup, GOOGLE_ADD_BY_URL);
  assert.doesNotMatch(links.googleSetup, /cid=/);
  assert.equal(calendarLinks('http://localhost:5173').feed, `http://localhost:5173${CALENDAR_PATH}`);
});
