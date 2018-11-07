const getUserInfo = require('./get-user-info');
const getChannelInfo = require('./get-channel-info');

module.exports = (controller, listenOn, allowedChannels) => {
  controller.hears(/^ping$/, listenOn, async (bot, message) => {
    const info = [ getUserInfo(bot, message.user), getChannelInfo(bot, message.channel) ];
    const [ { ok: userOk, user }, { ok: channelOk, channel } ] = await Promise.all(info);
    if (!userOk) {
      console.error(`fail to get user ${message.user} info.`);
    }
    if (!channelOk) {
      console.error(`fail to get channel ${message.channel} info.`);
    }

    const respondPing = (id) => {
      bot.api.chat.postMessage({ channel: id, text: 'pong' });
    };

    if (allowedChannels.some(id => message.channel === id)) {
      console.log(`@${user.name} pinged me in #${channel.name} channel.`);
      return respondPing(message.channel);
    } else if (channel.is_im) {
      console.log(`@${user.name} pinged me in direct message.`);
      return respondPing(channel.id);
    }

    console.log(`who's pinging? @${user.name} in #${channel.name} channel.`);
  });
};
