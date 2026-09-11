import { days, events, wedding } from '../data/schedule';
import type { ScheduleEvent, DayId } from '../data/schedule';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: wedding.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
});

export function localDate(now: number) {
  return dateFormatter.format(now);
}

export function defaultDay(now: number): DayId {
  return localDate(now) === '2026-09-24' ? 'thursday' : 'saturday';
}

export function countdown(target: number, now: number) {
  const seconds = Math.max(0, Math.ceil((target - now) / 1000));
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
  };
}

export function timeUntil(target: number, now: number) {
  const minutes = Math.max(0, Math.ceil((target - now) / 60000));
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `In ${minutes} min`;
  if (minutes < 1440) {
    const remainder = minutes % 60;
    return `In ${Math.floor(minutes / 60)}h${remainder ? ` ${remainder}m` : ''}`;
  }
  return `In ${Math.ceil(minutes / 1440)} days`;
}

export type EventState = 'unscheduled' | 'upcoming' | 'current' | 'past';

export function eventState(event: ScheduleEvent, now: number): EventState {
  if (!event.start) {
    const day = days.find((item) => item.id === event.day)!;
    if (localDate(now) > day.date) return 'past';
    return event.deadline && now >= Date.parse(event.deadline) ? 'past' : 'unscheduled';
  }
  const start = Date.parse(event.start);
  if (now < start) return 'upcoming';
  // Open-ended activities are milestones, never invented multi-hour durations.
  if (!event.end) return 'past';
  return now < Date.parse(event.end) ? 'current' : 'past';
}

export function nextEvent(now: number, list: ScheduleEvent[] = events) {
  return list.find((event) => event.start && Date.parse(event.start) > now);
}

export function currentEvent(now: number, list: ScheduleEvent[] = events) {
  return list.find((event) => eventState(event, now) === 'current');
}

export function eventStatus(event: ScheduleEvent, now: number) {
  const state = eventState(event, now);
  if (state === 'past') return 'Earlier';
  if (state === 'current') return event.approximate ? 'Around now' : 'On the schedule now';
  if (!event.start) return event.deadline ? `Arrival ${timeUntil(Date.parse(event.deadline), now).toLowerCase()}` : 'Time to come';
  return `${event.approximate ? 'About · ' : ''}${timeUntil(Date.parse(event.start), now)}`;
}
