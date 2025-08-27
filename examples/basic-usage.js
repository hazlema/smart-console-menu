#!/usr/bin/env node
/**************************************************************
  * Minimal Example
  *************************************************************/

import { SmartConsoleMenu } from '../lib/console-smart.js';

new SmartConsoleMenu({
	menu: {
		root: [
			["File Menu", "menu", "fileMenu"],
			["Debug Variables", "debug", "vars"],
			["Long Process", "exec", "sleep 5"],
			["Quit", "exec", "quit"]
		],
		fileMenu: [
			["Create File", "exec", "touch ${filename} && echo 'Created: ${filename}'"],
			["List Files", "exec", "ls -la"],
			["Edit File", "exec", "${editor} ${filename}"],
		]
	}
}).start().catch(console.error);
