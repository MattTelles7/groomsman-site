# Editing the field guide

The single content source is `src/data/schedule.ts`. Edit locally, run
`npm run check`, commit, push to the deployment branch, and run the VM updater.

## Change a time

```ts
{
  id: 'meet',
  time: '12:15',
  period: 'PM',
  start: '2026-09-26T12:15:00-04:00',
  end: '2026-09-26T12:30:00-04:00',
  // ...the remaining event fields
}
```

`time` is the human-readable label. `start` and `end` control live behavior.
Update both when the plan changes. Keep events chronological. Use `end` only
when the activity has a known interval. A start without an end is a milestone:
it becomes “Earlier” after the start instead of staying active indefinitely.

For a genuinely unknown start, keep `start: null`. An optional `deadline` is an
arrival cutoff, not an invented departure time. `approximate: true` adds “About”
to countdowns and “Around now” to the current state.

September’s Indiana offset is `-04:00`. If moving the wedding to another season,
check daylight saving time and update the offset, dates, weekday labels, and
tests. The wedding timezone is `America/Indiana/Indianapolis`. The page heading
and footer date in `src/App.tsx` and metadata in `index.html` must also be updated
if this is repurposed for another wedding.

## Change an address

Update the corresponding `venues` entry once. All associated cards use it:

```ts
apartment: {
  name: 'Chris’s apartment',
  street: '60 Clubhouse Ln, Apt 60A',
  city: 'Fairfield, OH 45014',
}
```

Cards copy `street, city`, including apartment/unit information. Travel cards
copy the **destination** address: leaving Ertel copies The Hall’s address.
Campus notes such as “behind the playground” are displayed separately; the
copyable value remains the church’s navigable street address.

## Card appearance

| Category | Purpose | Light palette |
| --- | --- | --- |
| `essential` | Arrival / Mass | Pistachio |
| `prep` | Prep and buffers | Soft stone |
| `photos` | Photo sessions | Lilac |
| `travel` | Driving and departure | Powder blue |
| `celebrate` | Dinner / reception | Apricot |

`compact: true` reduces a card’s padding. `callout` creates a small emphasis
label. The Wedding Mass card gets extra vertical space. Shared palette and
layout tokens are in `src/styles.css`, including dark-mode values.

Live progress uses the device clock. The page does not verify attendance or
whether a real-world event is running late, so its status says “on the schedule
now.” It does not automatically scroll or steal focus as time advances. The
coming-up banner jumps to the relevant card when tapped.

The automatically selected day follows the Indiana calendar if the tab stays
open overnight. Manually choosing a day keeps that choice for the session.
TBD activities become past entries once their calendar date has passed.

## Review checklist

- Desktop and phone: all notes/addresses visible, no horizontal scroll.
- System light and dark modes; header override and “system” reset.
- Copy a church, apartment, and travel destination address.
- Block clipboard access: verify the selected-address dialog and Escape.
- Switch Thursday/Saturday with touch and keyboard arrow keys.
- Confirm the live border switches at 12:15, 12:30, 14:00, and 15:00 Eastern.
- Verify the countdown stops at zero when Mass starts, and the schedule wraps
  after the 18:00 bus milestone.
- Reduced motion, 200% text/zoom, and visible keyboard focus.
- Reload after a VM update to see the newest schedule.
