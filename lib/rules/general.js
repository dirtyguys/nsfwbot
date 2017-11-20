const download = require('download');
const { extractOgImage } = require('./common');

const generalProcessor = async url => {
  let data = await download(url);

  if (data.headers['content-type']) {
    let type = data.headers['content-type'];

    if (/text\/html/.test(type)) {
      const ogUrl = extractOgImage(data);
      if (!ogUrl) {
        return false;
      }

      data = await download(ogUrl, { headers: { Referer: url } });
      if (!data || !data.headers || !data.headers['content-type']) {
        return false;
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

module.exports = [
  [ /.*/, generalProcessor]
];
