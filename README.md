# (E)JES REST API Manager Sample CLIs

This repository contains CLI program that use the (E)JES V6R0 REST API written in node.js.  Its components are *sample
programs* provided to aid and enhance your experience using our (E)JES product.  These CLIs compose the npm module
that is installed by our [Zowe Ejes plug-in](https://github.com/phoenixsoftware/ejes-cli#readme).
While you can install and/or examine the source code here, you will require a license from Phoenix Software International
to use the underlying REST API and the (E)JES product.

- [(E)JES REST API Manager Sample CLIs](#(e)jes-rest-api-manager-sample-clis)
  - [Available CLIs](#available-clis)
  - [Project Goals](#project-goals)
  - [Documentation](#documentation)
  - [There is help for that...](#there-is-help-for-that)
  - [Prerequisites](#prerequisites)
  - [Installation and Usage](#installation-and-usage)

## Available CLIs  

* EJES API - A thin layer CLI demonstrating the full (E)JES REST API by mapping the (E)JES REST API directly to options.  It returns JSON that can be used by Node.js or other scripting languages.
* EJES Batch Shell - A full featured workstation implementation of (E)JES Batch on the host.  Includes an enhanced meta command set to improve interactive use while still being suitable for workstation automation analogous to running EJES BATCH as a batch job on the host.
* EJES Query - A conventional CLI to automate data gathering from the host for users who do not need nor want to learn host (E)JES commands.

[(top)](#readme)

## Project Goals

This project accomplishes the following goals to benefit Phoenix Software International customers:
* Provides scriptable functionality to access (E)JES on the host from the workstation.
* Can access zowe profiles to provide secure access.
* Demonstrates the use of REST API programmming.
* Provides the greater (E)JES community an example using node.js to access the (E)JES REST API.

[(top)](#readme)
  
## Documentation

Use of our CLIs is documented in chapter 11 of the *(E)JES Reference*.  Installation without Zowe is covered in the section titled *Using EJES Batch or EJES Query without Zowe*.

[(top)](#readme)

## There is help for that...

API, Batch, Issue, and Query provide *detailed* application specific help and usage information.

* `ejes batch status --help`
* `ejes batch status --h meta` &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (For meta-command specific help)

You can also issue the **help** command in *EJES Batch* and use the argument *help* for any option in *EJES Query*.  Additionally,  you may use *list* for any argument in *EJES Query* to see the possible values for the argument. 
  
[(top)](#readme)
## Prerequisites

* (E)JES V6R0 GA installed the host together with all current service.
* Workstation OS is up to date
* node
* npm

Before you work with package, take a moment to ensure your operating system, node.js, and npm are up to date.  

[(top)](#readme)
## Installation and Usage

The EJES API, EJES Batch, and EJES Query command groups may be used whether or not Zowe support is installed. Enter the following command to install them:

   `npm install -g @phoenixsoftware/ejes-restapi-node-clis`

The CLIs accept the same operands, options, and arguments (parameters) as for zowe, without the zowe command. The exceptions are that ‑‑help is the same as the option ‑‑helpApp and the group name **query** is not required for *EJES Query*.

` ejes api [parameters]`

`ejes batch [parameters]`

`ejes query [parameters]`  &nbsp;&nbsp; or &nbsp;&nbsp; `ejes [parameters]`

You will be required to supply an EJES profile using the ejes profiles command with arguments on first use. When you issue an ejes profiles command to create or update a local profile, the command prompts for your input. You are given the option of using your default zowe profile, if you have one defined.

`ejes profiles [create | delete | list | set-default | update] [profile-name | current-default] [-v | ‑‑verbose | -s | ‑‑secret | ‑‑sc]`

For example: 

`ejes profiles create jes3`

Issue the following command for help:

`ejes profiles -h`

An additional command is provided to assist you in creating user color scheme files. The file colorscheme.txt installed with the CLI gives further details on this optional topic.

`ejes ansischeme [dark | light | powershell | mono | none | user-file]`

[(top)](#readme)
