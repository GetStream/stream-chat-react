import React from 'react';
import { Card1, Card2, Card4, Card5, Card6, Card7 } from '../../assets';

type Room = {
  chatType: 'main-event' | 'room';
  content: string;
  eventName: string;
  label: string;
  presenters: number;
  title: string;
  Image?: React.FC;
  viewers?: number;
};

export const rooms: Room[] = [
  {
    chatType: 'room',
    content:
      'ESG Regulations, Standards and Disclosure: Who to publish it for and how to make it meaningful.',
    eventName: 'esg',
    Image: Card1,
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
    Image: Card2,
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
    Image: Card5,
    label: 'Moderated',
    presenters: 2,
    title: 'Managing multiple clusters with GitOps and ClusterAPI',
    viewers: 86,
  },

  {
    chatType: 'room',
    content: 'Data management & Analytics best practices - Drivig data literacy',
    eventName: 'entertainment',
    Image: Card6,
    label: 'Open',
    presenters: 6,
    title: 'Entertainment data literacy: learning to love the data',
    viewers: 150,
  },

  {
    chatType: 'room',
    content: 'Data governance imperative - Balancing data privacy & data sharing',
    eventName: 'tools',
    Image: Card4,
    label: 'Closed',
    presenters: 5,
    title: 'Tools, Teams and Processes: how to successfully implement a data…',
    viewers: 100,
  },

  {
    chatType: 'room',
    content: 'Identifying the opportunities for ROI from Data and Analytics.',
    eventName: 'roi',
    Image: Card7,
    label: 'Open',
    presenters: 6,
    title: 'Defining ROI in the Modern Data World',
    viewers: 150,
  },
];
