#!/usr/bin/env node
/**************************************************************
  * smart-console-menu warning handler
  *
  * Features demonstrated:
  * ✅ How to suppress duplicate variable warnings
  *************************************************************/

import { ConsoleMenu } from '../lib/console-menu.js';

new ConsoleMenu({
	// Change warning to false to suppress
	"warnings": true,
	menu: {
		root: [
			["Test  #1", "exec", "cat ${--file}"],
			["Test  #2", "exec", "cat ${--file}"],
			["Quit", "exec", "quit"]
		]
	}
}).exec().catch(console.error);
