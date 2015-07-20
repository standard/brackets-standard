var exec = require('child_process').exec
var path = require('path')
var Promise = require('bluebird')

var getStandard = (function () {
  var standard = null
  var stdPromise = new Promise(function (resolve, reject) {
    exec('npm root -g', function (error, stdout, stderr) {
      if (error) {
        reject(error)
      } else {
        try {
          resolve(require(path.join(stdout.trim(), 'standard')))
        } catch (e) {
          reject(e)
        }
      }
    })
  }).then(function (s) {
    standard = s
    return s
  })

  return function () {
    if (standard) {
      return Promise.resolve(standard)
    } else {
      return stdPromise
    }
  }
})()

function lintText (textContent, cb) {
  getStandard()
  .then(function (standard) {
    standard.lintText(textContent, {}, cb)
  })
  .catch(function (e) {
    cb(e.message)
  })
}

function init (domainManager) {
  var DOMAIN_NAME = 'brackets-standard'
  if (!domainManager.hasDomain(DOMAIN_NAME)) {
    domainManager.registerDomain(DOMAIN_NAME, {major: 0, minor: 1})
  }

  domainManager.registerCommand(DOMAIN_NAME, 'lintText', lintText, true)
}

exports.init = init
