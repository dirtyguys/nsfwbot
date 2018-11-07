const url = require('url');
const path = require('path');

const getUserInfo = require('./get-user-info');
const getChannelInfo = require('./get-channel-info');

module.exports = async (bot, message, dlResult, { logChannel, domain, archiveRoot, publicUrl }) => {
  if (logChannel) {
    const text = [];
    const msgLink = url.resolve(domain, `archives/${message.channel}/p${message.ts.replace(/\D/g, '')}`);
    const userInfoRes = getUserInfo(bot, message.user).catch(err => ({ ok: false, err }));
    const channelInfoRes = getChannelInfo(bot, message.channel).catch(err => ({ ok: false, err }));
    const [{ ok: userOk, user }, { ok: channelOk, channel }] = await Promise.all([ userInfoRes, channelInfoRes ]);
    let userName = 'unknown user';
    let channelName = 'unknown channel';

    if (userOk && channelOk) {
      if (channel.is_im || channel.is_private || channel.is_mpim) {
        logChannel = channel.id;
        userName = `@${user.name}`;
        channelName = channel.is_im ? 'direct message' : 'private channel';
      } else {
        userName = `@${user.name}`;
        channelName = `#${channel.name}`;
      }
    }

    text.push(`${channelName}, ${userName}, ${msgLink}`);
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
