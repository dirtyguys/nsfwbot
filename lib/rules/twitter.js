const download = require('download');
const { extractOgImage } = require('./common');

const twiiterStatus = /^https?:\/\/(?:www\.)?twitter\.com\/\w+\/status\/.*$/;
const twitterStatusProcessor = async url => {
  const data = await download(url);
  if (data.headers['content-type'] && /text\/html/.test(data.headers['content-type'])) {
    const ogUrl = extractOgImage(data).replace(/(?::\w+)?$/, ':orig');
    if (!ogUrl) {
      return false;
    }

    const result = await download(ogUrl);
    if (!result.filename) {
      return false;
    }

    result.filename = result.filename.replace(/\.(gif|png|jpe?g|bmp|webp|svg)[^.]*$/, '.$1');
    return result;
  }

  return false;
};

const twiiterDirect = /^https?:\/\/(?:pbs\.)?twimg\.com\/media\/.*$/;
const twitterDirectProcessor = async url => {
  const result = await download(url);
  if (!result.filename) {
    return false;
  }

  result.filename = result.filename.replace(/\.(gif|png|jpe?g|bmp|webp|svg)[^.]*$/, '.$1');
  return result;
};

module.exports = [
  [twiiterStatus, twitterStatusProcessor],
  [twiiterDirect, twitterDirectProcessor]
];
