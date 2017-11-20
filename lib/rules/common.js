const extractOgImage = data => {
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

  return url;
};

exports.extractOgImage = extractOgImage;
