'use strict';
const assert = require('power-assert');
const {describe, it} = require('mocha');
const collapser = require('../../lib/collapsers/html');

describe('html collapser', () => {
  it('should collapse a script tag', async () => {
    const collapsed = await collapser(
      Buffer.from(
        '<html><body><script>alert("foo" + "bar");</script></body></html>'
      ),
      {
        fetch() {
          assert(false, 'unexpected resource resolution');
        }
      }
    );

    assert(typeof collapsed === 'string');
    assert(
      collapsed ===
        '<html><body><script>alert("foobar");</script></body></html>'
    );
  });

  it('should collapse an image', async () => {
    const collapsed = await collapser(
      Buffer.from(
        '<html><body><img src="https://example.org/foobar.png"></body></html>'
      ),
      {
        async fetch(url) {
          assert(url === 'https://example.org/foobar.png');
          return {
            contentType: 'image/png',
            body: Buffer.from('')
          };
        },
        resourceLocation: 'https://example.com'
      }
    );

    assert(typeof collapsed === 'string');
    assert(
      collapsed ===
        '<html><body><img src="data:image/png;base64,"></body></html>'
    );
  });

  it('should collapse an external HTML page', async () => {
    const collapsed = await collapser.external({
      async fetch(url) {
        switch (url) {
          case 'https://terinstock.com':
            return {
              body: Buffer.from(
                '<!doctype html><html><body><h1>Hi.</h1><img src="avatar.jpeg"></body></html>'
              )
            };

          case 'https://terinstock.com/avatar.jpeg':
            return {
              contentType: 'image/jpeg',
              body: Buffer.from('')
            };

          default:
            throw new assert.AssertionError('unknown resource resolution');
        }
      },
      resourceLocation: 'https://terinstock.com'
    });

    assert(typeof collapsed === 'string');
    assert(
      collapsed ===
        '<!doctype html><html><body><h1>Hi.</h1><img src="data:image/jpeg;base64,"></body></html>'
    );
  });
});
