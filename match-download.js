const fs = require('fs');
const path = require('path');
const util = require('util');
const makeDir = require('make-dir');
const download = require('download');

const writeFile = util.promisify(fs.writeFile);

class MatchDownload {
  constructor(options = {}) {
    this.dest = options.dest;
    this.rules = options.rules || [];
  }

  simpleProcessor(options) {
    if (options != undefined) {
      if (typeof options === 'function') {
        return async url => {
          let opt = await options(url);
          if (opt === false) {
            return false;
          }

          if (typeof opt === 'string') {
            url = opt;
            opt = undefined;
          }
          else if (typeof opt.url === 'string') {
            url = opt.url;
          }

          return await download(url, opt);
        };
      }
      else {
        return async url => {
          return await download(url, options);
        };
      }
    }

    return async url => {
      return await download(url);
    }
  }

  register(rule, processor) {
    if (!processor) {
      processor = this.simpleProcessor();
    }

    this.rules.push([rule, processor]);
  }

  async write(data, url) {
    const dest = await (typeof this.dest === 'function' ? this.dest(url) : this.dest);
    if (!dest) {
      return;
    }

    const { filename, writeOptions } = data;
    if (util.isBuffer(data.data)) {
      data = data.data;
    }

    if (!util.isBuffer(data) && !util.isString(data)) {
      throw new Error('No data to write, only accepts Buffer or String');
    }

    const writePath = path.join(dest, filename);
    await makeDir(path.dirname(writePath));
    await writeFile(writePath, data, writeOptions);

    return writePath;
  }

  async download(url) {
    let result = false;
    let hasMatchRule = false;
    let errors = [];

    for (const [rule, processor] of this.rules) {
      if (rule.test(url)) {
        hasMatchRule = true;
        try {
          result = await processor(url);
          const path = await this.write(result, url);
          if (path) {
            result.path = path;
          }
        }
        catch (e) {
          errors.push(e);
        }

        if (result !== false) {
          break;
        }
      }
    }

    if (!hasMatchRule) {
      throw new Error(`No matching rule for ${url}`);
    }

    if (!util.isBuffer(result) && !util.isString(result)) {
      const error = new Error(`Fail to download ${url}`);
      error.errors = errors;
      throw error;
    }

    if (this.dest && (typeof result.path !== 'string' || result.path === '')) {
      const error = new Error(`Download ${url} succeed, but fail to write file`);
      error.errors = errors;
      throw error;
    }

    result.errors = errors;
    result.fromUrl = url;
    return result;

  }
}

module.exports = MatchDownload;
