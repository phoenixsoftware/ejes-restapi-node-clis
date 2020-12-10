#!/usr/bin/env node
//  common.js - EJES CLI Shared Utility Routines.

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

const fs = require('fs')
const os = require('os')
const util = require('util')
const https = require('https')
const { ansiErrOut } = require('./ansiOut')

require('./ansiCodes')
require('./auth')
const { setExitCode  } = require('./ansiOut')

function flagWriteable(path) { // Make file read and writeable, and not visible to shares.
  fs.existsSync(path) && fs.chmodSync(path, 0o600)
  return path
}

function flagReadOnly(path) { // Make an existing file read-only, and not visible to shares.
  fs.chmodSync(path, 0o400)
  return path
}

/* Write pure node EJES profile

    Write the provide text expected to be JSON to the indicated profile name.
    On failure, error sent to stderr.  No return indication or exit.

*/
function writeProfileFile(profileName, text) {
  try {
    var path = os.homedir() + '/.ejes/profile/' + profileName
    encryptFile(text, path)
  }
  catch(e) {
    ansiErrOut('Failed to write to file: ' + path)
    ansiErrOut(e.message || e)
  }
}

/* Read pure node EJES profile

    Sets the ejes variable to the contents of the profile supplied.
    Set announce to true to display path that was read.
    Returns true on success.
    Returns false on failure with the message already output to stderr.
    
*/
function readProfile(profileName, announce = false) {
  try {
    path = os.homedir() + '/.ejes/profile/' + profileName
    let json = decryptFile(path)
    ejes = JSONparse(json, 'readProfile')    
    announce && ansiErrOut(INFO + 'Read current application profile: ' + ITEM + os.homedir() + '/.ejes/profile/' + profileName + RESET)
    return true
  }
  catch (e) {
    ansiErrOut(INFO + 'Unable to read profile ' + ITEM + profileName + ' from directory: ' + ITEM + os.homedir() + '/.ejes/profile' + RESET)
    if ( e.code != 'ENOENT' )
      ansiErrOut(e.message || e)
  }
}

/* Write a coded file to disk.  

    Each write of the same data will be unique.
    Caller should use try/catch.    
    NOTE: Data is safe at rest, but user should consider it security
    through obfuscation or by obscurity.  If a bad-actor obtains the
    program, they can reveal the profile information.
*/
const crypto = require('crypto')
const algorithm = 'aes-192-cbc'
const lick = 128, licks = 2 * lick
const bag = 16, bags = 2 * bag
const keylen = 24
const encoding = 'utf8'
const base = 'hex' 

function encryptFile(text, path) {
  const password = os.userInfo().username + os.arch() + postBox + os.userInfo().homedir + os.cpus()[0].model
  let salt = crypto.randomFillSync(Buffer.alloc(lick), 0, lick)
  let key = crypto.scryptSync(password, salt, keylen)
  let iv = crypto.randomFillSync(Buffer.alloc(bag), 0, bag)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, encoding, base)
  encrypted += cipher.final(base)
  fs.writeFileSync(flagWriteable(path), salt.toString(base) + encrypted + iv.toString(base), {mode: 0o400})
}

/* Read a coded file from disk.  

    Returns text in-clear.
    Caller should use try/catch.    
*/
function decryptFile(path) {
  const password = os.userInfo().username + os.arch() + postBox + os.userInfo().homedir + os.cpus()[0].model
  let data  = fs.readFileSync(path).toString()
  flagReadOnly(path)  // Overrule any user change
  let salt = Buffer.from(data.substr(0, licks), base)
  let key = crypto.scryptSync(password, salt, keylen)
  let iv = Buffer.from(data.substr(-bags), base)
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(data.substring(licks, data.length - bags), base, encoding);
  return decrypted += decipher.final(encoding)
}

var inFile = decryptFile, outFile = encryptFile

