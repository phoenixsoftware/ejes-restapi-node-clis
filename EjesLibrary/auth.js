#!/usr/bin/env node
//  auth.js - EJES CLI Host Authorization Routines.

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

module.exports = {
  access,
  getDefaultProfile,
  getPostInfo,
  getZoweProfile,
  setUpProfileDirectories,
}

require('./ansiCodes')  // Load as global constants.
require('./debugCodes')

const util = require('util')
const { ansiErrOut } = require('./ansiOut')
const { spawnSync } = require('child_process')
const os = require('os')
const fs = require('fs')
const { randomFillSync } = require('crypto')

// Globals

debug = d_NoDebugging
cookie = ''
ejes = { basePath: '/EjesWeb/api', rejectUnauthorized: true }

options = {
  request: 0,
  hostname: '',
  port: 80, 
  method: 'POST', 
  rejectUnauthorized: true,
  path: ejes.basePath + '/init', 
  headers: { Authorization: 'Basic base64(uid:password)' },
  post: { 
    initParms: { columns: 80, rows: 24, userAgent: '' }, 
    execParms: { enumValue: 0, command: '' } 
  }
};

forceNoColor = false
noColor = false
pathHome = os.homedir() + '/.ejes/'
pathProfile = pathHome + 'profile/'
pathWork = pathHome + 'work/'

function getDefaultProfile() {
  var defaultProfile = 'ejes'
  try { // Read in default for matching.
    defaultProfile = fs.readFileSync(os.homedir() + '/.ejes/work/default')
  }
  catch (e) {
    if ( e.code != 'ENOENT' ) {
      ansiErrOut(ERROR + 'Warning: Unable to read a default profile name from file: ' + ITEM + os.homedir() + '/.ejes/work/default' + '.' + RESET)
      ansiErrOut(e)
    }
    ansiErrOut(INFO + 'Use ' + DEFAULT + 'ejes profiles' + INFO + ' to set a default profile.  Will try to use profile ' + ITEM + 'ejes' + INFO + ' instead.' + RESET)
  }
  return defaultProfile
}

/*  Setup Profile Directories for EJES.

      Call prior to calling session().
      idFunction: A function when executed will display the EJES version banner.
      Return: idFunction, which may be changed to undefined if used.
      Will exit with 34 if unable to create a needed directory.
*/

function setUpProfileDirectories(idFunction) {
  if ( ! fs.existsSync(os.homedir() + '/.ejes/profile/')) { // Local profile directory required.  Create silently.
    try {
      idFunction && idFunction()
      idFunction = undefined
      if ( ! fs.existsSync(os.homedir() + '/.ejes') ) {
        fs.mkdirSync(os.homedir() + '/.ejes')
        ansiErrOut(INFO + 'Application home directory was created:    ' + ITEM + os.homedir() + '/.ejes' + RESET) 
      }
    } 
    catch(e) {
      ansiErrOut(ERROR + 'Unable to create needed application home directory: ' + ITEM + os.homedir() + '/.ejes' + RESET)
      ansiErrOut(ERROR + 'Permissions issue?' + RESET)
      ansiErrOut(e)
      process.exit(34)
    }
    try {
      if ( ! fs.existsSync(os.homedir() + '/.ejes/profile') ) {
        fs.mkdirSync(os.homedir() + '/.ejes/profile')
        ansiErrOut(INFO + 'Application profile directory was created: ' + ITEM + os.homedir() + '/.ejes/profile' + RESET) 
      }
    } 
    catch(e) {
      ansiErrOut(ERROR + 'Unable to create needed profile directory: ' + ITEM + os.homedir() + '/.ejes/profile' + RESET)
      ansiErrOut(ERROR + 'Permissions issue?' + RESET)
      ansiErrOut(e)
      process.exit(34)
    }
    try {
      if ( ! fs.existsSync(os.homedir() + '/.ejes/work') ) {
        fs.mkdirSync(os.homedir() + '/.ejes/work')
        ansiErrOut(INFO + 'Application working directory was created: ' + ITEM + os.homedir() + '/.ejes/work' + RESET) 
      }
    } 
    catch(e) {
      ansiErrOut(ERROR + 'Unable to create needed working directory: ' + ITEM + os.homedir() + '/.ejes/work' + RESET)
      ansiErrOut(ERROR + 'Permissions issue?' + RESET)
      ansiErrOut(e)
      process.exit(34)
    }
  }
  return idFunction
}

/* Convert Zowe Arguments into the ejes authorization object */

