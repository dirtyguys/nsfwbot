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
  let id = /(?:&|\?)illust_id=(\w+)/.exec(url);
  if (!id) {
    return false;
  } else {
    id = id[1];
  }

  let page = /(?:&|\?)page=(\d+)/.exec(url);
  if (!page) {
    page = 0;
  } else {
    page = +page[1];
  }

  const fetchUrl = `https://www.pixiv.net/member_illust.php?illust_id=${id}&mode=medium`;
  const matchExpr = new RegExp(`img\\\\?/((?:\\w+\\\\?/)+)${id}_(?:p0|ugoira)`);
  const data = await download(fetchUrl);
  const imgToken = matchExpr.exec(data.toString());
  if (!imgToken || !imgToken[1]) {
    return false;
  }

  if (imgToken[0].indexOf('ugoira') >= 0) {
    return await pixivUgoiraProcessor(url);
  }

  const imgUrl = [
    `https://i.pximg.net/img-original/img/${imgToken[1]}${id}_p${page}.png`,
    `https://i.pximg.net/img-original/img/${imgToken[1]}${id}_p${page}.jpg`,
    `https://i.pximg.net/img-original/img/${imgToken[1]}${id}_p0.png`,
    `https://i.pximg.net/img-original/img/${imgToken[1]}${id}_p0.jpg`
  ];

  for (const url of imgUrl) {
    try {
      return await download(url, { headers: { Referer: 'https://pixiv.net' } });
    } catch (e) {}
  }

  return false;
};

module.exports = [
  [pixivIllust, pixivIllustProcessor]
];
