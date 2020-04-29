#!/usr/bin/env node
const { StreamChat } = require('stream-chat');
const fs = require('fs');

const tsFileName = `${__dirname}/../src/__testUtils__/mocked-data/`;

const generateUser = async (i) => {
  const client = new StreamChat(
    'z58ae7h2xypv',
    '4rw3ggqmp3fqxdnw8yja2zq4acpumrfvhjuc99zfdq3jbf84cnxxnfb9zygk479q',
  );
  const newUser = {
    id: `u${i}`,
  };
  const result = await client.updateUsers([newUser]);
  return {
    result: result.users[`u${i}`],
    fileName: `users/u${i}`,
  };
};

const generateChannel = async (i) => {
  const client = new StreamChat(
    'z58ae7h2xypv',
    '4rw3ggqmp3fqxdnw8yja2zq4acpumrfvhjuc99zfdq3jbf84cnxxnfb9zygk479q',
  );
  const newChannel = client.channel('messaging', `regular-channel-${i}`, {
    created_by_id: 'vishal',
  });
  const result = await newChannel.query({
    state: true,
  });
  return {
    result,
    fileName: `channels/regular-channel-${i}`,
  };
};

const generateUsers = async () => {
  for (let i = 0; i < 4; i++) {
    const result = await generateUser(i);
    console.log(result);
    write(result);
  }
};
const generateRegularChannels = async () => {
  for (let i = 0; i < 10; i++) {
    const result = await generateChannel(i);
    console.log(result);
    write(result);
  }
};

function executeAndWrite(func) {
  func().then(
    (response) => {
      write(response);
    },
    (error) => {
      console.log(`${func.name} failed with error: `, error);
    },
  );
}

function write(response) {
  fs.appendFile(
    `${tsFileName}${response.fileName}.json`,
    `${JSON.stringify(response.result)}`,
    function (err) {
      if (err) {
        return console.log(err);
      }

      // console.log(`✅ ${func.name}`);
      // countExecutables++;
      // checkIfComplete();
    },
  );
}

// generateUsers();
generateRegularChannels();
// executeAndWrite(generateRegularChannels);
