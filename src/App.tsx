import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowRight, Bus, Camera, Car, Check, ChevronDown, Church, Clock3, Coffee, Copy, Heart, MapPin, Monitor, Moon, Shirt, Sun, Users, Wine, X } from 'lucide-react';
import { addressFor, days, events, logistics, venues, wedding } from './data/schedule';
import type { DayId, LocationId, ScheduleEvent } from './data/schedule';
import { countdown, currentEvent, defaultDay, eventState, eventStatus, localDate, nextEvent, timeUntil } from './lib/time';
import { CalendarAdd } from './components/CalendarAdd';

const icons = { bus: Bus, camera: Camera, car: Car, church: Church, clock: Clock3, coffee: Coffee, shirt: Shirt, users: Users, wine: Wine };
type Theme = 'system' | 'light' | 'dark';

function useClock() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
      window.removeEventListener('focus', update);
    };
  }, []);
  return now;
}

function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('crew-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* Browsing without storage still works. */ }
    return 'system';
  });
  const ThemeIcon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon;
  const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
  function change() {
    setTheme(next);
    if (next === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
    try { localStorage.setItem('crew-theme', next); } catch { /* Optional preference. */ }
  }
  return <button className="theme-toggle" onClick={change} aria-label={`Theme: ${theme}. Switch to ${next} theme.`} title={`Theme: ${theme}. Click for ${next}.`}>
    <ThemeIcon size={17} strokeWidth={1.6} /><span>{theme}</span>
  </button>;
}

function Countdown({ now }: { now: number }) {
  const target = Date.parse(wedding.ceremony);
  const remaining = countdown(target, now);
  const finished = now >= target;
  const reduceMotion = useReducedMotion();
  return <div className="countdown-wrap">
    <div className="eyebrow countdown-label"><Heart size={13} />{finished ? 'September 26, 2026 · A day to remember' : 'Counting down to “I do”'}</div>
    <div className="countdown" role="timer" aria-live="off" aria-label={finished ? 'The wedding has begun' : `${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes, ${remaining.seconds} seconds until Wedding Mass`}>
      {Object.entries(remaining).map(([unit, value]) => <div className="countdown-unit" key={unit} aria-hidden="true">
        <div className="number-window"><AnimatePresence initial={false} mode="popLayout">
          <motion.span className="countdown-number" key={value}
            initial={{ y: reduceMotion ? 0 : '65%', opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduceMotion ? 0 : '-65%', opacity: 0 }} transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}>
            {String(value).padStart(2, '0')}
          </motion.span>
        </AnimatePresence></div>
        <span className="countdown-unit-label">{unit}</span>
      </div>)}
    </div>
    <p className="countdown-foot">{finished ? 'Here’s to the newlyweds.' : 'Saturday, September 26 · 2:00 PM ET'}</p>
  </div>;
}

function EventContent({ event, now, copied }: { event: ScheduleEvent; now: number; copied: boolean }) {
  const Icon = icons[event.icon];
  const state = eventState(event, now);
  const venue = event.location ? venues[event.location] : undefined;
  return <>
    <span className="event-time-column">
      <span className="event-time">{event.time}<span className="event-period">{event.period}</span></span>
      <span className={`event-relative ${state === 'current' ? 'relative-live' : ''}`}>
        {state === 'past' ? <Check size={13} /> : state === 'current' ? <span className="live-dot" /> : <Clock3 size={12} />}
        {eventStatus(event, now)}
      </span>
    </span>
    <span className="event-main">
      <span className="event-title-line"><Icon size={21} strokeWidth={1.5} /><span className="event-title">{event.title}</span></span>
      <span className="event-notes">{event.notes}</span>
      {event.callout && <span className="event-callout">{event.callout}</span>}
    </span>
    {venue && <span className="event-location">
      <span className="venue-name"><MapPin size={13} /><span>{event.locationLabel || venue.name}</span></span>
      <span className="street">{venue.street}</span>
      <span className="city">{venue.city}</span>
      <span className={`copy-label ${copied ? 'is-copied' : ''}`}>{copied ? <Check size={13} /> : <Copy size={12} />}{copied ? 'Address copied' : 'Tap to copy address'}</span>
    </span>}
  </>;
}

