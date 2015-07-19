var standard = require('standard')

function lintText (textContent, cb) {
  standard.lintText(textContent, {}, cb)
}

function init (domainManager) {
  var DOMAIN_NAME = 'standard-runner'
  if (!domainManager.hasDomain(DOMAIN_NAME)) {
    domainManager.registerDomain(DOMAIN_NAME, {major: 0, minor: 1})
  }

  domainManager.registerCommand(DOMAIN_NAME, 'lintText', lintText, true)
}

exports.init = init
