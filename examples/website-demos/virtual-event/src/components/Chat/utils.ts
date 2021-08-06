export const getFormattedTime = (time: number) => {
  if (!time) return '';
  if (time < 60) return 'Less than 1 min';
  if (time < 120) return '1 min';
  if (time < 3600) return `${Math.floor(time / 60)} mins`;
  if (time < 7200) return '1 hour';
  if (time < 86400) return `${Math.floor(time / 3600)} hours`;
  if (time < 172800) return '1 day';
  return `${Math.floor(time / 86400)} days`;
};

const randomTitles = [
  'Admin',
  'Moderator',
  'Speaker',
  'Software Engineer',
  'Frontend Developer',
  'Mobile Developer',
  'System Architect',
  'Product Manager',
  'Content Designer',
  'Inside Sales',
  'UX/UI Designer',
  'Marketing Manger',
  'Technical Recruiter',
  'Technical Marketing',
  'Content Marketing',
  'Customer Success',
  'Integration Engineer',
  'Sales Engineer',
  'Community Manager',
  'Developer Relations',
  'Accounting',
  'Sales Operations',
];

export const getRandomTitle = () => {
  const index = Math.floor(randomTitles.length * Math.random());
  return randomTitles[index];
};