function processZoweArguments(zArgs) {
    ejes.zowe = true
    debug & d_ProfileDump && ansiErrOut('Zowe: ' + util.inspect(zArgs, true, 10, true))
    let text = zArgs.user + ':' + zArgs.password
    ejes.auth = (Buffer.alloc(text.length, text)).toString('base64')
    ejes.loggedOnUser = zArgs.user
    ejes.hostname = /*zArgs.protocol + '://' +*/ zArgs.host
    ejes.port = zArgs.port
    ejes.basePath = zArgs.basePath
    ejes.colorScheme = zArgs.colorScheme
    options.path = ejes.basePath + '/init'
    ejes.noColor =  zArgs.noColor;
    if ( ! forceNoColor )
      noColor = (zArgs.noColor && (zArgs.noColor.toLowerCase() != 'off')) || noColor // Not allowed to override NO_COLOR, FORCE_COLOR=0, or OMVS.
    ejes.rejectUnauthorized = zArgs.rejectUnauthorized
    delete zArgs.user
    delete zArgs.password
    delete zArgs.pass
    delete zArgs.pw
}

/* Get Zowe Profile

      Try to load the Zowe profile in the ejes object.
      Returns: True on success.
               False on failure if complain is false.
      Errors:
        If complain is true, error info is output and the program exits.
*/
function getZoweProfile(complain = true) {
  const { JSONparse } = require('./common')  // Only works if this assigned in-function.  Strange.
  try {
    const zoweRaw = spawnSync('zowe', 'ejes q st --debug 4096'.split(' '), {
      cwd: process.cwd(),
      env: process.env,
      shell: true,
    })
    if ( zoweRaw.status != 123 ) {
      ['zowe.bat', 'zowe.cmd', 'zowe.exe', 'zowe.sh'].forEach((file) => { fs.existsSync(file) && ansiErrOut(HILITE + 'WARNING: ' + ITEM + file + HILITE + ' should not exist in current working directory: ' + ITEM + process.cwd() + RESET) })
      return false
    }
    let zoweA = JSONparse(zoweRaw.stdout.toString(), 'zoweRaw')
    processZoweArguments(zoweA)
    return true
  }
  catch(e) {
    if ( complain ) {
      ansiErrOut(ERROR + 'Unable to read Zowe profile information.  Set "useZowProfile" to false in ejes default profile.' + RESET)
      ansiErrOut(e.message || e)
      process.exit(59)
    }
  }
}

/* Get Post Information 

    Creates the post box if not there.
    Fetches it for use.

*/
postBox = ''
function getPostInfo() {
  let path = os.homedir() + '/.ejes/work/post_' + os.userInfo().username.toLowerCase() + '_box'
  if ( fs.existsSync(path) )
    postBox = fs.readFileSync(path).toString()
  else
    fs.writeFileSync(path, postBox = randomFillSync(Buffer.alloc(48), 0, 48).toString('base64'))
  fs.chmodSync(path, 0o400)  // Set read-only and overrule any user change
}

/* Process Host Access Information

  Caller must do the following before calling:
    Call setUpProfileDirectories()
    First pass interpretting of the command line.

  Caller must do the following upon return:
    Second pass interpretting of command line (for profile overrides).

*/
function access(id, params, profileName) {
  const { readProfile } = require('./common')
  var defaultProfile
  ejes.authEdit = true;
  if ( params && params.arguments ) {
    if ( d_Accounting & debug ) {
      ansiLogOut(JSON.stringify(params.arguments, null, 2))
      process.exit(123)
    }
    processZoweArguments(params.arguments, debug)
    ejes.zowe = true
    debug & d_ProfileDump && ansiErrOut('ejes: ' + util.inspect(ejes, true, 10, true))
  }
  else {
    try {
      getPostInfo()
      defaultProfile = profileName || getDefaultProfile()
      debug & d_ProfileDump && ansiErrOut('Using ejes profile ' + defaultProfile)
      readProfile(defaultProfile)  // Updates ejes object.
    }
    catch (e) {
      id && id()
      console.error(e)
      ansiErrOut('')
      ansiErrOut(ERROR + 'Unable to read profile, code: ' + ITEM + e.code + RESET + ', errno:' + ITEM + e.errno + RESET)
      ansiErrOut(ERROR + 'Message: ' + ITEM + e.message + RESET)
      ansiErrOut(INFO + 'Run ' + HILITE + 'node ejes profile' + INFO + '.  Credentials and server information are required to proceed.' + RESET)
      process.exit(43)
    }
    ejes.pureNode = true
    if ( ejes.useZoweProfile == 'yes') 
      getZoweProfile(debug)
    if ( ! forceNoColor)
      noColor = ejes.noColor != 'off' // Not allowed to override NO_COLOR, FORCE_COLOR=0, or OMVS.
    debug & d_ProfileDump && ansiErrOut('ejes: ' + util.inspect(ejes, true, 10, true))
  }
  return defaultProfile || profileName
}
