const entities = require('html-entities').Html5Entities;
const logMessage = require('./log-message');

module.exports = (controller, listenOn, destMap, match, env) => {
  controller.hears(/<[^>]+/, listenOn, async (bot, message) => {
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

    logMessage(bot, message, dlResult, env).catch(err => { console.error(err); });
  });
};
