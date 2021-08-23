import React from 'react';
import {
  EventCard1,
  EventCard2,
  EventCard3,
  EventCard4,
  RoomCard1,
  RoomCard2,
  RoomCard3,
  RoomCard4,
  RoomCard5,
  RoomCard6,
} from '../../assets';

type Event = {
  chatType: 'main-event' | 'room';
  content: string;
  eventName: string;
  label: string;
  presenters: number;
  title: string;
  Image?: React.FC;
  jpeg?: string;
  viewers?: number;
};

export const mainEvents: Event[] = [
  {
    chatType: 'main-event',
    content:
      'Set you business plan to use information to a competitive advantage and support enterprise goals. A smart city uses different types of electronic methods and sensors to collect data. Insights gained from that data are used to manage assets, resources, and services efficiently.',
    eventName: 'cybersecurity',
    Image: EventCard1,
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
    Image: EventCard2,
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
    Image: EventCard3,
    label: '04 June 2021, 09:00 AM MT',
    presenters: 2,
    title: 'Defining ROI in the Modern Data World',
  },
  {
    chatType: 'main-event',
    content:
      'How to set a business plans to use information to a competitive advantage and support enterprise goals.',
    eventName: 'data',
    Image: EventCard4,
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
    jpeg: RoomCard1,
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
    jpeg: RoomCard2,
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
    jpeg: RoomCard3,
    label: 'Moderated',
    presenters: 2,
    title: 'Managing multiple clusters with GitOps and ClusterAPI',
    viewers: 86,
  },
  {
    chatType: 'room',
    content: 'Data management & Analytics best practices - Driving data literacy',
    eventName: 'entertainment',
    jpeg: RoomCard4,
    label: 'Open',
    presenters: 6,
    title: 'Entertainment data literacy: learning to love the data',
    viewers: 150,
  },
  {
    chatType: 'room',
    content: 'Data governance imperative - Balancing data privacy & data sharing',
    eventName: 'tools',
    jpeg: RoomCard5,
    label: 'Closed',
    presenters: 5,
    title: 'Tools, Teams and Processes: how to successfully implement a data…',
    viewers: 100,
  },
  {
    chatType: 'room',
    content: 'Identifying the opportunities for ROI from Data and Analytics.',
    eventName: 'roi',
    jpeg: RoomCard6,
    label: 'Open',
    presenters: 6,
    title: 'Defining ROI in the Modern Data World',
    viewers: 150,
  },
];
