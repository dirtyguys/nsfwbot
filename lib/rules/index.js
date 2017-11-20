const rules = [
  ...require('./imgur'),
  ...require('./twitter'),
  ...require('./pixiv'),
  ...require('./general')
];

module.exports = rules;
