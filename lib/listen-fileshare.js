module.exports = (controller, destMap, match, env) => {
  controller.on('file_share', (bot, message) => {
    const link = message.file.url_private_download;
    destMap.set(link, `${message.channel}/p${message.ts.replace(/\D/g, '')}`);

    match.download(link)
      .then(res => {
        console.log(`[${message.channel}][${message.ts.replace(/\D/g, '')}]`, 'image saved,', res.path.replace(/\\/g, '/'));
        logMessage(bot, message, { success: [ res ], fail: [] }, env);
      })
      .catch(err => {
        console.error(`[${message.channel}][${message.ts.replace(/\D/g, '')}]`, err.message);
        logMessage(bot, message, { success: [], fail: [ err ] }, env);
      })
      .catch(err => {
        console.error(err);
      });
  });
};
