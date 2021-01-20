#!/usr/bin/env node
//  profiles.js - Mirrors Zowe Profiles functionality for use by the EJES CLI
//                when used as pure node outside of Zowe.

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

var ejesVersion = 'EJES Profiles V0.5.6, a CLI component of (E)JES.'
var hideUserId = false
const { readProfile, writeProfileFile } = require('./common')
const { ansiErrOut, ansiLogOut, setErrStrip } = require('./ansiOut')
const readline = require('readline');
const fs = require('fs')
const os = require('os')
const SHELLED = 3, STANDALONE = 2
const usage = "Usage: Node Ejes profiles [create | delete | list | set-default | update] [profile-name | current-default] [-v | --verbose | -s | --secret]"
const { getZoweProfile, setUpProfileDirectories, getPostInfo } = require('./auth')
var index

function writeProfile(processType) {
    ejes.profile = os.homedir() + '/.ejes/profile/' + profileName
    delete ejes.zowe // No need for indicator
    getProfileCount()
    getDefaultProfile()
    writeProfileFile(profileName, JSON.stringify(ejes, 2)) // Note that any error is reported, but processing continues.
    ansiErrOut(INFO + 'Profile file ' + processType + 'ed: ' + ITEM + ejes.profile + RESET) 
    ansiErrOut(INFO + 'Profile has been saved.  Run an (E)JES RESTapi CLI to test changes.' + RESET)
    if ( profileCount == 0 || defaultProfile.length == 0 )
        setProfile(defaultProfile = profileName)
    if ( verbose )
      outputInfo()
  }

function inputProfileFromUser(processType) {
  const nc = (color) => noColor ? RESET : color
  ansiErrOut(MSG + 'You are ' + processType + 'ing profile ' + ITEM + profileName + MSG + '.' + RESET)
  ansiErrOut(MSG + 'Specify credentials for (E)JES, typically your TSO credentials, and the address\nof the (E)JES RESTapi server.  Press Enter to accept any defaults presented.\n' + RESET)
  var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  });
  if (ejes.auth == '*')
    ejes.auth = ''
  var answers = [ejes.useZoweProfile || 'no', ejes.loggedOnUser || '', '', ejes.hostname || '', ejes.port || '', ejes.basePath || '/EjesWeb/api', (ejes.rejectUnauthorized == undefined ? 'true' : (ejes.rejectUnauthorized ? 'true' : 'false')), ejes.colorScheme || 'dark', ejes.noColor || 'off']
  const zoweProfileQuestion = 'Use Zowe default profile when running outside of Zowe?'
  const userid = 'User ID'
  const colorScheme = 'Color scheme'
  const noColorQ = 'Prevent ANSI colorization (NO_COLOR) "on" or "off"'
  const password = 'Passphrase in double quotes or a password' + nc(ERROR) + '(REQUIRED, non-display)'
  var questions = [zoweProfileQuestion, userid, password, 'Host Name without "https://" prefix', 'Host Port', 'Base Path for Zowe or use /EjesWeb/api',  'Reject certificates that don\'t have a trusted signer', colorScheme, noColorQ]
  var index = ejes.zowe ? 0 : 1;
  var end = questions.length

  function prompt() {
    var invisible = questions[index] == password || (secret && questions[index] == userid)
    addendum = answers[index] ? (nc(ITEM) + '(' + (invisible ? '<secret>' : answers[index]) + '): ' + RESET) : ': '
    rl.setPrompt(nc(HardReset) + RESET + nc(HILITE) + questions[index] + addendum + RESET + (invisible ? OBSCURE /*Hidden + FgBlack + BgBlack*/: ''))
    rl.prompt(true)
    }
  if ( ! process.stdout.isTTY ) {
    ansiErrOut(ERROR + 'Credential and host input must not be redirected.' + HardReset + ClearLine)
    process.exit(32)
  }

  if ( ! ejes.zowe )
    ansiErrOut(HILITE + zoweProfileQuestion + ITEM + '(no): ' + RESET + 'no ' + MSG + '-- The Zowe subsystem was not detected.' + RESET)   
  prompt()
  rl.on('line', (input) => {
    if ( input.length == 0 && answers[index].length > 0 )
      input = answers[index]
      if ( questions[index] == zoweProfileQuestion ) {
        ejes.useZoweProfile = input.toLowerCase().startsWith('y') ? 'yes' : 'no'
        if ( ejes.useZoweProfile == 'yes' ) {
          ejes = { useZoweProfile: 'yes' } // Delete everything significant if using Zowe's profile
          writeProfile(processType)
          rl.close()
          return
        }
      }
      if ( questions[index] == password && input.length == 0 ) {
        ansiErrOut(RESET + ERROR + 'Error: You must enter a password.' + RESET)
        prompt()
        return
      }
      if ( questions[index] == colorScheme  && ! fs.existsSync(__dirname + '/' + input + '.scheme')) {
        ansiErrOut(RESET + ERROR + 'Error: Color scheme ' + ITEM + input + ERROR + ' does not exist.  Try ' + ITEM + 'dark' + ERROR + ', ' + ITEM + 'light' + ERROR + ', ' + ITEM + 'blue' + ERROR + ', ' + ITEM + 'mono' + ERROR + ', or ' + ITEM + 'mono' + ERROR + '.'  + RESET)
        prompt()
        return
      } 
    answers[index++] = input
    var answer = 1;
    if ( index >= end || ejes.useZoweProfile == 'yes' ) {
      let text = (ejes.loggedOnUser = answers[answer++]) + ':' + answers[answer++]
      ejes.auth = (Buffer.alloc(text.length, text)).toString('base64')
      ejes.hostname = answers[answer++]
      ejes.port = answers[answer++]
      ejes.basePath = answers[answer++]
      ejes.rejectUnauthorized = answers[answer++].toLowerCase() == 'false' ? false : true
      ejes.colorScheme = answers[answer++]
      ejes.noColor = answers[answer++].toLowerCase() == 'on' ? 'on' : 'off'
      writeProfile(processType)
      rl.close()
    }
    else
      prompt()
  });
}

