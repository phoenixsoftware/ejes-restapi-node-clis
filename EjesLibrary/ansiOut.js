#!/usr/bin/env node
//  ansiOut.js - Zowe and EJES CLI ANSI output console switch control glue routines.

/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright (c) 2020-2021 Phoenix Software International, Inc.
*
*/

require('./ansiCodes')  // Load as global constants.
require('./debugCodes')
var errStrip = false
var outStrip = false
var assignedConsole = console  // Pure node.js uses the node console, but another can be substituted.
var params                     // Zowe object with console support and all data, necessary for compliancy and using --response-format-json.
var setObjLocalCopy
var writeJsonResponse

function setErrStrip (newValue) {
  return errStrip = newValue
}

function setOutStrip (newValue) {
  return outStrip = newValue
}

function getErrStrip () {
  return errStrip
}

function getOutStrip () {
  return outStrip
}

function writeJsonResponse() {
  if ( isResponseFormatJson() )
    writeJsonResponse.call(params.response)
}

function setZoweParams(IHandlerParameters) {  // Caller uses this to handle --response-format-json output as well as regular output.
  params = IHandlerParameters
  assignedConsole = params.response.console
  setObjLocalCopy = params.response.data.setObj
  writeJsonResponse = params.response.writeJsonResponse
  params.response.writeJsonResponse = () => {}
}

function setLocalConsole() {
  if ( ! isPureNode() && assignedConsole != console ) {
    assignedConsole = console
  }
}

function setZoweConsole() {
  if ( ! isPureNode() && assignedConsole == console && params ) {
    assignedConsole = params.response.console
  }
}

function isPureNode() { // For external callers to prevent unneeded work before calling setObj or others.
  return params == undefined
}

function isResponseFormatJson() {
  return params && params.response.responseFormat === "json"
}

function setObj (o) {
  var util = require('util')
  if ( params ) {
    setObjLocalCopy(o, true)
  }
}

function setMessage(text) {  // No support for the "values" advertised in doc as no explanation how that works.
  if ( params ) {
    params.response.data.setMessage(text)
  }
}

function setExitCode(number) {  // No support for the "values" advertised in doc as no explanation how that works.
  process.exitCode = number
  if ( params ) {
    params.response.data.setExitCode(number)
  }
}

function stripCodes(line) {
  return line.replace(/\x1b\[(\d+[ABCDJ]|[^m]+m|[^H]+H)/g, '') // Replace ANSI cursor up/down/right/left,erase line, color sequences, and erase screen.
}

function outColorControl(line) {
  return typeof line == 'string' && outStrip  ? stripCodes(line) : line 
}

function errColorControl(line) {
  return typeof line == 'string' && errStrip  ? stripCodes(line) : line
}

function ansiLogOut(line = '') {
    assignedConsole.log (outColorControl(line))
  }
  
function ansiErrOut(line = '') {
    assignedConsole.error (errColorControl(line))
  }

module.exports = {
  outColorControl,
  errColorControl,
  ansiErrOut,
  ansiLogOut,
  setErrStrip,
  getErrStrip,
  setOutStrip,
  getOutStrip,
  stripCodes,
  isPureNode,
  setLocalConsole,
  setZoweConsole,
  setZoweParams,
  setOutStrip,
  setMessage,
  setExitCode,
  setObj,
  writeJsonResponse,
  isResponseFormatJson
}