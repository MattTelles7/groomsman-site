import { useRef, useState } from 'react';
import { ArrowUpRight, CalendarPlus, Check, ChevronDown, Copy, Download, RefreshCw, X } from 'lucide-react';
import { CALENDAR_PATH, calendarLinks } from '../lib/calendar';

export function CalendarAdd() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const links = calendarLinks(window.location.origin);

  async function copyLink() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(links.feed);
      setMessage('Calendar link copied.');
    } catch {
      input.current?.focus();
      input.current?.select();
      setMessage('Link selected. Choose Copy to copy it manually.');
    }
  }

  return <>
    <button className="calendar-trigger" type="button" aria-haspopup="dialog" onClick={() => {
      setMessage('');
      dialog.current?.showModal();
    }}><CalendarPlus size={17} strokeWidth={1.6} />Add to calendar</button>
    <dialog ref={dialog} className="address-dialog calendar-dialog" aria-labelledby="calendar-heading" aria-describedby="calendar-description"
      onClick={(e) => { if (e.target === e.currentTarget) dialog.current?.close(); }}>
      <button className="dialog-close" onClick={() => dialog.current?.close()} aria-label="Close calendar options"><X size={20} /></button>
      <span className="calendar-emblem"><CalendarPlus size={25} strokeWidth={1.5} /></span>
      <h2 id="calendar-heading">The whole weekend.<br /><em>Right in your calendar.</em></h2>
      <p id="calendar-description">Add Thursday and Saturday together, with every time, address, and helpful note.</p>

      <div className="calendar-options">
        <a className="calendar-option" href={links.apple}><CalendarPlus size={21} /><span>Apple Calendar<small>Subscribe on iPhone, iPad, or Mac</small></span><ArrowUpRight size={17} /></a>
        <a className="calendar-option" href={links.google} target="_blank" rel="noreferrer"><CalendarPlus size={21} /><span>Google Calendar<small>Subscribe in a computer browser</small></span><ArrowUpRight size={17} /></a>
      </div>
      <p className="calendar-sync-note"><RefreshCw size={15} /><span>Subscribe once to receive future changes when your calendar refreshes. Updates can take time; check this site for the latest day-of plan.</span></p>

      <details className="calendar-help">
        <summary><span>Need a hand adding it?</span><ChevronDown size={16} /></summary>
        <p><strong>Google:</strong> on a computer, open Calendar → Other calendars + → From URL, then paste the link below. It will also appear in your phone’s Google Calendar.</p>
        <p><strong>iPhone:</strong> open Calendar → Calendars → Add Calendar → Add Subscription Calendar, then paste this link.</p>
        <label htmlFor="calendar-url">Calendar subscription link</label>
        <div className="calendar-copy-row">
          <input ref={input} id="calendar-url" readOnly value={links.feed} onFocus={(e) => e.target.select()} />
          <button type="button" onClick={copyLink} aria-label="Copy calendar subscription link">{message === 'Calendar link copied.' ? <Check size={18} /> : <Copy size={18} />}</button>
        </div>
        <p className="calendar-copy-status" role="status">{message}</p>
      </details>
      <div className="calendar-download">
        <a href={CALENDAR_PATH} download="matts-wedding-weekend.ics"><Download size={15} />Download a one-time copy</a>
        <p>Imports won’t receive future updates.</p>
      </div>
    </dialog>
  </>;
}