/* Parse JSON.

    Returns parse object.
    Exit with diagnostics if JSON.parse fails.
*/
function JSONparse(data, label, exitCode = 60, moreInfo = undefined ) {
  try {
    return JSON.parse(data)
  }
  catch(e) {
    let x = e.message.match(/^.+position (\d+)/)
    ansiErrOut(ERROR + 'ERROR: Bad JSON data received from host.  Bad data follows.  Position is marked.' + RESET)
    moreInfo && ansiErrOut(moreInfo)
    if ( x && x.length == 2 ) {
      ansiErrOut(data.substr(0, parseInt(x[1])))
      ansiErrOut(ERROR + '\n*** JSON parse error at this position ***\n' + RESET)
      ansiErrOut(data.substr(parseInt(x[1])))
    }
    else
      ansiErrOut(data)
    ansiErrOut(MSG + 'Stack trace of error caused by bad JSON data shown below.\n' +
      '*'.repeat(label.length + 25) + '\n' +
      '*** Reference label: ' + ITEM + label + ' ***\n' + 
      '*'.repeat(label.length + 25) + RESET)
    ansiErrOut(e)
    term.exitNow(exitCode, true)
  }
}

function fileSizeSI(a,b,c,d,e){
  return (b=Math,c=b.log,d=1e3,e=c(a)/c(d)|0,a/b.pow(d,e)).toFixed(2)
  +' '+(e?'kMGTPEZY'[--e]+'B':'Bytes')
 }

function abbreviateNumber(value) {
  var newValue = value;
  if (value >= 1000) {
      var suffixes = [" bytes", "k", "m", "b","t"];
      var suffixNum = Math.floor( (""+value).length/4 );
      var shortValue = '';
      for (var precision = 4; precision >= 1; precision--) {
          shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
          var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
          if (dotLessShortValue.length <= 2) { break; }
      }
      if (shortValue % 1 != 0)  shortValue = shortValue.toFixed(1);
      newValue = shortValue+suffixes[suffixNum];
  }
  return newValue;
}

function getClientDateStamp() {
  let date = new Date()
  return date.toUTCString().replace(' GMT','.' + date.getUTCMilliseconds() + ' GMT')
}

/* debugging for requests and response */

function debugRequest() {
  options.request++
  options.clientDateStamp = getClientDateStamp()
  if ( debug & d_RequestAndQuery ) {
    ansiErrOut(INFO + "Request " + ITEM + options.request + INFO + ": " + RESET)
    var hidden;
    if ( options.headers.Authorization ) {
      hidden =  (' ' + options.headers.Authorization).slice(1)
      options.headers.Authorization = '<not shown>'
    }
    ansiErrOut(util.inspect(options, true, 10, true) + RESET)
    if ( hidden )
      options.headers.Authorization = (' ' + hidden).slice(1)
  }
  return options.request
}

function debugResponse(request, res) {
  if ( debug & d_ResponseHeaders && request ) {
    res.headers.clientResponseDateStamp = getClientDateStamp()
    ansiErrOut(INFO + "Response to request " + ITEM + request + INFO + ": " + RESET)
    ansiErrOut(util.inspect(res.headers, true, 10, true)  + RESET)
  }
}

function stackTrace(note) {
  try { throw new Error(note || 'test') }
  catch(e) { e.stack = e.stack.split('\n'); console.log(util.inspect(e, true, 10, true)) }
}

function fileLog(path = './', text) {
  text = getClientDateStamp() + ' ' + text
  //console.log(text) 
  fs.appendFileSync(path + 'log.txt', text + '\n')
}