function EventCard({ event, now, index, copyAddress, copied }: {
  event: ScheduleEvent; now: number; index: number;
  copyAddress: (id: LocationId) => void; copied: LocationId | null;
}) {
  const state = eventState(event, now);
  const active = state === 'current';
  const progress = active && event.start && event.end
    ? Math.min(100, Math.max(0, (now - Date.parse(event.start)) / (Date.parse(event.end) - Date.parse(event.start)) * 100)) : 0;
  const classes = `event-card category-${event.category} ${event.compact ? 'compact' : ''} ${active ? 'is-current' : ''} ${state === 'past' ? 'is-past' : ''} ${event.id === 'mass' ? 'ceremony-card' : ''}`;
  const body = <>
    {active && <motion.span className="active-outline" layoutId="active-outline" transition={{ type: 'spring', stiffness: 110, damping: 23 }} />}
    <EventContent event={event} now={now} copied={!!event.location && copied === event.location} />
    {active && <span className="event-progress" aria-hidden="true"><motion.span animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'linear' }} /></span>}
  </>;
  return <motion.li id={`event-${event.id}`} className="event-item" aria-current={active ? 'step' : undefined}
    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: Math.min(index * 0.045, 0.32), duration: 0.48 }}>
    {event.location ? <motion.button type="button" className={classes}
      onClick={() => copyAddress(event.location!)} whileTap={{ scale: 0.994 }}
      aria-label={`${event.time} ${event.period || ''}. ${event.title}. ${event.notes} Copy address for ${venues[event.location].name}: ${addressFor(event.location)}.`}>
      {body}
    </motion.button> : <div className={classes}>{body}</div>}
  </motion.li>;
}

function AddressFallback({ address, close }: { address: string | null; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (address && !dialog.current?.open) {
      dialog.current?.showModal();
      input.current?.focus();
      input.current?.select();
    } else if (!address) dialog.current?.close();
  }, [address]);
  return <dialog ref={dialog} className="address-dialog" onCancel={close} onClick={(e) => { if (e.target === e.currentTarget) close(); }} aria-labelledby="copy-heading">
    <button className="dialog-close" onClick={close} aria-label="Close address"><X size={20} /></button>
    <MapPin size={23} /><h2 id="copy-heading">Here’s the address.</h2>
    <p>Your browser couldn’t copy automatically. Select the address, then choose Copy.</p>
    <input ref={input} readOnly value={address || ''} aria-label="Address to copy" onFocus={(e) => e.target.select()} />
    <button className="dialog-done" onClick={close}>Got it <Check size={16} /></button>
  </dialog>;
}

