const fs = require('fs');
const download = require('download');
const MatchDownload = require('./match-download');

const map = new Map();

const match = new MatchDownload({ dest: url => map.get(url) });

const imgurDirect = /^https?:\/\/(?:i\.)?imgur\.com\/[A-Za-z0-9]*\.(?:jpe?g|png)(?:(?:\?|#).*)?$/;
const imgurGenernal = /^https?:\/\/(?:i\.)?imgur\.com\/[A-Za-z0-9]*\/?(?:(?:\?|#).*)?$/;
const rewriteImgur = url => url.replace(/([A-Za-z0-9]*)\/?((?:\?|#).*)?$/, '$1.jpg$2');

const getFromOgImage = async data => {
  const ogImage = /<\s*meta[^>]+property='?"?og:image'?"?[^>]+>/.exec(data.toString());
  if (!ogImage) {
    return false;
  }

  const content = /content=(?:'((?:[^']|\\')+)'|"((?:[^"]|\\")+)"|(\S+)(?:>|\s))/.exec(ogImage[0]);
  if (!content) {
    return false;
  }

  const url = content[1] || content[2] || content[3];
  if (!url) {
    return false;
  }

  return await download(url);
};

const twiiterStatus = /^https?:\/\/(?:www\.)?twitter\.com\/\w+\/status\/.*$/;
const twitterStatusProcessor = async url => {
  const data = await download(url);
  if (data.headers['content-type'] && /text\/html/.test(data.headers['content-type'])) {
    const result = await getFromOgImage(data);
    if (result.filename) {
      result.filename = result.filename.replace(/\.(gif|png|jpe?g|bmp|webp|svg)[^.]*$/, '.$1');
      return result;
    }
  }

  return false;
};

const twiiterDirect = /^https?:\/\/(?:pbs\.)?twimg\.com\/media\/.*$/;
const twitterDirectProcessor = async url => {
  const result = await download(url);
  if (result.filename) {
    result.filename = result.filename.replace(/\.(gif|png|jpe?g|bmp|webp|svg)[^.]*$/, '.$1');
    return result;
  }
};

const pixivIllust = /https?:\/\/(?:www\.)?pixiv\.net\/member_illust.php\?(?:[^&]*&)*illust_id=\w+/;
const pixivUgoiraProcessor = async url => {
  const data = await download('http://ugoira.dataprocessingclub.org/convert', { query: { url, format: 'webm' } });
  let result;
  try {
    result = await download(JSON.parse(data.toString()).url);
  }
  catch (e) {
    return false;
  }

  return result;
};
const pixivIllustProcessor = async url => {
  const id = /illust_id=(\w+)/.exec(url)[1];

  if (!id) {
    return false;
  }
  let data = await download(url);

  let imgToken = new RegExp(`img\\\\?/((?:\\w+\\\\?/)+)${id}_(?:p0|ugoira)`).exec(data.toString());
  if (!imgToken || !imgToken[1]) {
    return false;
  }
  if (imgToken[0].indexOf('ugoira') >= 0) {
    return await pixivUgoiraProcessor(url);
  }

  let imgUrl = `https://i.pximg.net/img-original/img/${imgToken[1]}${id}_p0.jpg`;
  return await download(imgUrl, { headers: { Referer: 'https://pixiv.net' } });
}

const generalProcessor = async url => {
  let data = await download(url);

  if (data.headers['content-type']) {
    let type = data.headers['content-type'];

    if (/text\/html/.test(type)) {
      data = await getFromOgImage(data);
      if (!data || !data.headers || !data.headers['content-type']) {
        return data;
      }
      type = data.headers['content-type'];
    }

    if (/image\/(?:gif|png|jpeg|bmp|webp|svg\+xml)/.test(type)) {
      let filename = data.filename;
      if (!/\.(?:gif|png|jpe?g|bmp|webp|svg)$/.test(data.filename)) {
        let ext = /image\/(gif|png|jpeg|bmp|webp|svg\+xml)/.exec(type)[1];
        if (ext === 'jpeg') {
          ext = 'jpg';
        }
        else if (ext === 'svg+xml') {
          ext = 'svg';
        }

        data.filename += '.' + ext;
      }

      return data;
    }
  }

  return false;
};

match.register(imgurDirect);
match.register(imgurGenernal, match.simpleProcessor(rewriteImgur));
match.register(twiiterDirect, twitterDirectProcessor);
match.register(twiiterStatus, twitterStatusProcessor);
match.register(pixivIllust, pixivIllustProcessor);
match.register(/.*/, generalProcessor);

module.exports = { match, map };
