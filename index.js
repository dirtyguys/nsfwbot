const util = require('util');
const botkit = require('botkit');
const controller = botkit.slackbot({ json_file_store: 'slack-data-store' });
const bot = controller.spawn({ token: process.env.TOKEN });

const getUserInfo = (id) => {
  if (!getUserInfo.users[id]) {
    return util.promisify(bot.api.users.info)({ user: id }).then(user => {
      getUserInfo.users[id] = user;
      return Promise.resolve(user);
    });
  } else {
    return Promise.resolve(getUserInfo.users[id]);
  }
};
getUserInfo.users = {};

controller.on('direct_message', (bot, message) => {
  getUserInfo(message.user).then(user => {
    console.log(user.user.name, message.text);

    let links = message.text.match(/<[^>]+/g);
    if (links) {
      links = links.map(e => e.slice(1));
      console.log('got links:', links);

      bot.reply(message, `got links: ${links}`);
    } else {
      bot.reply(message, 'no link');
    }
  }).catch(console.error);
});

bot.startRTM();
