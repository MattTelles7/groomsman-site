import test from 'node:test';
import assert from 'node:assert/strict';
import { countdown, currentEvent, defaultDay, eventState, nextEvent, timeUntil } from '../src/lib/time';
import { addressFor, events, wedding } from '../src/data/schedule';

const at = (value: string) => Date.parse(`2026-09-26T${value}-04:00`);
const event = (id: string) => events.find((item) => item.id === id)!;

test('countdown uses the ceremony instant and never becomes negative', () => {
  assert.deepEqual(countdown(Date.parse(wedding.ceremony), at('13:59:59')), { days: 0, hours: 0, minutes: 0, seconds: 1 });
  assert.deepEqual(countdown(Date.parse(wedding.ceremony), at('14:00:00')), { days: 0, hours: 0, minutes: 0, seconds: 0 });
  assert.deepEqual(countdown(Date.parse(wedding.ceremony), at('18:00:00')), { days: 0, hours: 0, minutes: 0, seconds: 0 });
});

test('active highlight hands off at exact boundaries', () => {
  assert.equal(currentEvent(at('12:14:59')), undefined);
  assert.equal(currentEvent(at('12:15:00'))?.id, 'meet');
  assert.equal(currentEvent(at('12:29:59'))?.id, 'meet');
  assert.equal(currentEvent(at('12:30:00'))?.id, 'groomsmen-photos');
  assert.equal(currentEvent(at('14:00:00'))?.id, 'mass');
  assert.equal(currentEvent(at('15:00:00'))?.id, 'family-photos');
  assert.equal(currentEvent(at('18:00:00')), undefined);
  assert.equal(nextEvent(at('18:00:00')), undefined);
});

test('TBD activities have no invented live start time', () => {
  assert.equal(eventState(event('get-ready'), at('09:00:00')), 'unscheduled');
  assert.equal(eventState(event('drive-church'), at('12:14:59')), 'unscheduled');
  assert.equal(eventState(event('drive-church'), at('12:15:00')), 'past');
  assert.equal(nextEvent(at('09:00:00'))?.id, 'meet');
  assert.equal(eventState(event('get-ready'), Date.parse('2026-09-27T00:00:00-04:00')), 'past');
});

test('Thursday finishes cleanly without staying active through Saturday', () => {
  const dinner = Date.parse('2026-09-24T18:30:00-04:00');
  assert.equal(currentEvent(dinner), undefined);
  assert.equal(nextEvent(dinner)?.id, 'meet');
  assert.equal(eventState(event('dinner'), dinner), 'past');
});

test('day selection uses Indiana date, even across UTC midnight', () => {
  assert.equal(defaultDay(Date.parse('2026-09-25T02:00:00Z')), 'thursday');
  assert.equal(defaultDay(Date.parse('2026-09-25T04:00:00Z')), 'saturday');
});

test('relative time rounds up, including the last minute', () => {
  assert.equal(timeUntil(at('14:00:00'), at('13:59:59')), 'In 1 min');
  assert.equal(timeUntil(at('14:00:00'), at('12:15:00')), 'In 1h 45m');
});

test('schedule is ordered, dates are explicit, and addresses are complete', () => {
  const timed = events.filter((item) => item.start);
  for (let i = 0; i < timed.length; i++) {
    assert.match(timed[i].start!, /-04:00$/);
    if (i) assert.ok(Date.parse(timed[i].start!) > Date.parse(timed[i - 1].start!));
    if (timed[i].end) assert.ok(Date.parse(timed[i].end!) > Date.parse(timed[i].start!));
  }
  assert.equal(addressFor('apartment'), '60 Clubhouse Ln, Apt 60A, Fairfield, OH 45014');
  assert.equal(new Set(events.map((item) => item.id)).size, events.length);
});
