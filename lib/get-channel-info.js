const util = require('util');

const getChannelInfo = async (bot, id) => {
  if (!getChannelInfo.channels[id]) {
    const channel = await util.promisify(bot.api.conversations.info)({ channel: id });
    getChannelInfo.channels[id] = channel;
    return channel;
  }

  return getChannelInfo.channels[id];
};
getChannelInfo.channels = {};

module.exports = getChannelInfo;
