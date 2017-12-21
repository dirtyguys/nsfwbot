const rules = [
  ...require('./imgur'),
  ...require('./twitter'),
  ...require('./pixiv'),
  ...require('./slack'),
  ...require('./general')
];

module.exports = rules;
