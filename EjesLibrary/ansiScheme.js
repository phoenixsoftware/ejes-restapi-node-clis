#!/usr/bin/env node
//  ansiScheme.js - EJES CLI ANSI Color Scheme File Compiler.

/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright (c) 2020 Phoenix Software International, Inc.
*
*/

const ejesVersion = 'EJES Ansi Scheme Compilier, a CLI component of (E)JES.  V0.1.5'
function readSchemeFile(schemeFile = 'dark', show = false, update = false) {
  require('./ansiCodes.js')
  const { ansiLogOut, ansiErrOut } = require('./ansiOut.js')
  const fs = require('fs')
  let schemeFilePath = __dirname + '/' + schemeFile + '.scheme'
  try {
    var q = fs.readFileSync(schemeFilePath).toString()
    var i = 0
    var iParsed = 0
    let padding = ' '.repeat(process.stdout.isTTY ? Math.max(process.stdout.columns, ejesVersion.length) - ejesVersion.length : 1)
    show && ansiLogOut(HardReset + RESET + Bright + FgCyan + BgBlack + Reverse + ejesVersion + padding + NoReverse + HardReset + RESET)
    var w = q.trim().split('\n').reduce((x,y) => {
      var line = '(' + String("0" + ++i).slice(-2) + ') '
      if ( y.trim().length == 0 ) {
        show && ansiLogOut(HardReset + line + 'Read:    ' + y + HardReset)
        return x
      }
      var z = y.trim().split('=');
      if ( z.length > 0 && z[0].startsWith('#') ) {
        show = show || z[0].startsWith('#test')
        show && z[0].startsWith('#test') && ansiLogOut('Reading scheme file ' + schemeFile + '.scheme for parsing.')
        show && ansiLogOut(HardReset + line + 'Read:    ' + y + HardReset)
        return x
      } 
      var target = z[0].trim().toUpperCase()
      var value = z[1].trim().toLowerCase()
      show && ansiLogOut(HardReset + line + 'Parsed:  ' + target + '=' + value.replace(/\x1b/g, '<esc>') + HardReset)
      if ( iParsed++ == 0 && target != 'RESET' ) {
        ansiLogOut(Bright + FgRed + '\nFATAL ERROR: RESET=<fgColor><bgColor> must be the first setting parsed in scheme file. ' + HardReset)
        ansiLogOut('Path to color scheme file with error: ' + schemeFilePath)
        ! show && ansiLogOut(HardReset + line + 'Parsed:  ' + target + '=' + value.replace(/\x1b/g, '<esc>') + HardReset)
        process.exit(61)
      }
      if ( ansiCatagories.indexOf(target) >= 0 ) {
        if ( target.startsWith('UTIL') ) {
          if ( utilCatagories.indexOf(value) >= 0 ) {
            global[target] = value;
          }
          else {
            ansiLogOut(HardReset + RED + line + 'Warning: Value of target named ' + target + ' is not a keyword color:\n' + utilCatagories + HardReset)
            return x
          }
        }
        else if ( ansiColor[value] ) {
          global[target] = /*HardReset + */(target == 'RESET' ? HardReset : global.RESET)  + global[value.toUpperCase()];
        }
        else {
          if ( value.length == 0 )
            global[target] = ''
          else if ( value.length > 2 && value.startsWith('"') && value.endsWith('"') )
            global[target] = value.substring(1, value.length - 1).replace(/\\x1b/g, '\x1b')
          else {
            ansiLogOut(HardReset + RED + line + 'Warning: Value of target named ' + target + ' is not a keyword color or enclosed in double-quotes and will be ignored.' + HardReset)
            return x
          }
        }
      }
      else {
        ansiLogOut(HardReset + RED + line + 'Warning: Target named ' + target + ' is not supported and will be ignored.' + HardReset)
        return x
      }
      x[z[0].trim().toUpperCase()] = z[1].trim().toLowerCase();
      return x
    }, {} )
  }
  catch(e) {
    if ( schemeFile.toLowerCase() != 'none' ) {
      ansiLogOut(ERROR + 'Unable to read scheme file: ' + ITEM + schemeFilePath + ERROR + ', Error: ' +ITEM + e.code + ERROR + '.  Will continue ' + (update ? 'with current color scheme.' : 'without a color scheme.'))
      update = false
    }
  }
  var util = require('util')
  UTILNAME && (util.inspect.styles.name = util.inspect.styles.null = UTILNAME)
  UTILVAL && (util.inspect.styles.number = util.inspect.styles.bigint = util.inspect.styles.undefined = util.inspect.styles.boolean = UTILVAL)
  UTILDATE && (util.inspect.styles.date = UTILDATE)
  UTILREGEX && (util.inspect.styles.regexp = UTILREGEX)
  UTILSTRING && (util.inspect.styles.string = UTILSTRING)
  UTILFUNC && (util.inspect.styles.special = util.inspect.styles.module = UTILFUNC)
  if ( show ) {
    ansiErrOut('\nCompile Results for ' + schemeFile + '.scheme:')
    ansiLogOut(w)
    ansiErrOut('\nTesting colors specified in this color scheme:')
    ansiErrOut(HardReset + RESET + ClearLine + '----------')
    ansiErrOut( RESET + MSG + Reverse + '\n' + 'An example of color the EJES Title and Version line.' + NoReverse + RESET)
    ansiErrOut(Underscore + 'This is an example of underscored text with no color.' + NoUnderscore + RESET)
    ansiErrOut(DEBUG + 'An example of color DEBUG in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(ERROR + 'An example of color ERROR in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(HILITE + 'An example of color HILITE in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(ITEM + 'An example of color ITEM in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(INFO + 'An example of color INFO in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(MSG + 'An example of color MSG in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(FLAG + 'An example of color FLAG in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(DEFAULT + 'An example of color DEFAULT in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(RESET + 'An example of color RESET in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut('\nEJES Batch Screen Colors:')
    ansiErrOut(ACTIVE3270 + 'An example of color ACTIVE3270 in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(INMENU3270 + 'An example of color INMENU3270 in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(HILITE3270 + 'An example of color HILITE3270 in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(PARAMS3270 + 'An example of color PARAMS3270 in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(MSGHDR3270 + 'An example of color MSGHDR3270 in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(ISTEXT3270 + 'An example of color ISTEXT3270 in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(ERRORS3270 + 'An example of color ERRORS3270 in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(UNDISC3270 + 'An example of color UNDISC3270 in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(FILTER3270 + 'An example of color FILTER3270 in UPPERCASE and symbols @#$%^.' + RESET)
    ansiErrOut(HardReset + RESET + '\nJavascript object colors set by UTILNAME, UTILVAL, and UTILDATE\nas displayed in debug output: ')
    var obj = {
      number: 9,
      boolean: true,
      string: 'Some text',
      date: new Date(),
      regex: /a|b|c/g,
      undefined_value: undefined,
      special: (item) => { ansiLogOut('test') },
      null_value: null
    }
    ansiLogOut(obj)
    ansiErrOut(RESET + '----------')
    ansiLogOut(HardReset + ClearLine + 'Color testing done.  The colors should have returned to the\ndefault colors of terminal window.\n\n**********************************************************\n*** For ADA 508 accessiblity issues, please use the    ***\n*** --nocolor option, which is stored in the profile. ***\n**********************************************************\n')
  }
  return update
} // End function readSchemeFile()

/* lineto3270Color - 
      Maps a line array of characters of the json.screen.screenImage and replaces attributes with ANSI colors.
      Result is a string.  
      Terminates string with RESET, unless the line is blank and blankReturn is true.
*/

function lineTo3270Color(line, blankReturn = false) {
  let l = line.join('');
  //if ( lineNo == 4 ) { line.forEach((c, nbr)=>{ if ( nbr > 125 ) { ansiLogOut('nbr: ' + nbr + ', code: ' + c.charCodeAt(0) + ' "' + c + '"') }})} // Save for attr diagnosis
  l = l.replace(/\t/g,     HILITE3270 + ' ')    // Bright Yellow
  l = l.replace(/\u0000/g, ' ')                 // Empty field character, not an attribute.  Substitute a space only..
  l = l.replace(/\u0001/g, ERRORS3270 + ' ')    // Bright Red
  l = l.replace(/\u0002/g, ISTEXT3270 + ' ')    // Normal Cyan
  l = l.replace(/\u0003/g, ACTIVE3270 + ' ')    // Bright White
  l = l.replace(/\u0004/g, PARAMS3270 + ' ')    // Not used?  If unknown PURPLE data in table if shows up, find on 3270 and assign proper color
  l = l.replace(/\u0005/g, UNDISC3270 + '5')    // Undiscovered - Purple - Doesn't seem to be used.
  l = l.replace(/\u0006/g, MSGHDR3270 + ' ')    // Bright Cyan
  l = l.replace(/\u0007/g, FILTER3270 + ' ')    // Filter hilite color
  l = l.replace(/\u0008/g, INMENU3270 + ' ')    // Normal White (gray)
  // NOTE: If unknown 3270 attributes appear, download the display and look in notepad++
  //       which visualizes the control characters, then cross-reference using:
  //       https://en.wikipedia.org/wiki/C0_and_C1_control_codes
  return  (blankReturn && l.trim().length < 1 ) ? '' : l + RESET
}

var me = process.argv[1].slice(-10).toLowerCase()
if ( me == 'ansischeme' || me == 'ischeme.js' ) {
  let file = process.argv.length > 2 ? process.argv[2] : undefined
  let show = process.argv.length > 3 && process.argv[3] == 'test'
  let update = process.argv.length > 4 && process.argv[4] == 'update'
  readSchemeFile(file, show, update)
}
module.exports = {
  readSchemeFile,
  lineTo3270Color
}