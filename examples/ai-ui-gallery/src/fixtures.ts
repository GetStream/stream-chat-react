// What the gallery shows: replies whose UI uses every part of the A2UI basic catalog and the
// OpenUI chat library a person is likely to see, a reply that finishes without a text reply,
// and tool calls that wait for the person's approval.
import {
  type AIMessage,
  fromStreamMessage,
  parseMessageParts,
} from 'stream-chat-react/ai-components';

const line = (message: Record<string, unknown>) =>
  JSON.stringify({ version: '1.0', ...message });

const a2uiComponents = [
  {
    children: ['title', 'intro', 'days', 'divider', 'form', 'actions', 'details', 'next'],
    component: 'Column',
    id: 'root',
  },
  { component: 'Text', id: 'title', text: '## A weekend in Ohrid' },
  {
    component: 'Text',
    id: 'intro',
    text: 'Two easy days by the lake, with the boat to St. Naum on Sunday.',
    variant: 'caption',
  },
  {
    component: 'Tabs',
    id: 'days',
    tabs: [
      { child: 'saturday', title: 'Saturday' },
      { child: 'sunday', title: 'Sunday' },
      { child: 'monday', title: 'Monday' },
    ],
  },
  {
    component: 'Text',
    id: 'saturday',
    text: '**Morning:** coffee by the harbour.\n\n> **Good to know:** book the boat the day before.',
  },
  {
    component: 'Text',
    id: 'sunday',
    text: 'The boat to St. Naum, then the Bay of Bones.',
  },
  { component: 'Text', id: 'monday', text: 'The drive home.' },
  { component: 'Divider', id: 'divider' },
  { child: 'form_column', component: 'Card', id: 'form' },
  {
    children: ['name', 'notes', 'date', 'budget', 'insurance', 'pace', 'extras'],
    component: 'Column',
    id: 'form_column',
  },
  {
    checks: [
      {
        condition: { '@call': 'required', args: { value: { '@path': '/name' } } },
        message: 'Say who is coming',
      },
    ],
    component: 'TextField',
    id: 'name',
    label: 'Who is coming',
    placeholder: 'Names',
    value: { '@path': '/name' },
  },
  {
    component: 'TextField',
    id: 'notes',
    label: 'Anything else',
    value: { '@path': '/notes' },
    variant: 'longText',
  },
  {
    component: 'DateTimeInput',
    enableDate: true,
    enableTime: false,
    id: 'date',
    label: 'Arriving',
    value: { '@path': '/date' },
  },
  {
    component: 'Slider',
    id: 'budget',
    label: 'Budget per night',
    max: 300,
    min: 20,
    value: { '@path': '/budget' },
  },
  {
    component: 'CheckBox',
    id: 'insurance',
    label: 'Add travel insurance',
    value: { '@path': '/insurance' },
  },
  {
    component: 'ChoicePicker',
    displayStyle: 'chips',
    id: 'pace',
    label: 'Pace',
    options: [
      { label: 'Relaxed', value: 'relaxed' },
      { label: 'Packed', value: 'packed' },
    ],
    value: { '@path': '/pace' },
    variant: 'mutuallyExclusive',
  },
  {
    component: 'ChoicePicker',
    id: 'extras',
    label: 'More of',
    options: [
      { label: 'History', value: 'history' },
      { label: 'Food', value: 'food' },
    ],
    value: { '@path': '/extras' },
    variant: 'multipleSelection',
  },
  { children: ['update', 'later', 'map'], component: 'Row', id: 'actions' },
  {
    action: { event: { name: 'update_plan' } },
    child: 'update_label',
    component: 'Button',
    id: 'update',
    variant: 'primary',
  },
  { component: 'Text', id: 'update_label', text: 'Update the plan' },
  {
    action: { event: { name: 'later' } },
    child: 'later_label',
    component: 'Button',
    id: 'later',
  },
  { component: 'Text', id: 'later_label', text: 'Save for later' },
  {
    action: { event: { name: 'map' } },
    child: 'map_label',
    component: 'Button',
    id: 'map',
    variant: 'borderless',
  },
  { component: 'Text', id: 'map_label', text: 'Open the map' },
  {
    component: 'Modal',
    content: 'details_body',
    id: 'details',
    trigger: 'details_button',
  },
  {
    action: { event: { name: 'details' } },
    child: 'details_label',
    component: 'Button',
    id: 'details_button',
  },
  { component: 'Text', id: 'details_label', text: 'Booking details' },
  {
    children: ['details_title', 'details_list'],
    component: 'Column',
    id: 'details_body',
  },
  { component: 'Text', id: 'details_title', text: '### Booking details' },
  { children: ['details_one', 'details_two'], component: 'List', id: 'details_list' },
  { component: 'Text', id: 'details_one', text: 'Hotel Riviera, two nights' },
  { component: 'Text', id: 'details_two', text: 'Boat at 10:00', variant: 'caption' },
  { children: ['hotel', 'eat'], component: 'Column', id: 'next' },
  {
    action: { event: { name: 'ask', userMessage: 'Find a hotel by the lake' } },
    child: 'hotel_label',
    component: 'Button',
    id: 'hotel',
    variant: 'borderless',
  },
  { component: 'Text', id: 'hotel_label', text: 'Find a hotel by the lake' },
  {
    action: { event: { name: 'ask', userMessage: 'Where should we eat?' } },
    child: 'eat_label',
    component: 'Button',
    id: 'eat',
    variant: 'borderless',
  },
  { component: 'Text', id: 'eat_label', text: 'Where should we eat?' },
];

