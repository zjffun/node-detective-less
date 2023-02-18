var detective = require('../');
var assert = require('assert');

describe('detective-less', function() {
  function test(src, deps, opts) {
    assert.deepEqual(detective(src, opts), deps);
  }

  describe('throws', function() {
    it('does not throw for empty files', function() {
      assert.doesNotThrow(function() {
        detective('');
      });
    });

    it('throws if the given content is not a string', function() {
      assert.throws(function() {
        detective(function() {});
      });
    });

    it('throws if called with no arguments', function() {
      assert.throws(function() {
        detective();
      });
    });

    it('does not throw on broken syntax', function() {
      assert.doesNotThrow(function() {
        detective('@');
      });
    });
  });

  it('dangles the parsed AST', function() {
    detective('@import "_foo.less";');
    assert.ok(detective.ast);
  });

  describe('when there is a parse error', function() {
    it('supplies an empty object as the "parsed" ast', function() {
      detective('|');
      assert.deepEqual(detective.ast, {});
    });
  });

  describe('less', function() {
    it('returns the dependencies of the given .less file content', function() {
      test('@import "_foo.less";', ['_foo.less']);
      test('@import          "_foo.less";', ['_foo.less']);
      test('@import "_foo";', ['_foo']);
      test('body { color: blue; } @import "_foo.css";', ['_foo.css']);
      test('@import "bar";', ['bar']);
      test('@import "bar"; @import "foo";', ['bar', 'foo']);
      test('@import \'bar\';', ['bar']);
      test('@import \'bar.less\';', ['bar.less']);
      test('@import "_foo.less";\n@import "_bar.less";', ['_foo.less', '_bar.less']);
      test('@import "_foo.less";\n@import "_bar.less";\n@import "_baz";\n@import "_buttons";', ['_foo.less', '_bar.less', '_baz', '_buttons']);
      test('@import "_nested.less"; body { color: blue; a { text-decoration: underline; }}', ['_nested.less']);
    });

    it('handles comma-separated imports (#2)', function() {
      test('@import "_foo.less", "bar";', ['_foo.less', 'bar']);
    });

    it('allows imports with no semicolon', function() {
      test('@import "_foo.less"\n@import "_bar.less"', ['_foo.less', '_bar.less']);
    });

    it('returns the url dependencies when enable url', () => {
      test(
        '@font-face { font-family: "Trickster"; src: local("Trickster"), url("trickster-COLRv1.otf") format("opentype") tech(color-COLRv1), url("trickster-outline.otf") format("opentype"), url("trickster-outline.woff") format("woff"); }',
        [
          "trickster-COLRv1.otf",
          "trickster-outline.otf",
          "trickster-outline.woff"
        ],
        { url: true}
      );

      test(
        'body { div {background: no-repeat center/80% url("foo.png"); }}',
        ["foo.png",],
        { url: true}
      );

      test(
        'body { div {background: no-repeat center/80% url(foo.png); }}',
        ["foo.png",],
        { url: true}
      );
    });
  });
});