/*  Termination Handling for Query and Batch 

      Note that the main term functions use callbacks to customize behavior
      differences between the apps.  The calling app needs to define a
      term.callback function in it's code.  when executing, if the term.callback
      function is defined, the code will use the callback.
*/
const term = {

  /* Handle request errors */

  requestError: function(e) {
    ansiErrOut(ERROR + 'An error occurred after sending request #' + HILITE + options.request + ERROR + ' as follows:' + RESET)
    ansiErrOut(RESET + util.inspect(e, true, 10, true)  + RESET)
    let auth = options.headers.Authorization
    if ( options.headers.Authorization ) 
      options.headers.Authorization = '<not shown>'
    ansiErrOut(RESET + util.inspect(options, true, 10, true)  + RESET)
    auth && (options.headers.Authorization = auth)
    if ( options.hostname && options.hostname.length && options.port )
      ansiErrOut(MSG + 'Is the server at ' + ITEM + options.hostname + INFO + ':' + ITEM + options.port + MSG + ' running?'+ RESET )
    else
      ansiErrOut(MSG + 'It appears you have not provided credentials or host information.' + RESET )  
    this.requestErrorExit && this.requestErrorExit()  // CALLBACK
    },

  /* Cancel downloads */

  cancelTime: 0,
  cancel: function() {
    term.cancelTime = Date.now()
    options.headers.Cookie = cookie
    options.path = ejes.basePath + '/cancel-download'
    delete options.post
    var response = debugRequest()
    https.request(options, (res) => { 
      debugResponse(response, res)
      res.on('data', (chunk) => { 
        let result = chunk.toString()
        ansiErrOut('Cancel result ' + result.slice(0, result.length - 1) + ' in ' + ((Date.now() - term.cancelTime) / 1000) + ' seconds.') 
      }) 
      res.on('end', () => { debug & d_LogoffCancelEndOfData && ansiErrOut(DEBUG + 'Cancel Completed.' + RESET) })
    })
    .on('error', (e) => { ansiErrOut(util.inspect(e, true, 10, true)  + RESET) })
    .end()
    debug & d_LogoffCancelEndOfData && ansiErrOut(DEBUG + 'Cancel requested.' + RESET)
  },

 /* Exit with signalling. If a logoff is chosen, call must handle exiting. */

  signal: false,
  exitNow: function(exitCode, force) {
    this.signal = true
    setExitCode(process.exitCode = exitCode)
    if ( ! force && ! term.terminated ) {
      term.logoff()
      if ( force == false )
        throw new Error('exitNow')
    }
    else
      process.exit(exitCode)
  },

  hostErrorReceived: 0,
  setAdditiveExitCode: function(json) {
    if ( json.message.isErrorMessage ) { 
      this.hostErrorReceived > 0 && (this.hostErrorReceived -= 100)
      if (['113', '141', '250', '295', '475'].some((msgNumber) => { return json.message.longMessages[0].startsWith('EJES' + msgNumber)})) {
        this.hostErrorReceived |= 4
      }
      else
        this.hostErrorReceived |= 1
      this.hostErrorReceived += 100
    }
  },
  
  /* logoff */

  terminated: false,
  logoff: function(parm) {
    this.logoffPreamble && this.logoffPreamble()
    if ( this.terminated || (this.logoffOrTerminate && this.logoffOrTerminate(parm)) ) {
      this.logoffTerminate && this.logoffTerminate(parm)
      return
    }
    debug & d_LogoffCancelEndOfData && ansiErrOut(DEBUG + "Logging off..." + RESET)
    if ( this.logoffIsDownload() )  // Implementation requires this to be specified.
      this.cancel();
    options.path = ejes.basePath + '/term'
    delete options.post
    this.terminated = true
    var request = debugRequest()
    https.request(options, (res) => {   
      debugResponse(request, res)
      res.on('data', (chunk) => {debug & (d_LogoffCancelEndOfData + d_ResponseHeaders) && ansiErrOut(RESET + util.inspect(JSONparse(chunk.toString(), 'logoff'), true, 10, true) + RESET)})
      res.on('end', () => { this.logoffRequestEnd && this.logoffRequestEnd() })
    })
    .on('error', (e) => { this.logoffRequestError && this.logoffRequestError(e) })
    .end()
    this.logoffPostscript && this.logoffPostscript()
    debug & d_LogoffCancelEndOfData && ansiErrOut(DEBUG + 'TERM request sent.' + RESET)
  },  

}

function _isLeapYear(date) {
  var year = date.getFullYear();
  return (year % 4 ? false : (year % 100 ? true : (year % 400 ? false : true)));
}

