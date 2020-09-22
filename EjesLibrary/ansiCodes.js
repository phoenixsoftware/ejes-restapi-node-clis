#!/usr/bin/env node
//  ansiCodes.js - EJES ANSI code defined constants.

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

Bright =     "\x1b[1m"  // Supported
Dim =        "\x1b[2m"  // Not supported
Underscore = "\x1b[4m"  // Supported
Blink =      "\x1b[5m"  // Not supported
Reverse =    "\x1b[7m"  // Supported
Hidden =     "\x1b[8m"  // Not supported
ClearLine =  "\x1b[0J"  // Supported
ClearScrn =  "\x1b[3J\x1b[0;0H" // Supported

Normal =     '\x1b[22m' // Not Bright, not Dim
NoUnderscore = '\x1b[24m' // Not underscore
NoReverse =   '\x1b[27m' // Not Reverse

FgBlack =    "\x1b[30m"
FgRed =      "\x1b[31m"
FgGreen =    "\x1b[32m"
FgYellow =   "\x1b[33m"
FgBlue =     "\x1b[34m"
FgMagenta =  "\x1b[35m"
FgCyan =     "\x1b[36m"
FgWhite =    "\x1b[37m"

BgBlack =    "\x1b[40m"
BgRed =      "\x1b[41m"
BgGreen =    "\x1b[42m"
BgYellow =   "\x1b[43m"
BgBlue =     "\x1b[44m"
BgPwrBlue =  "\x1b[48;5;17m"
BgMagenta =  "\x1b[45m"
BgCyan =     "\x1b[46m"
BgWhite =    "\x1b[47m"
BgBrightWhite = '\x1b[48;5;15m'
HardReset = "\x1b[0m"


// 256-bit colors
PINK    = '\x1b[38;5;176m'
BLUE    = '\x1b[38;5;27m'
CYAN    = '\x1b[38;5;6m'
GREEN   = '\x1b[38;5;2m'
OLIVE   = '\x1b[38;5;100m'
BROWN   = '\x1b[38;5;130m'
BLACK   = Normal + FgBlack
GRAY    = '\x1b[38;5;244m'
RED     = Bright + FgRed
MAGENTA = Bright + FgMagenta
YELLOW  = Bright + FgYellow
WHITE   = Bright + FgWhite
GRAY    = Normal + FgWhite
SKYBLUE = Bright + FgCyan
LIME    = '\x1b[38;5;40m'
ORANGE  = '\x1b[38;5;202m'

// Fore and Background
BLACKGREY = BgBlack + FgWhite         // Grey on black
BLACKGRAY = BLACKGREY
WHITEBLACK = BgBrightWhite + BLACK
BLUEWHITE = BgPwrBlue + WHITE

ansiColor = {
    pink: PINK,
    blue: BLUE,
    cyan: CYAN,
    green: GREEN,
    olive: OLIVE,
    brown: BROWN,
    black: BLACK,
    gray: GRAY,
    grey: GRAY,
    red: RED,
    magenta: MAGENTA,
    yellow: YELLOW,
    white: WHITE,
    skyblue: SKYBLUE,
    orange: ORANGE,
    lime: LIME,
    blackgrey: BLACKGREY,
    whiteblack: WHITEBLACK,
    bluewhite: BLUEWHITE,
}

ansiCatagories = 'DEBUG, ERROR, HILITE, ITEM, INFO, MSG, FLAG, DEFAULT, ACTIVE3270, INMENU3270, HILITE3270, PARAMS3270, MSGHDR3270, ISTEXT3270, ERRORS3270, UNDISC3270, FILTER3270, RESET, UTILNAME, UTILVAL, UTILDATE, UTILREGEX, UTILSTRING, UTILFUNC'
utilCatagories = 'underline, inverse, white, grey, black, blue, cyan, green, magenta, red, yellow'

OBSCURE = Normal + FgBlack + BgBlack

DEBUG   = ''
ERROR   = ''
HILITE  = ''
ITEM    = ''
INFO    = ''
MSG     = ''
FLAG    = ''
DEFAULT = ''

// Debug mode object inspection
UTILNAME = undefined
UTILVAL  = undefined
UTILDATE = undefined
UTILREGEX = undefined
UTILSTRING = undefined
UTILFUNC = undefined

// "Standard" 3279 Color Dark Mode mapping for EJES BATCH Screen On output
ACTIVE3270 = ''
INMENU3270 = ''
HILITE3270 = ''
PARAMS3270 = ''
MSGHDR3270 = ''
ISTEXT3270 = ''
ERRORS3270 = ''
UNDISC3270 = '' 
FILTER3270 = '' 
RESET = '' 