const profileNameRequired = 'A profile name is required for '
var profileName
function foundProfileName() { // Return true and profileName set if found, else return false.
  index++ // Becomes 4 or 3, length 5 or 4 required
  if ( process.argv.length > index ) {
    let prospect = process.argv[index].toLowerCase()
    if ( ! prospect.startsWith('-') )
    return (profileName = prospect)
  }
}

var defaultProfile = ''
function getDefaultProfile() {
  try { // Read in default for matching.
    defaultProfile = fs.readFileSync(os.homedir() + '/.ejes/work/default')
  }
  catch (e) {
    defaultProfile = ''
    if ( e.code != 'ENOENT' ) {
      ansiErrOut(INFO + 'Unable to read a default profile name from file: ' + ITEM + os.homedir() + '/.ejes/work/default' + '.' + RESET)
      ansiErrOut(e.message || e)
    }
  }
  return defaultProfile
}

var profileCount = 0
function getProfileCount() {
  profileCount = 0
  try {
    var files = fs.readdirSync(os.homedir() + '/.ejes/profile/', {withFileTypes: true})
    getDefaultProfile()
    files.forEach((item) => item.isFile && profileCount++)
  }
  catch(err) {
    ansiErrOut(ERROR + 'Error trying to read profile directory while counting profiles.' + RESET)
    ansiErrOut(err)
  }
  return profileCount
}

function createProfile() {
  if ( foundProfileName() ) {
    if ( fs.existsSync(os.homedir() + '/.ejes/profile/' + profileName) ) {
      ansiErrOut(ERROR + 'Error: Profile ' + ITEM + profileName + ERROR + ' exists.')
      ansiErrOut(ERROR + 'Use ' + ITEM + 'Node Ejes Profiles Update <profile>' + ERROR + ' instead.' + RESET)
    }
    else
      inputProfileFromUser('creat')
  }
  else
    ansiErrOut(ERROR + 'Error: A profile name is required when creating a profile.\n' + RESET + usage)
}

