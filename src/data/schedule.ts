export const wedding = {
  date: '2026-09-26',
  ceremony: '2026-09-26T14:00:00-04:00',
  timeZone: 'America/Indiana/Indianapolis',
  timeZoneLabel: 'Eastern time',
  groom: 'Matt',
};

export type LocationId = 'apartment' | 'church' | 'cafe' | 'ertel' | 'hall';
export type DayId = 'thursday' | 'saturday';
export type Category = 'prep' | 'essential' | 'photos' | 'travel' | 'celebrate';
export type IconName = 'shirt' | 'church' | 'camera' | 'car' | 'wine' | 'bus' | 'coffee' | 'clock' | 'users';

export interface Venue {
  name: string;
  street: string;
  city: string;
  note?: string;
  source?: string;
}

export const venues: Record<LocationId, Venue> = {
  apartment: {
    name: 'Matt’s apartment',
    street: '60 Clubhouse Ln, Apt 60A',
    city: 'Fairfield, OH 45014',
  },
  church: {
    name: 'St. Joseph Catholic Church',
    street: '7536 Church Ln',
    city: 'St. Leon, IN 47060',
    note: 'All Saints Parish · St. Joseph campus',
    source: 'https://allsaintscatholic.net/',
  },
  cafe: {
    name: 'Ars Café & Meeting House',
    street: '6988 N Dearborn Rd, Unit 100',
    city: 'Guilford, IN 47022',
    note: 'Confirmed rehearsal dinner location.',
    source: 'https://maps.apple.com/place?place-id=ID0244C47C81C3209',
  },
  ertel: {
    name: 'Ertel Cellars Winery',
    street: '3794 E County Road 1100 N',
    city: 'Batesville, IN 47006',
    note: 'Bus: use the lower lot. Check the winery’s directions if your GPS route looks off.',
    source: 'https://ertelcellars.com/contact-us/',
  },
  hall: {
    name: 'The Hall',
    street: '624 Delaware Rd',
    city: 'Batesville, IN 47006',
    source: 'https://www.thehall-batesville.com/contact-1',
  },
};

export interface ScheduleEvent {
  id: string;
  day: DayId;
  section: string;
  title: string;
  time: string;
  period?: string;
  start: string | null;
  end?: string;
  deadline?: string;
  approximate?: boolean;
  category: Category;
  icon: IconName;
  location?: LocationId;
  locationLabel?: string;
  notes: string;
  callout?: string;
  compact?: boolean;
}

export const logistics = {
  morning: 'Meet at Matt’s apartment at 8:00 AM. Leave at 11:00 AM and drive or carpool to St. Joseph. Budget 45 minutes for the drive plus 30 minutes for traffic, parking, and finding the school before the 12:15 PM meetup. Check traffic before leaving.',
  bus: 'The entire wedding party rides Savannah Nite / Empire Corporate Trans bus #61 after church photos, then on to Ertel and The Hall. Use the lower lot at Ertel. Leave Ertel at 5:20 PM, 5:30 latest; bus service ends at 6:00 PM.',
  carRetrieval: 'Cars will stay at the church. The plan for getting everyone back to collect them is still to come.',
  locations: 'At St. Joseph, meet in the school behind the church, not the PLC. Rehearsal dinner at Ars Café is confirmed. Ertel notes that some GPS routes can be inaccurate.',
};

