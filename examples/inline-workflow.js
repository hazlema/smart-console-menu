#!/usr/bin/env node
/**************************************************************
  * Professional DevOps management with smart-console-menu
  *
  * Features demonstrated:
  * ✅ As a linux shell script
  * ✅ Complex deployment workflows
  * ✅ Database management operations
  * ✅ Comprehensive debugging tools
  * ✅ Chaining configuration like a boss
  *************************************************************/

import { SmartConsoleMenu, ConfigManager } from '../lib/console-smart.js';

new SmartConsoleMenu({
	menu: {
		root: [
			["Database Operations", "menu", "dbMenu"],
			["Debug Menu", "menu", "debugMenu"],
			["System Info", "exec", "uname -a"],
			["Quit", "exec", "quit"]
		],
		dbMenu: [
			["Authenticate to Supabase", "exec", "npx supabase login"],
			["Link to Supabase", "exec", "npx supabase link"],
			["Generate types", "exec", "npm run db:generate"],
			["List branches", "exec", "npx supabase branches list"],
			["Show Tables", "exec", "npx supabase branches switch"],
		],
		debugMenu: [
			["Show Variables", "debug", "vars"],
			["Show Config Details", "debug", "config"], 
			["Show Environment", "debug", "env"],
			["Show Menu Structure", "debug", "menu"],
			["Show All Debug Info", "debug", "all"],
		]
	}, 
	cfg: new ConfigManager({
		file: "./smooth-config.json",
		load: ['.env']
	})
}).start().catch(console.error);

