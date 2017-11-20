const { simpleProcessor } = require('../match-download');

const imgurDirect = /^https?:\/\/(?:i\.)?imgur\.com\/[A-Za-z0-9]*\.(?:jpe?g|png)(?:(?:\?|#).*)?$/;
const imgurGenernal = /^https?:\/\/(?:i\.)?imgur\.com\/[A-Za-z0-9]*\/?(?:(?:\?|#).*)?$/;
const rewriteImgur = url => url.replace(/([A-Za-z0-9]*)\/?((?:\?|#).*)?$/, '$1.jpg$2');

module.exports = [
  [imgurDirect],
  [imgurGenernal, simpleProcessor(rewriteImgur)]
];
