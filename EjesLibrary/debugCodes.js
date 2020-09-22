#!/usr/bin/env node
/*  debugCodes.js - EJES Debug codes for CLI (E)JES version.
*/

/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright (c) 2020 Phoenix Software International, Inc.
s*
*/

// Assignment only
d_NoDebugging = 0

// Additive flags 
d_CLIOptionsAndArguments = 1
d_GeneratedCmdsAndQueries = 2
d_HostCmds = 4
d_DisplayRowkeys = 32
d_BatchKeepAlive = 32
d_RequestAndQuery = 64
d_ResponseHeaders = 128
d_LogoffCancelEndOfData = 256
d_JSONResponseInspector = 512
d_ProfileDump = 1024
d_BatchTracing = 2048
d_Accounting = 4096
d_Reserved = 8192
d_Testing = 16384