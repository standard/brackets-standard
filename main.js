/*global define, $, brackets */

define(function (require, exports, module) {
  'use strict'

  var CodeInspection = brackets.getModule('language/CodeInspection')
  var LanguageManager = brackets.getModule('language/LanguageManager')
  var NodeDomain = brackets.getModule('utils/NodeDomain')
  var ExtensionUtils = brackets.getModule('utils/ExtensionUtils')

  var JS_LANGUAGE = LanguageManager.getLanguageForExtension('js')

  var standardDomain = new NodeDomain('brackets-standard', ExtensionUtils.getModulePath(module, 'domain'))

  function scanFileAsync (textContent) {
    var d = $.Deferred()
    standardDomain.exec('lintText', textContent)
      .done(function (result) {
        d.resolve({
          errors: result.results[0].messages.map(function (msg) {
            return {
              pos: {
                line: msg.line - 1,
                ch: msg.column
              },
              message: msg.message,
              type: msg.severity === 1 ? CodeInspection.Type.WARNING
                                       : CodeInspection.Type.ERROR
            }
          })})
      })
      .fail(function (error) {
        d.reject(error)
      })
    return d.promise()
  }

  CodeInspection.register(JS_LANGUAGE.getId(), {
    name: 'standard',
    scanFileAsync: scanFileAsync
  })

})