// Explicit UTC offsets keep the Indiana schedule correct on every guest’s device.
// null means genuinely TBD; never invent a start time to make a countdown work.
export const events: ScheduleEvent[] = [
  {
    id: 'rehearsal', day: 'thursday', section: 'A little practice',
    title: 'Arrive for the rehearsal', time: '5:15', period: 'PM',
    start: '2026-09-24T17:15:00-04:00', end: '2026-09-24T18:30:00-04:00',
    category: 'essential', icon: 'church', location: 'church',
    notes: 'Arrive at the church at 5:15 PM so everyone is ready for the 5:30 PM rehearsal. We’ll walk through Saturday’s Mass.',
    callout: 'Rehearsal starts at 5:30 PM',
  },
  {
    id: 'dinner', day: 'thursday', section: 'A little practice',
    title: 'Rehearsal dinner', time: '6:30', period: 'PM',
    start: '2026-09-24T18:30:00-04:00',
    category: 'celebrate', icon: 'coffee', location: 'cafe',
    notes: 'Rehearsal dinner at Ars Café & Meeting House. Come hungry and enjoy the evening together.',
    callout: 'Dinner confirmed',
  },
  {
    id: 'get-ready', day: 'saturday', section: 'Before the “I do”',
    title: 'Suit up, gentlemen.', time: '8:00', period: 'AM',
    start: '2026-09-26T08:00:00-04:00', end: '2026-09-26T11:00:00-04:00',
    category: 'prep', icon: 'shirt', location: 'apartment',
    notes: 'Get ready together at Matt’s apartment. We’ve got plenty of time to settle in and get dressed before leaving at 11:00 AM.',
    callout: 'Meet at Matt’s',
  },
  {
    id: 'drive-church', day: 'saturday', section: 'Before the “I do”',
    title: 'Make your way to the church', time: '11:00', period: 'AM',
    start: '2026-09-26T11:00:00-04:00', end: '2026-09-26T12:15:00-04:00',
    deadline: '2026-09-26T12:15:00-04:00',
    category: 'travel', icon: 'car', location: 'church', compact: true,
    notes: 'Leave the apartment at 11:00 AM. Drive or carpool; allow 45 minutes on the road plus 30 minutes of padding for traffic, parking, and finding the school. Check traffic before leaving.',
    callout: 'At the school by 12:15 PM',
  },
  {
    id: 'meet', day: 'saturday', section: 'Before the “I do”',
    title: 'All hands on deck', time: '12:15', period: 'PM',
    start: '2026-09-26T12:15:00-04:00', end: '2026-09-26T12:30:00-04:00',
    category: 'essential', icon: 'users', location: 'church',
    locationLabel: 'School building behind the church',
    notes: 'Meet at the school building behind St. Joseph. The girls are using the PLC building, so head to the school instead.',
    callout: 'Be here on time',
  },
  {
    id: 'groomsmen-photos', day: 'saturday', section: 'Before the “I do”',
    title: 'The guys, on camera', time: '12:30–1:30', period: 'PM',
    start: '2026-09-26T12:30:00-04:00', end: '2026-09-26T13:30:00-04:00',
    category: 'photos', icon: 'camera', location: 'church', locationLabel: 'Behind the playground',
    notes: 'Groomsmen photos behind the playground. Be picture-ready; Ben Gomez is included.',
  },
  {
    id: 'final-prep', day: 'saturday', section: 'Before the “I do”',
    title: 'A moment to get ready', time: '1:30–2:00', period: 'PM',
    start: '2026-09-26T13:30:00-04:00', end: '2026-09-26T14:00:00-04:00',
    category: 'prep', icon: 'clock', location: 'church', compact: true,
    notes: 'Final prep and a little breathing room before Mass.',
  },
  {
    id: 'mass', day: 'saturday', section: 'The main event',
    title: 'Let’s make it official.', time: '2:00', period: 'PM',
    start: '2026-09-26T14:00:00-04:00', end: '2026-09-26T15:00:00-04:00',
    category: 'essential', icon: 'church', location: 'church',
    notes: 'Wedding Mass. Follow the plan from rehearsal and enjoy the moment.',
    callout: 'Wedding Mass',
  },
  {
    id: 'family-photos', day: 'saturday', section: 'The main event',
    title: 'One for the family album', time: '3:00', period: 'PM',
    start: '2026-09-26T15:00:00-04:00', end: '2026-09-26T16:00:00-04:00',
    category: 'photos', icon: 'camera', location: 'church',
    notes: 'Church and family photos. Stay close and available until you’re released.',
  },
  {
    id: 'to-ertel', day: 'saturday', section: 'On to the celebration',
    title: 'Next stop: the vineyard', time: 'Around 4:00', period: 'PM',
    start: '2026-09-26T16:00:00-04:00', end: '2026-09-26T16:25:00-04:00', approximate: true,
    category: 'travel', icon: 'bus', location: 'ertel', compact: true,
    notes: `The entire wedding party rides the bus after church photos. ${logistics.carRetrieval}`,
    callout: 'Everyone on the bus',
  },
  {
    id: 'ertel-photos', day: 'saturday', section: 'On to the celebration',
    title: 'Vineyard views & a few more photos', time: '4:25/4:30–5:20', period: 'PM',
    start: '2026-09-26T16:25:00-04:00', end: '2026-09-26T17:20:00-04:00', approximate: true,
    category: 'photos', icon: 'camera', location: 'ertel',
    notes: 'Photos at Ertel Cellars. Start around 4:25–4:30 PM. The bus should use the lower lot.',
    callout: 'Lower lot for the bus',
  },
  {
    id: 'leave-ertel', day: 'saturday', section: 'On to the celebration',
    title: 'Load up. Let’s celebrate.', time: '5:20', period: 'PM',
    start: '2026-09-26T17:20:00-04:00', end: '2026-09-26T17:35:00-04:00',
    category: 'travel', icon: 'bus', location: 'hall', compact: true,
    notes: 'Everyone back on the bus. Leave Ertel at 5:20 PM if possible; 5:30 PM at the latest. Load up quickly and head to The Hall.',
    callout: '5:30 PM absolute latest',
  },
  {
    id: 'reception', day: 'saturday', section: 'On to the celebration',
    title: 'Time for the good part.', time: '5:35–5:45', period: 'PM',
    start: '2026-09-26T17:35:00-04:00', end: '2026-09-26T18:00:00-04:00', approximate: true,
    category: 'celebrate', icon: 'wine', location: 'hall',
    notes: 'Arrive at The Hall between 5:35 and 5:45 PM. Be ready for reception entrances.',
    callout: 'Reception arrival',
  },
  {
    id: 'bus-ends', day: 'saturday', section: 'On to the celebration',
    title: 'That’s a wrap for the bus', time: '6:00', period: 'PM',
    start: '2026-09-26T18:00:00-04:00',
    category: 'prep', icon: 'bus', compact: true,
    notes: `Bus service ends. Everyone, take your belongings with you. ${logistics.carRetrieval}`,
  },
];

export const days = [
  { id: 'thursday' as const, short: 'Thu', label: 'Thursday', date: '2026-09-24', number: '24', title: 'The warm-up.', subtitle: 'Thursday, September 24' },
  { id: 'saturday' as const, short: 'Sat', label: 'Saturday', date: '2026-09-26', number: '26', title: 'The wedding day.', subtitle: 'Saturday, September 26' },
];

export function addressFor(id: LocationId) {
  const venue = venues[id];
  return `${venue.street}, ${venue.city}`;
}
