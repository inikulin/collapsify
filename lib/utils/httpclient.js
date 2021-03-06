'use strict';
const got = require('got');
const PQueue = require('p-queue');
const logger = require('bole')('collapsify:http');
const VERSION = require('../version');

module.exports = function(defaultHeaders) {
  const cache = new Map();

  const client = got.extend({
    headers: {
      'user-agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:60.0) Gecko/20100101 Firefox/60.0 Collapsify/${VERSION} node/${
        process.version
      }`,
      ...defaultHeaders
    },
    encoding: null,
    timeout: 2000,
    retries: 5
  });

  const queue = new PQueue({
    concurrency: 8
  });

  async function fetch(url) {
    const res = await queue.add(() => {
      logger.debug('Fetching %s.', url);
      return client.get(url, {cache});
    });

    if (res.fromCache) {
      logger.debug('Retrieved %s from cache.', url);
    }

    return {
      contentType: res.headers['content-type'],
      body: res.body
    };
  }

  return fetch;
};
