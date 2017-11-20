const util = require('util');
const url = require('url');
const path = require('path');
const botkit = require('botkit');
const entities = require('html-entities').Html5Entities;
const buildMatch = require('./lib/build-match');

const token = process.env.NSFWBOT_TOKEN;
const logChannel = process.env.NSFWBOT_LOG_CHANNEL;
const domain = process.env.NSFWBOT_DOMAIN;
const archiveRoot = process.env.NSFWBOT_ARCHIVE_ROOT || 'archives';

if (typeof token !== 'string' || token === '') {
  throw new Error('No token found. Please add slack bot token to env NSFWBOT_TOKEN');
}

const destMap = new Map();
const match = buildMatch(url => path.join(archiveRoot, destMap.get(url) || ''));
const controller = botkit.slackbot({ json_file_store: 'slack-data-store' });
const bot = controller.spawn({ token });

const listenAll = [ 'ambient', 'direct_mention', 'mention', 'direct_message' ];
controller.hears(/<[^>]+/, listenAll, async (bot, message) => {
  let links = message.text.match(/<[^>]+/g);
  if (!links) {
    return;
  }

  links = links.map(e => entities.decode(e.slice(1)));

  const downloads = links.map(link => {
    destMap.set(link, `${message.channel}/p${message.ts.replace(/\D/g, '')}`);
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
      console.error(`[${message.channel}][${message.ts.replace(/\D/g, '')}]`, e.message);
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
    text.push('');
    text.push('image saved,');
    logMessages.success.map(e => `${e.fromUrl} ${e.path.replace(/\\/g, '/')}`).forEach(e => text.push(e));
    text.push('');
    text.push('error,');
    logMessages.fail.map(e => `${e.message}`).forEach(e => text.push(e));

    bot.say({
      text: text.join('\n'),
      channel: logChannel
    });
  }
});

bot.startRTM();
