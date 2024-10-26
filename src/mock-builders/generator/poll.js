export const generatePoll = (data = {}) => {
  const pollId = 'WD4SBRJvLoGwB4oAoCQGM';

  const user1 = {
    banned: false,
    created_at: '2022-03-08T09:46:56.840739Z',
    id: 'admin',
    last_active: '2024-10-23T08:14:23.299448386Z',
    mutes: null,
    name: 'Test User',
    online: true,
    role: 'admin',
    updated_at: '2024-09-13T13:53:32.883409Z',
  };

  const user1Votes = [
    {
      created_at: '2024-10-22T15:58:27.756166Z',
      id: '332da4fe-e38c-465c-8f74-e8df69680f13',
      option_id: '85610252-7d50-429c-8183-51a7eba46246',
      poll_id: pollId,
      updated_at: '2024-10-22T15:58:27.756166Z',
      user: user1,
      user_id: user1.id,
    },
    {
      created_at: '2024-10-22T15:58:25.886491Z',
      id: '5657da00-256e-41fc-a580-b7adabcbfbe1',
      option_id: 'dc22dcd6-4fc8-4c92-92c2-bfd63245724c',
      poll_id: pollId,
      updated_at: '2024-10-22T15:58:25.886491Z',
      user: user1,
      user_id: user1.id,
    },
  ];

  const user2 = {
    banned: false,
    created_at: '2022-01-27T08:28:28.412254Z',
    id: 'SmithAnne',
    image: 'https://getstream.io/random_png/?name=SmithAnne',
    last_active: '2024-10-23T08:01:43.157632831Z',
    name: 'SmithAnne',
    nickname: 'Ann',
    online: true,
    role: 'user',
    updated_at: '2024-09-26T10:12:23.427141Z',
  };

  const user2Votes = [
    {
      created_at: '2024-10-22T16:00:50.2493Z',
      id: 'f428f353-3057-4353-b0b5-b33dcdeb1992',
      option_id: '7312e983-b042-4596-b5ce-f9e82deb363f',
      poll_id: pollId,
      updated_at: '2024-10-22T16:00:50.2493Z',
      user: user2,
      user_id: user2.id,
    },
    {
      created_at: '2024-10-22T16:00:54.410474Z',
      id: '75ba8774-bf17-4edd-8ced-39e7dc6aa7dd',
      option_id: '85610252-7d50-429c-8183-51a7eba46246',
      poll_id: pollId,
      updated_at: '2024-10-22T16:00:54.410474Z',
      user: user2,
      user_id: user2.id,
    },
  ];

  const user1Answer = {
    answer_text: 'comment1',
    created_at: '2024-10-23T13:12:57.944913Z',
    id: 'dbb4506c-c5a8-4ca6-86ec-0c57498916fe',
    is_answer: true,
    option_id: '',
    poll_id: pollId,
    updated_at: '2024-10-23T13:12:57.944913Z',
    user: user1,
    user_id: user1.id,
  };

  const user2Answer = {
    answer_text: 'comment2',
    created_at: '2024-10-23T13:12:57.944913Z',
    id: 'dbb4506c-c5a8-4ca6-86ec-0c57498916xy',
    is_answer: true,
    option_id: '',
    poll_id: pollId,
    updated_at: '2024-10-23T13:12:57.944913Z',
    user: user2,
    user_id: user2.id,
  };

  const pollConfigData = {
    allow_answers: true,
    allow_user_suggested_options: false,
    description: 'Poll description',
    enforce_unique_vote: false,
    id: pollId,
    max_votes_allowed: 2,
    name: 'XY',
    options: [
      {
        id: '85610252-7d50-429c-8183-51a7eba46246',
        text: 'A',
      },
      {
        id: '7312e983-b042-4596-b5ce-f9e82deb363f',
        text: 'B',
      },
      {
        id: 'ba933470-c0da-4b6f-a4d2-d2176ac0d4a8',
        text: 'C',
      },
      {
        id: 'dc22dcd6-4fc8-4c92-92c2-bfd63245724c',
        text: 'D',
      },
    ],
    voting_visibility: 'public',
  };

  const pollEnrichData = {
    answers_count: 1,
    latest_answers: [user1Answer, user2Answer],
    latest_votes_by_option: {
      '7312e983-b042-4596-b5ce-f9e82deb363f': [user2Votes[0]],
      '85610252-7d50-429c-8183-51a7eba46246': [user1Votes[0], user2Votes[1]],
      'dc22dcd6-4fc8-4c92-92c2-bfd63245724c': [user1Votes[1]],
    },
    own_votes: [...user1Votes, user1Answer],
    vote_count: 4,
    vote_counts_by_option: {
      '7312e983-b042-4596-b5ce-f9e82deb363f': 1,
      '85610252-7d50-429c-8183-51a7eba46246': 2,
      'dc22dcd6-4fc8-4c92-92c2-bfd63245724c': 1,
    },
  };

  const pollMetadata = {
    created_at: '2024-10-22T15:28:20.580523Z',
    created_by: user1,
    created_by_id: user1.id,
    updated_at: '2024-10-22T15:28:20.580523Z',
  };

  return {
    ...pollConfigData,
    ...pollEnrichData,
    ...pollMetadata,
    ...data,
  };
};
