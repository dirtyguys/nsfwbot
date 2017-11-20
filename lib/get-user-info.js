const util = require('util');

const getUserInfo = async (bot, id) => {
  if (!getUserInfo.users[id]) {
    const user = await util.promisify(bot.api.users.info)({ user: id });
    getUserInfo.users[id] = user;
    return user;
  }

  return getUserInfo.users[id];
};
getUserInfo.users = {};

module.exports = getUserInfo;
