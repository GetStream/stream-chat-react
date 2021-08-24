import {
  Card1,
  Card2,
  Card3,
  Card4,
  Card5,
  Card6,
  Card7,
  Participant1,
  Participant2,
  Participant3,
  Participant4,
  Participant5,
  Participant6,
} from '../../assets';

type Event = {
  chatType: 'main-event' | 'room';
  content: string;
  eventName: string;
  eventNumber: number;
  label: string;
  presenters: number;
  title: string;
  jpeg?: string;
  viewers?: number;
};

const p1 = { image: Participant1, name: 'Lita Sherman' };
const p2 = { image: Participant2, name: 'Kirk Purdie' };
const p3 = { image: Participant3, name: 'Neal Sameera' };
const p4 = { image: Participant4, name: 'Jaana Kirstie' };
const p5 = { image: Participant5, name: 'Khalid Ignác' };
const p6 = { image: Participant6, name: 'Halide Nursultan' };

export const getParticipantOrder = (number?: number) => {
  switch (number) {
    case 0:
      return { 0: p1, 1: p2, 2: p3, 3: p4, 4: p5, 5: p6 };

    case 1:
      return { 0: p2, 1: p3, 2: p4, 3: p5, 4: p6, 5: p1 };

    case 2:
      return { 0: p3, 1: p4, 2: p5, 3: p6, 4: p1, 5: p2 };

    case 3:
      return { 0: p4, 1: p5, 2: p6, 3: p1, 4: p2, 5: p3 };

    case 4:
      return { 0: p5, 1: p6, 2: p1, 3: p2, 4: p3, 5: p4 };

    default:
      return { 0: p6, 1: p1, 2: p2, 3: p3, 4: p4, 5: p5 };
  }
};

export const mainEvents: Event[] = [
  {
    chatType: 'main-event',
    content:
      'Set you business plan to use information to a competitive advantage and support enterprise goals. A smart city uses different types of electronic methods and sensors to collect data. Insights gained from that data are used to manage assets, resources, and services efficiently.',
    eventName: 'cybersecurity',
    eventNumber: 0,
    jpeg: Card2,
    label: 'Moderated',
    presenters: 6,
    title: 'Implementing a Cybersecurity Framework',
    viewers: 150,
  },
  {
    chatType: 'main-event',
    content:
      'Analyze how city and campus-based technology leaders are responsibly improving the experience of the people and businesses they serve.',
    eventName: 'data',
    eventNumber: 1,
    jpeg: Card1,
    label: 'Open',
    presenters: 1,
    title: "Data Sets: the true smart city's superpower",
    viewers: 150,
  },
  {
    chatType: 'main-event',
    content:
      'Identifying data analytics ROI opportunities. Return on investment (ROI) is a performance measure used to evaluate the efficiency or profitability of an investment or compare the efficiency of a number of different investments.',
    eventName: 'roi',
    eventNumber: 2,
    jpeg: Card7,
    label: '04 June 2021, 09:00 AM MT',
    presenters: 2,
    title: 'Defining ROI in the Modern Data World',
  },
  {
    chatType: 'main-event',
    content:
      'How to set a business plans to use information to a competitive advantage and support enterprise goals.',
    eventName: 'data',
    eventNumber: 3,
    jpeg: Card5,
    label: '04 June 2021, 11:00 AM MT',
    presenters: 2,
    title: 'Q&A session: data strategy and executive communication',
  },
];

export const rooms: Event[] = [
  {
    chatType: 'room',
    content:
      'ESG regulations, standards, and disclosure: Who to publish it for and how to make it meaningful.',
    eventName: 'esg',
    eventNumber: 0,
    jpeg: Card1,
    label: 'Private',
    presenters: 2,
    title: 'ESG Data - How to create it',
    viewers: 150,
  },
  {
    chatType: 'room',
    content:
      'How to set a business plan to use information to a competitive advantage and support enterprise goals.',
    eventName: 'qa',
    eventNumber: 1,
    jpeg: Card2,
    label: 'Moderated',
    presenters: 6,
    title: 'Q&A session: Data strategy and executive communication',
    viewers: 150,
  },
  {
    chatType: 'room',
    content:
      'Learn how to combine approaches with declarative API for native management and deployment across clusters.',
    eventName: 'git',
    eventNumber: 2,
    jpeg: Card3,
    label: 'Moderated',
    presenters: 2,
    title: 'Managing multiple clusters with GitOps and ClusterAPI',
    viewers: 86,
  },
  {
    chatType: 'room',
    content: 'Data management & Analytics best practices - Driving data literacy',
    eventName: 'entertainment',
    eventNumber: 3,
    jpeg: Card4,
    label: 'Open',
    presenters: 6,
    title: 'Entertainment data literacy: learning to love the data',
    viewers: 150,
  },
  {
    chatType: 'room',
    content: 'Data governance imperative - Balancing data privacy & data sharing',
    eventName: 'tools',
    eventNumber: 4,
    jpeg: Card5,
    label: 'Closed',
    presenters: 5,
    title: 'Tools, Teams and Processes: how to successfully implement a data…',
    viewers: 100,
  },
  {
    chatType: 'room',
    content: 'Identifying the opportunities for ROI from Data and Analytics.',
    eventName: 'roi',
    eventNumber: 5,
    jpeg: Card6,
    label: 'Open',
    presenters: 6,
    title: 'Defining ROI in the Modern Data World',
    viewers: 150,
  },
];
