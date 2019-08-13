var cpExec = require('child_process').exec
var path = require('path')
var fs = require('fs')

var fileExists = function (p) {
  return new Promise(function (resolve, reject) {
    fs.exists(p, function (e) {
      resolve(e)
    })
  })
}

function exec (cmd) {
  return new Promise(function (resolve, reject) {
    cpExec(cmd, function (err, stdout) {
      if (err) {
        reject(err)
      } else {
        resolve(stdout)
      }
    })
  })
}

var getStandard = (function () {
  var standardVersions = {}
  var projectStandardVersions = {}

  function projectStandardExists (projectRoot) {
    if (projectStandardVersions[projectRoot]) {
      return Promise.resolve(true)
    } else {
      return fileExists(path.join(projectRoot, 'node_modules', 'standard', 'package.json'))
    }
  }

  function getProjectStandardVersion (projectRoot) {
    return require(path.join(projectRoot, 'node_modules', 'standard', 'package.json')).version
  }

  var getGlobalStandard = (function () {
    var globalStandardVersion = null

    return function () {
      var p

      if (!globalStandardVersion) {
        // Yes, it's a hack. Please send a PR if you have a better way.
        p = exec('npm root -g')
          .then(function (stdout) {
            var globalStandardPath = path.join(stdout.trim(), 'standard')
            globalStandardVersion = require(path.join(globalStandardPath, 'package.json')).version

            if (!standardVersions[globalStandardVersion]) {
              standardVersions[globalStandardVersion] = require(globalStandardPath)
            }

            return standardVersions[globalStandardVersion]
          })
      } else {
        p = Promise.resolve(standardVersions[globalStandardVersion])
      }
      return p.then(function (std) {
        return {
          engine: std,
          version: globalStandardVersion
        }
      })
    }
  })()

  function getProjectStandard (projectRoot) {
    return projectStandardExists(projectRoot)
    .then(function (projectHasStandard) {
      if (!projectHasStandard) {
        return getGlobalStandard()
      }

      if (!projectStandardVersions[projectRoot]) {
        projectStandardVersions[projectRoot] = getProjectStandardVersion(projectRoot)
      }

      var projectStandardVersion = projectStandardVersions[projectRoot]

      if (!standardVersions[projectStandardVersion]) {
        standardVersions[projectStandardVersion] = require(path.join(projectRoot, 'node_modules', 'standard'))
      }

      return {
        engine: standardVersions[projectStandardVersion],
        version: projectStandardVersion
      }
    })
  }

  return function (projectRoot) {
    if (projectRoot) {
      return getProjectStandard(projectRoot)
    } else {
      return getGlobalStandard()
    }
  }
})()

function lintText (args, cb) {
  var projectRoot = args[0]
  var textContent = args[1]

  getStandard(projectRoot)
  .then(function (standard) {
    console.log(standard)
    standard.engine.lintText(textContent, {}, function (error, result) {
      if (error) {
        cb(error)
      } else {
        result.version = standard.version
        cb(null, result)
      }

    })
  })
  .catch(function (e) {
    console.log(e)
    cb(e)
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