function TODtoDate(ds, f) {
  function _int(css) {
    return Math.ceil(parseFloat(css));
  }
  function _getDaysInYear(date) {
    if ( _isLeapYear(date) )
      return 366;
    return 365;
  }
  function _getDaysInMonth(date) {  // returns date or string with syntax error
    var d = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
    if ( _isLeapYear(date) )
      d[1] = 29;
    return d[date.getMonth()]
  }
  var date, g1, g2, j, m, r, t, hour, minute, second, th, month, day, year;
  t = '([0-9]{2})[\.:]([0-9]{2})([\.:]([0-9]{2})([\.:]([0-9]{2}))?)?';
  j = '(-([0-9]{4})[-\.]([0-9]{3}))?';
  g1 = '(-([0-9]{4})[-/]([0-9]{2})[-/]([0-9]{2}))?';
  g2 = '(-([0-9]{2})[-/]([0-9]{2})[-/]([0-9]{4}))?';
  r = '^'+t+'('+j+(f == 'YYYYDDD' ? '' : '|'+(f == 'YYYYMMDD' ? g1 : g2))+')?$';
  r = new RegExp(r);
  m = ds.match(r);
  if ( m != null ) {
      date = new Date();
      year = date.getFullYear();
      month = date.getMonth()+1;
      day = date.getDate();
      hour = minute = second = th = 0;
      if ( ! ( ! m[9] || ! m[10] ) )
          f = 'YYYYDDD';
      switch (f) {
          case 'YYYYDDD':                    year = (! m[9]  ? year : _int(m[9]));   break;
          case 'YYYYMMDD':                   year = (! m[12] ? year : _int(m[12]));  break;
          case 'MMDDYYYY': case 'DDMMYYYY':  year = (! m[18] ? year : _int(m[18]));  break;
      }
      if ( year < 1970 || year > 2045 )
          return 'Year out of range: ' + year;
      hour = _int(m[1]);
      minute = _int(m[2]);
      second = ! m[4] ? second : _int(m[4]);
      th = ! m[6] ? th : _int(m[6]);
      if ( hour > 23 || minute > 59 || second > 59 )
          return 'Hour, minute, or second out of range: ' + hour + ':' + minute + ':' + second;
      if ( f == 'YYYYDDD' ) {
          day = _int(m[10]);
          if ( day < 1 || day > _getDaysInYear(new Date(year,0,1)) )
              return 'Day of year out of range: ' + day;
          month = 1;
      }
      else {
          switch (f) {
          case 'YYYYMMDD':
              month = ! m[13] ? month : _int(m[13]);
              day = ! m[14] ? day : _int(m[14]);
              break;
          case 'MMDDYYYY':
              month = ! m[16] ? month : _int(m[16]);
              day = ! m[17] ? day : _int(m[17]);
              break;
          case 'DDMMYYYY':
              day = ! m[16] ? day : _int(m[16]);
              month = ! m[17] ? month : _int(m[17]);
              break;
          }
          if ( month < 1 || month > 12 )
              return 'Month not 1-12: ' + month;
          if ( day < 1 || day > _getDaysInMonth(new Date(year,month-1,1)) )
              return 'Day ' + day + ' invalid for month ' + month;
      }
      date = new Date(year, month-1, day, hour, minute, second, th*10);
      return date;
  }
  return false;
}

function TODtoString(tod, format, sep) {
  function _getJulianDays(date) {
    var d, i, m, n;
    d = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
    if ( _isLeapYear(date) )
        d[1] = 29;
    m = date.getMonth();
    for ( i = 0, n = 0 ; i < m ; i++ )
        n += d[i];
    return (n + date.getDate());
  }
  var format, sep, date, day, hour, minute, month, second, th, year;
  date = new Date(parseFloat(tod));
  year = '0000' + date.getFullYear();
  year = year.substring(year.length-4)
  month = '00' + (date.getMonth()+1);
  month = month.substring(month.length-2)
  day = '00' + date.getDate();
  day = day.substring(day.length-2)
  hour = '00' + date.getHours();
  hour = hour.substring(hour.length-2)
  minute = '00' + date.getMinutes();
  minute = minute.substring(minute.length-2)
  second = '00' + date.getSeconds();
  second = second.substring(second.length-2)
  th = '000' + date.getMilliseconds();
  th = th.substring(th.length-3, th.length-1)
  switch (format) {
  case 'YYYYDDD':
      date = new Date(_int(year), _int(month)-1, _int(day));
      day = '000'+_getJulianDays(date);
      day = day.substring(day.length-3);
      date = hour+':'+minute+':'+second+'.'+th+'-'+year+sep+day;
      break;
  case 'MMDDYYYY':
      date = hour+':'+minute+':'+second+'.'+th+'-'+month+sep+day+sep+year;
      break;
  case 'DDMMYYYY':
      date = hour+':'+minute+':'+second+'.'+th+'-'+day+sep+month+sep+year;
      break;
  case 'YYYYMMDD':
  default:
      date = hour+':'+minute+':'+second+'.'+th+'-'+year+sep+month+sep+day;
      break;
  }
  return date;
}


module.exports = {
  abbreviateNumber,
  debugRequest,
  debugResponse,
  fileLog,
  fileSizeSI,
  flagWriteable,
  flagReadOnly,
  getClientDateStamp,
  JSONparse,
  readProfile,
  stackTrace,
  term,
  writeProfileFile,
  inFile,
  outFile,
  TODtoDate,
  TODtoString
}

