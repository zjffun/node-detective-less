var Walker = require('node-source-walk');
var less = require('gonzales-pe');
var debug = require('debug')('detective-less');

/**
 * Extract the @import statements from a given less file's content
 *
 * @param  {String} fileContent
 * @param  {Object} options
 * @param  {Boolean} options.url - detect any url() references to images, fonts, etc.
 * @return {String[]}
 */
module.exports = function detective(fileContent, options) {
  if (typeof fileContent === 'undefined') { throw new Error('content not given'); }
  if (typeof fileContent !== 'string') { throw new Error('content is not a string'); }

  const isEnabledUrl = options && options.url;

  var dependencies = [];
  var ast;

  try {
    debug('content: ' + fileContent);
    ast = less.parse(fileContent, { syntax: 'less' });
  } catch (e) {
    debug('parse error: ', e.message);
    ast = {};
  }

  detective.ast = ast;

  var walker = new Walker();

  walker.walk(ast, function(node) {
    if (isImportStatement(node)) {
      dependencies = dependencies.concat(extractDependencies(node));
      return;
    }

    if (isEnabledUrl && isUrlNode(node)) {
      dependencies = dependencies.concat(extractUriDependencies(node));
      return;
    }
  });

  return dependencies;
};

function isImportStatement(node) {
  if (!node || node.type !== 'atrule') { return false; }
  if (!node.content.length || node.content[0].type !== 'atkeyword') { return false; }

  var atKeyword = node.content[0];

  if (!atKeyword.content.length) { return false; }

  var importKeyword = atKeyword.content[0];

  if (importKeyword.type !== 'ident' || importKeyword.content !== 'import') { return false; }

  return true;
}

function extractDependencies(importStatementNode) {
  return importStatementNode.content
  .filter(function(innerNode) {
    return innerNode.type === 'string' || innerNode.type === 'ident';
  })
  .map(function(identifierNode) {
    return identifierNode.content.replace(/["']/g, '');
  });
}

function isUrlNode(node) {
  return node.type === 'uri';
}

function extractUriDependencies(importStatementNode) {
  return importStatementNode.content
    .filter((innerNode) => innerNode.type === 'string' || innerNode.type === 'ident' || innerNode.type === 'raw')
    .map((identifierNode) => identifierNode.content.replace(/["']/g, ''));
}
