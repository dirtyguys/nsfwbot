const MatchDownload = require('./match-download');
const rules = require('./rules');

const buildMatch = dest => {
  const match = new MatchDownload({ dest })
  rules.forEach(([rule, proceesor]) => match.register(rule, proceesor));

  return match;
};

module.exports = buildMatch;
