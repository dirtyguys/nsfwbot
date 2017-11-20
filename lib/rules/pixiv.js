const download = require('download');

const pixivIllust = /https?:\/\/(?:www\.)?pixiv\.net\/member_illust.php\?(?:[^&]*&)*illust_id=\w+/;

const pixivUgoiraProcessor = async url => {
  const data = await download('http://ugoira.dataprocessingclub.org/convert', { query: { url, format: 'webm' } });
  try {
    return await download(JSON.parse(data.toString()).url);
  }
  catch (e) {}

  return false;
};

const pixivIllustProcessor = async url => {
  const id = /illust_id=(\w+)/.exec(url)[1];
  if (!id) {
    return false;
  }

  const data = await download(url);
  let imgToken = new RegExp(`img\\\\?/((?:\\w+\\\\?/)+)${id}_(?:p0|ugoira)`).exec(data.toString());
  if (!imgToken || !imgToken[1]) {
    return false;
  }
  if (imgToken[0].indexOf('ugoira') >= 0) {
    return await pixivUgoiraProcessor(url);
  }

  const imgUrl = `https://i.pximg.net/img-original/img/${imgToken[1]}${id}_p0.`;
  let result;
  try {
    return await download(imgUrl + 'jpg', { headers: { Referer: 'https://pixiv.net' } });
  }
  catch (e) {}

  try {
    return await download(imgUrl + 'png', { headers: { Referer: 'https://pixiv.net' } });
  }
  catch (e) {}

  return false;
};

module.exports = [
  [pixivIllust, pixivIllustProcessor]
];