function deleteProfile() {
  if ( foundProfileName() ) {
    getDefaultProfile()
    try {
      fs.unlinkSync(os.homedir() + '/.ejes/profile/' + profileName)
      ansiErrOut(INFO + 'Profile ' + ITEM + profileName + INFO + ' was deleted.' + RESET)
      if ( getProfileCount() < 1 )
        ansiErrOut(INFO + 'There are nolonger any profiles.' + RESET)
    } catch (e) {
      ansiErrOut(ERROR + 'Error: Failed to delete profile.' + RESET)
      ansiErrOut(e.message || e)
      return
    }
    if ( defaultProfile == profileName )
      try {
        fs.unlinkSync(os.homedir() + '/.ejes/work/default')
        if ( getProfileCount() > 0 ) {
          ansiErrOut(INFO + 'No profile set as a default.')
          ansiErrOut('Use ' + ITEM + 'Node Ejes Set <profile>' + INFO + ' to set a default profile to one of these:' + RESET)
          secret = verbose = false
          listProfiles()
        }
      } catch (e) {
        ansiErrOut(ERROR + 'Error: Failed to delete default profile setting.' + RESET)
        ansiErrOut(e.message || e)
      }
  }
  else
    ansiErrOut(ERROR + 'Error: A profile name is required when deleting a profile.\n' + RESET + usage)
}

function setProfile() {
  fs.writeFile(os.homedir() + '/.ejes/work/default', profileName, {flag: 'w'}, (err) => {
    if ( err ) {
      ansiErrOut(ERROR + 'Error while writing default profile name to /.ejes/work/default.' + RESET)
      ansiErrOut(err)
    }
    else
      ansiErrOut(INFO + 'Profile ' + ITEM + profileName + INFO + ' set as the default profile.' + RESET)
  }) 
}

function setDefaultProfile() {
  if ( foundProfileName() ) {
    if ( ! fs.existsSync(os.homedir() + '/.ejes/profile/' + profileName) ) {
      ansiErrOut(ERROR + 'Error: Profile ' + ITEM + profileName + ERROR + ' is not found.' + RESET)
      maybeReissueCommand()
    }
    else
      setProfile()
  }
  else
    ansiErrOut(ERROR + 'Error: A profile name is required when setting a default profile.\n' + RESET + usage)
}

var secret = false
var verbose = false
var help = false
function getOptions() {
  process.argv.forEach((item) => {
    switch (item.toLowerCase()) {
      case '-n' : case '--nc': noColor = true; setErrStrip(true); break
      case '-h' : case '--help': help = true; break
      case '-s' : case '--secret':  secret = true
      case '-v' : case '--verbose': case '--sc': verbose = true  // Intentional
    }
  })
}

function outputInfo() {  // NOTE: Destroys ejes object.
  ejes.loggedOnUser && (ejes.user = secret ? '<secret>' : ejes.loggedOnUser) 
  ejes.password && (ejes.password = '<not shown>')
  delete ejes.auth
  delete ejes.loggedOnUser
  ansiErrOut(ejes)
}

function listProfiles() {
  try {
    var files = fs.readdirSync(os.homedir() + '/.ejes/profile/', {withFileTypes: true})
    getDefaultProfile()
    files.forEach((item) => {
      if ( item.isFile ) {
        ansiErrOut(item.name + (defaultProfile == item.name.toLowerCase() ? ' (default)' : ''))
        if ( verbose ) {
          readProfile(item.name)
          outputInfo()
        }
        // TODO : List contents of file if -v or -s are specified.
      }
    })
  }
  catch(err) {
    ansiErrOut(ERROR + 'Error trying to read profile directory while trying to list profiles.' + RESET)
    ansiErrOut(err)
  }
}

function maybeReissueCommand() {
  if ( getProfileCount() > 0 ) {
    secret = verbose = false
    ansiErrOut(INFO + 'Reissue the command specifying on of these profiles:' + RESET)
    listProfiles()
  }
}

function updateProfile() {
  if ( ! foundProfileName() ) {
    try {
      profileName = fs.readFileSync(os.homedir() + '/.ejes/work/default')
      ansiErrOut('Will update default profile: ' + profileName)
    }
    catch(e) {
      ansiErrOut(ERROR + 'Error: A profile for update was not specifed and there is no default profile.' + RESET)
      if ( getProfileCount() < 1 )
        ansiErrOut(INFO + 'Use ' + ITEM + 'Node Ejes Create <profile>' + INFO + ' to create a new profile.' + RESET)
      else
        maybeReissueCommand()
      return
    }
  }
  if ( ! fs.existsSync(os.homedir() + '/.ejes/profile/' + profileName) ) {
    ansiErrOut(ERROR + 'Error: Profile ' + ITEM + profileName + ERROR + ' is not found.' + RESET)
    maybeReissueCommand()
  }
  else {
    let zowe = ejes.zowe 
    readProfile(profileName)
    zowe && (ejes.zowe = zowe)
    inputProfileFromUser('updat')
  }
}

