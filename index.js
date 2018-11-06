const util = require('util');
const url = require('url');
const path = require('path');
const botkit = require('botkit');
const entities = require('html-entities').Html5Entities;
const buildMatch = require('./lib/build-match');
const getUserInfo = require('./lib/get-user-info');
const getChannelInfo = require('./lib/get-channel-info');
const ping = require('./lib/ping');

const token = process.env.NSFWBOT_TOKEN;
const logChannel = process.env.NSFWBOT_LOG_CHANNEL;
const domain = process.env.NSFWBOT_DOMAIN;
const archiveRoot = process.env.NSFWBOT_ARCHIVE_ROOT || 'archives';
const publicUrl = process.env.NSFWBOT_PUBLIC_URL || '';
const connectionTimeout = process.env.NSFWBOT_CONNECTION_TIMEOUT || 10;

if (typeof token !== 'string' || token === '') {
  throw new Error('No token found. Please add slack bot token to env NSFWBOT_TOKEN');
}

if (isNaN(parseInt(connectionTimeout, 10))) {
  throw new Error('Bad connection timeout value');
}

const destMap = new Map();
const match = buildMatch(url => path.join(archiveRoot, destMap.get(url) || ''));
const controller = botkit.slackbot({ json_file_store: 'slack-data-store' });
const bot = controller.spawn({ token });

const logMessage = async (bot, message, dlResult) => {
  if (logChannel) {
    const text = [];
    const msgLink = url.resolve(domain, `archives/${message.channel}/p${message.ts.replace(/\D/g, '')}`);
    let user;
    let channel;
    try {
      user = await getUserInfo(bot, message.user);
      user = '@' + user.user.name;
    }
    catch (e) {
      user = 'anonymous user';
    }
    try {
      channel = await getChannelInfo(bot, message.channel);
      channel = '#' + channel.channel.name;
    }
    catch (e) {
      channel = 'Private channel';
    }

    text.push(`${channel}, ${user}, ${msgLink}`);
    text.push('');
    if (dlResult.success.length > 0) {
      text.push('image saved:');
      dlResult.success
        .map(e => {
          const originalUrl = e.fromUrl;
          const relativePath = path.relative(archiveRoot, e.path);

          if (publicUrl) {
            const publicFileUrl = url.resolve(publicUrl, relativePath);
            return originalUrl + ' ' + publicFileUrl;
          }

          return originalUrl + ' ' + relativePath;
        })
        .forEach(e => text.push(e));

    }
    if (dlResult.fail.length > 0) {
      text.push('');
      text.push('error:');
      dlResult.fail.map(e => `${e.message}`).forEach(e => text.push(e));
    }

    bot.say({
      text: text.join('\n'),
      channel: logChannel
    });
  }
};

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
  const dlResult = {
    fail: [],
    success: []
  };

  res.forEach(e => {
    if (e.message) {
      // is error
      console.error(`[${message.channel}][${message.ts.replace(/\D/g, '')}]`, e.message);
      dlResult.fail.push(e);
    }
    else {
      console.log(`[${message.channel}][${message.ts.replace(/\D/g, '')}]`, 'image saved,', e.path.replace(/\\/g, '/'));
      dlResult.success.push(e);
    }
  });

  links.forEach(link => destMap.delete(link));

  logMessage(bot, message, dlResult).catch(err => { console.error(err); });
});

ping(controller, listenAll, [ logChannel ]);

controller.on('file_share', (bot, message) => {
  const link = message.file.url_private_download;
  destMap.set(link, `${message.channel}/p${message.ts.replace(/\D/g, '')}`);

  match.download(link)
    .then(res => {
      console.log(`[${message.channel}][${message.ts.replace(/\D/g, '')}]`, 'image saved,', res.path.replace(/\\/g, '/'));
      logMessage(bot, message, { success: [res], fail: [] });
    })
    .catch(err => {
      console.error(`[${message.channel}][${message.ts.replace(/\D/g, '')}]`, err.message);
      logMessage(bot, message, { success: [], fail: [err] });
    })
    .catch(err => {
      console.error(err);
    });
});

bot.startRTM();

const dieAfter = setTimeout(() => {
  throw new Error('Connect to slack timed out.');
}, connectionTimeout * 1000);

controller.on('rtm_open', () => {
  clearTimeout(dieAfter);
});

controller.on('rtm_close', (bot, err) => {
  throw new Error('Connection closed unexpectedly');
});
