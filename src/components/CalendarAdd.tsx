import { useRef, useState } from 'react';
import { ArrowUpRight, CalendarPlus, Check, ChevronDown, Copy, Download, RefreshCw, X } from 'lucide-react';
import { CALENDAR_PATH, calendarLinks } from '../lib/calendar';

export function CalendarAdd() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const links = calendarLinks(window.location.origin);

  async function copyLink(successMessage = 'Calendar link copied.') {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(links.feed);
      setMessage(successMessage);
      return true;
    } catch {
      setHelpOpen(true);
      input.current?.focus();
      input.current?.select();
      setMessage('Link selected. Choose Copy to copy it manually.');
      return false;
    }
  }

  async function prepareGoogleSetup() {
    const copied = await copyLink('Calendar link copied. You’re ready for Google Calendar.');
    setGoogleReady(copied);
  }

  return <>
    <button className="calendar-trigger" type="button" aria-haspopup="dialog" onClick={() => {
      setMessage('');
      setGoogleReady(false);
      setHelpOpen(false);
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
        {googleReady ? <div className="google-ready" role="status">
          <span className="google-ready-title"><Check size={18} />Calendar link copied</span>
          <span>Open Google Calendar, click the URL box, then press <kbd>⌘</kbd> + <kbd>V</kbd>.</span>
          <a href={links.googleSetup} target="_blank" rel="noreferrer">Open Google Calendar <ArrowUpRight size={16} /></a>
        </div> : <button className="calendar-option" type="button" onClick={() => { void prepareGoogleSetup(); }}><CalendarPlus size={21} /><span>Google Calendar<small>Copy the link first, then add it</small></span><ArrowUpRight size={17} /></button>}
      </div>
      <p className="calendar-sync-note"><RefreshCw size={15} /><span>Subscribe once to receive future changes when your calendar refreshes. Updates can take time; check this site for the latest day-of plan.</span></p>

      <details className="calendar-help" open={helpOpen} onToggle={(event) => setHelpOpen(event.currentTarget.open)}>
        <summary><span>Need a hand adding it?</span><ChevronDown size={16} /></summary>
        <p><strong>Google:</strong> copy the link above, then open Calendar’s “From URL” screen in a computer browser. Click the URL box, paste it, and choose Add calendar. It will then appear in your phone’s Google Calendar too.</p>
        <p><strong>iPhone:</strong> open Calendar → Calendars → Add Calendar → Add Subscription Calendar, then paste this link.</p>
        <label htmlFor="calendar-url">Calendar subscription link</label>
        <div className="calendar-copy-row">
          <input ref={input} id="calendar-url" readOnly value={links.feed} onFocus={(e) => e.target.select()} />
          <button type="button" onClick={() => { void copyLink(); }} aria-label="Copy calendar subscription link">{message === 'Calendar link copied.' ? <Check size={18} /> : <Copy size={18} />}</button>
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