/* Main Program */

//ansiErrOut(process.argv)

const { readSchemeFile } = require('./ansiScheme.js')
getOptions()
readSchemeFile('dark')

process.on('SIGPIPE', () => { ansiErrOut(ERROR + 'Broken Pipe' + HardReset + ClearLine); process.exit(71)})
process.on('SIGHUP', () => { ansiErrOut(ERROR + 'Hangup' + HardReset + ClearLine); process.exit(72) })
process.on('SIGINT', () => { ansiErrOut(); ansiErrOut('Interrupt' + HardReset + ClearLine); process.exit(74) })
process.on('exit', (code) => { ansiErrOut(RESET + '\nDone.' + HardReset + ClearLine) })

let padding = ' '.repeat(process.stdout.isTTY ? Math.max(process.stdout.columns, ejesVersion.length) - ejesVersion.length : 1)
ansiErrOut(HardReset + RESET + Bright + FgCyan + BgBlack + Reverse + ejesVersion + padding + NoReverse + HardReset + RESET)
setUpProfileDirectories() // Ensure all required directories exist or exit.
getPostInfo()
if ( help ) {
  ansiErrOut(ClearScrn + INFO + 'Profiles allows you to maintain ejes profiles (except in Zowe).' + RESET)
  ansiErrOut(INFO + 'To set up profiles, issue: ' + ITEM + 'Node Ejes Profiles <action> [<profile-name>] <option...>\n\n' + RESET)
  ansiErrOut(INFO + '[create | cre | new] <profile-name> [-s | --secret | -v | --verbose]\n    - Create new profile.  You will be prompted for each argument.\n' + RESET)
  ansiErrOut(INFO + '[delete | del | rm] <profile-name>\n    - Delete named profile.\n' + RESET)
  ansiErrOut(INFO + '[list | ls] [-s | --secret | -v | --verbose]\n    - List all profiles and optionally their contents.\n' + RESET)
  ansiErrOut(INFO + '[set-default | set] <profile-name>\n    - Set the default profile to use in Node Ejes.  One must be specified.\n' + RESET)
  ansiErrOut(INFO + '[update | upd] [<profile-name>] [-s | --secret | -v | --verbose]\n    - Update existing or [default] profile.  You will be prompted for each argument.\n\n' + RESET)
  ansiErrOut(INFO + '-h or --help    - Display this help.' + RESET)
  ansiErrOut(INFO + '-s or --secret  - Display the contents of a profile.  Hide both the user id and password.' + RESET)
  ansiErrOut(INFO + '-v or --verbose - Display the contents of a profile.  Hide only the password.' + RESET)
  ansiErrOut(INFO + '-n or --nc      - Do not colorize.  Password input remains non-display.' + RESET)
}
else if ( process.argv.length < 3 )
  ansiErrOut(ERROR + usage + RESET)
else {
  index = process.argv[2].toLowerCase() == 'profiles' ? SHELLED : STANDALONE  // Shelled from Node Ejes vs Node Profiles.js.
  if ( index == SHELLED && process.argv.length < 4 ) 
    ansiErrOut(ERROR + usage + RESET)
  else {
    switch (process.argv[index].toLowerCase()) {
      case 'create': case 'cre': case 'new':
        getZoweProfile(0) && ansiErrOut(HardReset + RESET + HILITE + 'Zowe subsystem detected.' + RESET)
        createProfile()
        break
      case 'delete': case 'rm': case 'del':
        deleteProfile()
        break
      case 'list': case 'ls':
        listProfiles()
        break
      case 'set-default': case 'set':
        setDefaultProfile()
        break
      case 'update': case 'upd':
        getZoweProfile(0) && ansiErrOut(HardReset + RESET + HILITE + 'Zowe subsystem detected.' + RESET)
        updateProfile()
        break
      default:
        ansiErrOut(ITEM + process.argv[index] + ERROR + ' is not a valid action.' + RESET)
        ansiErrOut(usage)
      }
  }
}