export const a2uiLines = [
  line({
    createSurface: {
      dataModel: {
        budget: 120,
        date: '',
        extras: ['food'],
        insurance: true,
        name: '',
        notes: '',
        pace: ['relaxed'],
      },
      surfaceId: 'showcase',
    },
  }),
  line({ updateComponents: { components: a2uiComponents, surfaceId: 'showcase' } }),
];

export const openUIProgram = [
  'root = Card([header, intro, days, tags, info, success, warning, error, note, table, form, next])',
  'header = CardHeader("A weekend in Ohrid", "The old town, the lake and St. Naum")',
  'intro = TextContent("Two easy days by the lake, with the boat to St. Naum on Sunday.")',
  'days = Tabs([TabItem("sat", "Saturday", [TextContent("Coffee by the harbour, then the fortress.")]), TabItem("sun", "Sunday", [TextContent("The boat to St. Naum.")])])',
  'tags = TagBlock(["Lake", "Old town", "Boat trip"])',
  'info = Callout("info", "Good to know", "Book the boat the day before.")',
  'success = Callout("success", "Booked", "Your room is held until Friday.")',
  'warning = Callout("warning", "Busy weekend", "Restaurants fill up early.")',
  'error = TextCallout("danger", "Sold out", "The 10:00 boat is full.")',
  'note = TextCallout("neutral", "Tip", "Bring cash for the boat.")',
  'table = Table([Col("Place", ["Plaošnik", "Samuel\'s Fortress"]), Col("Time", ["1 hour", "2 hours"])])',
  'form = Form("refine", buttons, [name, kind, budget, extras, pace])',
  'name = FormControl("Who is coming", Input("name", "Names"))',
  'kind = FormControl("Room", Select("room", [SelectItem("double", "Double"), SelectItem("twin", "Twin")], "Pick a room"))',
  'budget = FormControl("Budget per night", Slider("budget", "continuous", 20, 300, 10, [120]))',
  'extras = FormControl("Extras", CheckBoxGroup("extras", [CheckBoxItem("Breakfast", "Served from 7:00", "breakfast", true), CheckBoxItem("Parking", "Behind the hotel", "parking")]))',
  'pace = FormControl("Pace", Chips("pace", "single", [ChipItem("relaxed", "Relaxed"), ChipItem("packed", "Packed")], null, "relaxed"))',
  'buttons = Buttons([Button("Update the plan", Action([@ToAssistant("Update the plan")]), "primary"), Button("Save for later", Action([@ToAssistant("Save it")]), "secondary"), Button("Cancel the trip", Action([@ToAssistant("Cancel")]), "secondary", "destructive"), Button("Delete the plan", Action([@ToAssistant("Delete")]), "primary", "destructive")])',
  'next = FollowUpBlock([FollowUpItem("Find a hotel by the lake"), FollowUpItem("Where should we eat?")])',
].join('\n');

const reply = (
  id: string,
  format: 'a2ui' | 'openui',
  content: string,
  text = '',
): AIMessage =>
  fromStreamMessage({
    attachments: [],
    // stream-chat v10 keeps fields it doesn't know under `custom`.
    custom: {
      ai_generated: true,
      ai_ui: { content, format, status: 'complete', v: 1, version: '1.0' },
    },
    id,
    text,
  });

const user = (id: string, text: string): AIMessage => ({ id, role: 'user', text });

export const USER_ID = 'alex';
export const CLIENT_ID = 'gallery';

const approvalParts = parseMessageParts([
  {
    approval: {
      message: 'The message goes to the #travel channel.',
      reason: 'to tell your team about the trip',
      title: 'Send a Slack message?',
    },
    arguments: { channel: '#travel', text: 'Off to Ohrid on Friday.' },
    display_title: 'Sending a message',
    executor: 'server',
    id: 'call_short',
    name: 'send_slack_message',
    status: 'awaiting_approval',
    target_user_id: USER_ID,
    type: 'ai_tool_call',
    v: 1,
  },
  {
    approval: { title: 'Book the hotel?' },
    arguments: {
      checkIn: '2026-11-14',
      checkOut: '2026-11-16',
      guests: [
        { age: 34, name: 'Alex' },
        { age: 33, name: 'Sam' },
      ],
      hotel: 'Hotel Riviera',
      notes:
        'A room facing the lake, on a high floor if there is one, and a late check-out.',
      room: 'double',
    },
    display_title: 'Booking the hotel',
    executor: 'server',
    id: 'call_long',
    name: 'book_hotel',
    status: 'awaiting_approval',
    target_user_id: USER_ID,
    type: 'ai_tool_call',
    v: 1,
  },
]);

export const messages: AIMessage[] = [
  user('u1', 'Plan a weekend in Ohrid (A2UI)'),
  reply('a1', 'a2ui', a2uiLines.join('\n'), 'A weekend in Ohrid.'),
  user('u2', 'Plan a weekend in Ohrid (OpenUI)'),
  reply('a2', 'openui', openUIProgram, 'A weekend in Ohrid.'),
  user('u3', 'Show me something'),
  // A2UI that makes no surface, and no words: the reply shows neither UI nor text.
  reply('a3', 'a2ui', line({ deleteSurface: { surfaceId: 'nothing' } })),
  user('u4', 'Book it and tell the team'),
  { id: 'a4', parts: approvalParts, role: 'assistant', text: '' },
];