export default function App() {
  const now = useClock();
  const [day, setDay] = useState<DayId>(() => defaultDay(Date.now()));
  const [copied, setCopied] = useState<LocationId | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const clearCopy = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const previousCurrent = useRef<string | null | undefined>(undefined);
  const manuallySelectedDay = useRef(false);
  const pendingJump = useRef<string | null>(null);
  const reduceMotion = useReducedMotion();
  const current = currentEvent(now);
  const upcoming = nextEvent(now);
  const featured = current || upcoming;
  const selectedDay = days.find((item) => item.id === day)!;
  const dayEvents = events.filter((event) => event.day === day);
  const sections = [...new Set(dayEvents.map((event) => event.section))];
  const calendarDate = localDate(now);

  useEffect(() => () => clearTimeout(clearCopy.current), []);
  useEffect(() => {
    if (!manuallySelectedDay.current) setDay(defaultDay(Date.now()));
  }, [calendarDate]);
  useEffect(() => {
    if (previousCurrent.current !== undefined && previousCurrent.current !== (current?.id ?? null)) {
      setAnnouncement(current ? `Next on the schedule: ${current.title}. ${current.time} ${current.period || ''}.` : 'The scheduled activity has ended. Check what’s next.');
    }
    previousCurrent.current = current?.id ?? null;
  }, [current?.id, current?.period, current?.time, current?.title]);

  function chooseDay(selected: DayId) {
    manuallySelectedDay.current = true;
    setDay(selected);
  }

  async function copyAddress(id: LocationId) {
    const address = addressFor(id);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(address);
      setCopied(id);
      setAnnouncement(`Copied ${venues[id].name} address.`);
      clearTimeout(clearCopy.current);
      clearCopy.current = setTimeout(() => setCopied(null), 2600);
    } catch {
      setFallback(address);
    }
  }

  function scrollToEvent(id: string) {
    const element = document.getElementById(`event-${id}`);
    if (!element) return;
    element.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'center' });
    element.querySelector('button')?.focus({ preventScroll: true });
  }

  function jumpToFeatured() {
    if (!featured) return;
    if (day === featured.day) scrollToEvent(featured.id);
    else {
      pendingJump.current = featured.id;
      chooseDay(featured.day);
    }
  }

  return <MotionConfig reducedMotion="user">
    <a className="skip-link" href="#schedule">Skip to the schedule</a>
    <div className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="The Groom’s Crew, back to top"><span className="monogram">{wedding.groom[0].toLowerCase()}.</span><span>The groomsmen edition</span></a>
        <div className="header-right"><span className="header-date">09.26.26</span><span className="header-rule" /><ThemeSwitch /></div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="page-title">
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
            <div className="eyebrow hero-eyebrow"><span className="tiny-rule" />{wedding.groom}’s wedding weekend</div>
            <h1 id="page-title">The groom’s <em>crew.</em></h1>
            <p>Your people. Your places. The plan for a pretty big day.</p>
          </motion.div>
          <Countdown now={now} />
        </section>

        <motion.button className="next-up" onClick={jumpToFeatured} disabled={!featured}
          aria-label={featured ? `Jump to ${featured.title} on ${featured.day}` : 'The scheduled events are complete'}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}>
          <span className="next-up-icon">{current ? <Clock3 size={23} strokeWidth={1.4} /> : featured ? <ArrowRight size={23} strokeWidth={1.4} /> : <Heart size={23} strokeWidth={1.4} />}</span>
          <span className="next-up-copy"><span className="eyebrow">{current ? 'On the schedule now' : featured ? 'Coming up next' : 'All the way to “I do”'}</span>
            <AnimatePresence mode="wait" initial={false}><motion.span className="next-title" key={featured?.id || 'done'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>{featured?.title || 'The schedule is wrapped. Enjoy the celebration.'}</motion.span></AnimatePresence>
          </span>
          {featured && <span className="next-up-when"><span>{featured.time} {featured.period}</span><span>{featured.day === 'thursday' ? 'Thu, Sep 24' : 'Sat, Sep 26'}{!current && featured.start ? ` · ${timeUntil(Date.parse(featured.start), now)}` : ''}</span></span>}
          {featured && <span className="next-up-arrow"><ArrowDown size={18} /></span>}
        </motion.button>

        <div className="schedule-toolbar" id="schedule">
          <div className="day-picker" role="tablist" aria-label="Choose schedule day">
            {days.map((item, i) => <button type="button" role="tab" id={`tab-${item.id}`} aria-selected={day === item.id} aria-controls="day-panel" tabIndex={day === item.id ? 0 : -1}
              className={day === item.id ? 'selected' : ''} onClick={() => chooseDay(item.id)} key={item.id}
              onKeyDown={(e) => {
                if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
                e.preventDefault();
                const nextIndex = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : (i + 1) % 2;
                chooseDay(days[nextIndex].id);
                document.getElementById(`tab-${days[nextIndex].id}`)?.focus();
              }}>
              {day === item.id && <motion.span className="day-selected-bg" layoutId="day-tab" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
              <span className="day-name">{item.label}</span><span className="day-date">Sep {item.number}</span>
            </button>)}
          </div>
          <div className="schedule-actions"><span className="timezone"><Clock3 size={14} />All times Eastern</span><CalendarAdd /></div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.section key={day} id="day-panel" role="tabpanel" tabIndex={0} aria-labelledby={`tab-${day}`}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}
            onAnimationComplete={() => { if (pendingJump.current) { scrollToEvent(pendingJump.current); pendingJump.current = null; } }}>
            <div className="schedule-heading"><div><h2>{selectedDay.title}</h2><p>{selectedDay.subtitle}, 2026</p></div><span className="draft-label"><span />Working plan · times may change</span></div>
            <div className="schedule-hint"><Copy size={13} /><span>Tap a card to copy its address. Open it in your favorite maps app.</span></div>
            <LayoutGroup id={`schedule-${day}`}>
              {sections.map((section, sectionIndex) => <section className="schedule-section" key={section} aria-label={section}>
                <h3 className="section-label"><span>{String(sectionIndex + 1).padStart(2, '0')}</span>{section}<span className="section-line" /></h3>
                <ol className="event-list">{dayEvents.filter((event) => event.section === section).map((event, index) => <EventCard key={event.id} event={event} now={now} index={index} copyAddress={copyAddress} copied={copied} />)}</ol>
              </section>)}
            </LayoutGroup>
          </motion.section>
        </AnimatePresence>

        <section className="good-to-know" aria-labelledby="notes-title">
          <div className="notes-intro"><span className="eyebrow">A few things to keep in mind</span><h2 id="notes-title">The little details.</h2><p>We’ll update the plan as the last pieces fall into place.</p></div>
          <div className="notes-list">
            <details open><summary><Car size={19} /><span>The morning drive</span><ChevronDown size={16} /></summary><div className="detail-content">{logistics.morning}</div></details>
            <details><summary><Bus size={19} /><span>Everyone on the bus</span><ChevronDown size={16} /></summary><div className="detail-content">{logistics.bus}</div></details>
            <details open><summary><Car size={19} /><span>Getting your cars back · to come</span><ChevronDown size={16} /></summary><div className="detail-content">{logistics.carRetrieval}</div></details>
            <details><summary><MapPin size={19} /><span>Finding the right spot</span><ChevronDown size={16} /></summary><div className="detail-content">{logistics.locations} Check <a href="https://ertelcellars.com/hours-directions/" target="_blank" rel="noreferrer">the winery’s directions</a> if needed.</div></details>
          </div>
        </section>
      </main>
      <footer><span className="footer-signoff">Here’s to a really good day.</span><span>{wedding.groom}’s crew <Heart size={12} /> September 26, 2026</span><a href="#top">Back to top ↑</a></footer>
    </div>
    <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
    <AnimatePresence>{copied && <motion.div className="copy-toast" initial={{ opacity: 0, y: 25, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 15 }}><span><Check size={17} /></span><div>Address copied<small>Ready for your favorite maps app.</small></div></motion.div>}</AnimatePresence>
    <AddressFallback address={fallback} close={() => setFallback(null)} />
  </MotionConfig>;
}
