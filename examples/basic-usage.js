#!/usr/bin/env node

// Basic usage example for smart-console-menu
// import { ConsoleMenu } from './cli/lib/console-menu.js';
// const { ConsoleMenu } = require('../lib/console-menu.js');

import { ConsoleMenu } from '../lib/console-menu.js';

new ConsoleMenu({
	menu: {
		root: [
			["File Operations", "menu", "fileMenu"],
			["System Info", "exec", "uname -a"],
			["Debug Variables", "debug", "vars"],
			["Quit", "exec", "quit"]
		],
		fileMenu: [
			["Create File", "exec", "touch ${filename} && echo 'Created: ${filename}'"],
			["List Files", "exec", "ls -la"],
			["Edit File", "exec", "${editor} ${filename}"],
			["Back to Main Menu", "menu", "root"]
		]
	}
}).exec().catch(console.error);
