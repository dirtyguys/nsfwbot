const util = require('util');
const url = require('url');
const botkit = require('botkit');
const entities = require('html-entities').Html5Entities;
const { match, map: destMap } = require('./rules');
const controller = botkit.slackbot({ json_file_store: 'slack-data-store' });
const bot = controller.spawn({ token: process.env.NSFWBOT_TOKEN });

const logChannel = process.env.NSFWBOT_LOG_CHANNEL;
const domain = process.env.NSFWBOT_DOMAIN;

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

const getChannelInfo = (id) => {
  if (!getChannelInfo.channels[id]) {
    return util.promisify(bot.api.channels.info)({ channel: id }).then(channel => {
      getChannelInfo.channels[id] = channel;
      return Promise.resolve(channel);
    });
  } else {
    return Promise.resolve(getChannelInfo.channels[id]);
  }
};
getChannelInfo.channels = {};

const listenAll = [ 'ambient', 'direct_mention', 'mention', 'direct_message' ];
controller.hears(/<[^>]+/, listenAll, async (bot, message) => {
  let links = message.text.match(/<[^>]+/g);
  if (!links) {
    return;
  }

  links = links.map(e => entities.decode(e.slice(1)));

  const downloads = links.map(link => {
    destMap.set(link, `archives/${message.channel}/p${message.ts.replace(/\D/g, '')}`);
    return match.download(link).catch(err => Promise.resolve(err));
  });

  const res = await Promise.all(downloads);
  const logMessages = {
    fail: [],
    success: []
  };

  res.forEach(e => {
    if (e.message) {
      // is error
      console.error(`${message.channel}/${message.ts.replace(/\D/g, '')}`, e.message);
      logMessages.fail.push(e);
    }
    else {
      console.log(`[${message.channel}][${message.ts.replace(/\D/g, '')}]`, 'image saved,', e.path.replace(/\\/g, '/'));
      logMessages.success.push(e);
    }
  });

  links.forEach(link => destMap.delete(link));

  if (logChannel) {
    const text = [];
    const msgLink = url.resolve(domain, `archives/${message.channel}/p${message.ts.replace(/\D/g, '')}`);
    text.push(msgLink);
    text.push('image saved,');
    logMessages.success.map(e => `${e.fromUrl} ${e.path.replace(/\\/g, '/')}`).forEach(e => text.push(e));
    text.push('');
    logMessages.fail.map(e => `${e.message}`).forEach(e => text.push(e));

    bot.say({
      text: text.join('\n'),
      channel: logChannel
    });
  }
});

bot.startRTM();
