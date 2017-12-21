const { simpleProcessor } = require('../match-download');

const slackShareFile = /^https?:\/\/files.slack.com\/files-pri\/.*$/;
const Authorization = 'Bearer ' + process.env.NSFWBOT_TOKEN;

module.exports = [
  [slackShareFile, simpleProcessor({ headers: { Authorization } })]
];
