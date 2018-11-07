const path = require('path');
const botkit = require('botkit');
const buildMatch = require('./lib/build-match');
const listenPing = require('./lib/listen-ping');
const listenLink = require('./lib/listen-link');
const listenFileshare = require('./lib/listen-fileshare');

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

const controller = botkit.slackbot({ json_file_store: 'slack-data-store' });
const bot = controller.spawn({ token });
const destMap = new Map();
const match = buildMatch(url => path.join(archiveRoot, destMap.get(url) || ''));

const listenAll = [ 'ambient', 'direct_mention', 'mention', 'direct_message' ];
listenPing(controller, listenAll, [ logChannel ]);
listenLink(controller, listenAll, destMap, match, { logChannel, domain, archiveRoot, publicUrl });
listenFileshare(controller, destMap, match, { logChannel, domain, archiveRoot, publicUrl });

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
