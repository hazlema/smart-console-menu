#!/usr/bin/env node

import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import ColorConsole from './console-color.js';
import ConfigManager from './console-config.js';
import cli from './console-cli.js';

class MenuValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'MenuValidationError';
	}
}

export class ConsoleMenu {
	constructor(options = {}, configPath = './menu-config.json') {
		// Handle both old and new constructor patterns
		if (  options && 
			  typeof options === 'object' && 
			  !Array.isArray(options) && 
			  (options.menu || options.config || options.load || options.add || options.cfg || options.warnings)) {
			// New fancy pattern: new ConsoleMenu({menu: './menu.json', config: './config.json', load: ['.env']})
			const {
				menu,
				config = './menu-config.json',
				load = [],
				add = {},
				isSuppressWarnings = options.warnings === false,
				cfg = null,
				validate = true
			} = options;

			// Load menu from file or use provided menu data
			if (typeof menu === 'string') {
				console.log(`📂 Loading menu from: ${menu}`);
				this.menuData = JSON.parse(fs.readFileSync(menu, 'utf8'));
			} else {
				this.menuData = menu || { root: [] };

			}

			this.isSuppressWarnings = isSuppressWarnings || false;
			this.currentMenu = 'root';
			this.menuHistory = [];
			this.running = true;

			// Use provided ConfigManager or create a new one
			if (cfg) {
				console.log(`🔗 Using provided ConfigManager`);
				this.configManager = cfg;
			} else {
				// Create ConfigManager first, then load and add to existing config
				this.configManager = new ConfigManager(config);

				// Auto-load environment files into existing config
				if (Array.isArray(load)) {
					load.forEach(envFile => {
						console.log(`🔄 Auto-loading: ${envFile}`);
						this.configManager.loadEnvFile(envFile);
					});
				} else if (load) {
					console.log(`🔄 Auto-loading: ${load}`);
					this.configManager.loadEnvFile(load);
				}

				// Auto-add variables to existing config
				Object.entries(add).forEach(([key, value]) => {
					const values = Array.isArray(value) ? value : [value];
					ColorConsole.print(`@x0A➕ Auto-adding variable: @x0F${key} @x07= @x0F[${values.join(', ')}]`);
					this.configManager.addVariable(key, values);
				});
			}

			// Store validation flag for later
			this.shouldValidate = validate;
		} else {
			// Old pattern: new ConsoleMenu(menuData, configPath)
			this.menuData = options || { root: [] };
			this.currentMenu = 'root';
			this.menuHistory = [];
			this.running = true;
			this.configManager = new ConfigManager(configPath);

			// Store validation flag for later
			this.shouldValidate = true;
		}
	}

	static new(menuData, configPath) {
		// Support fancy constructor in static method too
		if (typeof menuData === 'object' && (menuData.menu || menuData.config || menuData.load || menuData.add || menuData.cfg)) {
			return new ConsoleMenu(menuData);
		}
		return new ConsoleMenu(menuData, configPath);
	}


	displayMenu() {
		console.clear();
		ColorConsole.print(`\n@x0C=== @x0F${this.getMenuTitle(this.currentMenu)} @x0C===\n`);

		const menuItems = this.menuData[this.currentMenu];
		if (!menuItems) {
			ColorConsole.print("@x4CError: Menu not found!");
			return;
		}

		menuItems.forEach((item, index) => {
			const [name, type, command] = item;
			let icon;
			switch (type) {
				case 'menu': 
					icon = '📁'; 
					break;
				case 'debug': 
					icon = '🐛'; 
					break;
				default: 
					icon = '⚡';
			}
			ColorConsole.print(`@X0B${index + 1}@x08. @X0F${icon} ${name}`);
		});

		ColorConsole.print("\n@x08 0. Go Back");
		ColorConsole.print("\n@x0EEnter your choice (number): ");
	}

	getMenuTitle(menuName) {
		if (menuName === 'root') return 'Main Menu';

		// Convert camelCase to Title Case
		return menuName
			.replace(/([A-Z])/g, ' $1')
			.replace(/^./, str => str.toUpperCase())
			.replace(/Menu$/, ' Menu');
	}

	extractVariables(command) {
		const regex = /\$\{([^}]+)\}/g;
		const variables = [];
		let match;

		while ((match = regex.exec(command)) !== null) {
			if (!variables.includes(match[1])) {
				variables.push(match[1]);
			}
		}

		return variables;
	}

	async substituteVariables(command) {
		const variables = this.extractVariables(command);
		let processedCommand = command;

		for (const varName of variables) {
			const value = await this.configManager.promptForVariable(varName);
			if (value !== null) {
				processedCommand = processedCommand.replace(
					new RegExp(`\\$\\{${varName}\\}`, 'g'),
					value
				);
			} else {
				console.log(`⚠️  No value provided for variable: ${varName}`);
				return null;
			}
		}

		return processedCommand;
	}

	isInteractiveCommand(command) {
		const interactivePatterns = [
			/npx supabase login/,
			/npx supabase link/,
			/npx supabase projects list/,
			/supabase login/,
			/supabase link/,
			/git commit/,
			/npm login/,
			/sudo\s+/,
			/passwd/,
			/ssh\s+[^-]/,  // ssh without options (interactive)
			/mysql\s+.*-p(?:\s|$)/,  // mysql with password prompt
			/psql\s+.*-W/,  // postgresql with password prompt
			/nano\s+/,
			/vim\s+/,
			/emacs\s+/,
			/less\s+/,
			/more\s+/,
			/read\s+/,  // bash read command
			/python3?\s*$/,  // python REPL
			/node\s*$/,  // node REPL
			/irb\s*$/   // ruby REPL
		];

		return interactivePatterns.some(pattern => pattern.test(command));
	}

	async executeInteractiveCommand(command) {
		ColorConsole.print(`\n@x03Executing interactive command: @x0F${command}`);
		ColorConsole.print("@x09🔄 Handing control to interactive session...\n");

		return new Promise((resolve) => {
			// Completely close our readline interface to release stdin
			cli.close();

			// Create a new readline interface after the command completes
			const createNewRL = () => {
				return cli.recreate();
			};

			// Execute the command with full terminal control
			// Ensure we're in the parent directory for Supabase commands
			const isSupabaseCommand = /supabase/.test(command);
			const workingDir = isSupabaseCommand ?
				path.resolve(process.cwd(), '..') :
				process.cwd();

			const child = spawn(command, {
				stdio: 'inherit',
				shell: true,
				env: { ...process.env },
				cwd: workingDir
			});

			child.on('close', (code) => {
				// Create new readline interface
				createNewRL();

				ColorConsole.print(`\n@x0A✅ Command completed with exit code: ${code}`);
				ColorConsole.print("\n@x08Press Enter to continue...");

				cli.question('').then(() => {
					resolve();
				});
			});

			child.on('error', (error) => {
				// Create new readline interface
				createNewRL();

				ColorConsole.print(`@x4C❌ Error running interactive command: ${error.message}`);
				ColorConsole.print("\n@x08Press Enter to continue...");

				cli.question('').then(() => {
					resolve();
				});
			});
		});
	}

	async executeCommand(command) {
		if (command === 'quit') {
			ColorConsole.print("\n@x06Goodbye! 👋");
			this.running = false;
			cli.close();
			return;
		}

		// Check for variables and substitute them
		const processedCommand = await this.substituteVariables(command);
		if (processedCommand === null) {
			ColorConsole.print("@x4CCommand cancelled due to missing variables.");
			ColorConsole.print("\n@x08Press Enter to continue...");
			await cli.question('');
			return;
		}

		// Check if this is an interactive command
		if (this.isInteractiveCommand(processedCommand)) {
			await this.executeInteractiveCommand(processedCommand);
			return;
		}

		// Start spinner for command execution
		const spinner = ColorConsole.print(`@x03Executing: @x0F${processedCommand} @x03${'\${spinner}'}`);

		return new Promise((resolve) => {
			// Ensure proper working directory for Supabase commands
			const isSupabaseCommand = /supabase/.test(processedCommand);
			const workingDir = isSupabaseCommand ?
				path.resolve(process.cwd(), '..') :
				process.cwd();

			exec(processedCommand, { cwd: workingDir }, (error, stdout, stderr) => {
				spinner.stopSpinner(); // Stop the spinner first
				
				if (error) {
					ColorConsole.print(`@x4C❌ Error: ${error.message}`);
				} else if (stderr) {
					ColorConsole.print(`@x6E⚠️  Warning: ${stderr}`);
				} else {
					ColorConsole.print(`@x07${stdout}`);
				}

				ColorConsole.print("\n@x08Press Enter to continue...");
				cli.question('').then(() => {
					resolve();
				});
			});
		});
	}

	navigateToMenu(menuName) {
		if (menuName === 'back' || menuName === '' || !menuName) {
			if (this.menuHistory.length > 0) {
				this.currentMenu = this.menuHistory.pop();
			}
		} else if (this.menuData[menuName]) {
			this.menuHistory.push(this.currentMenu);
			this.currentMenu = menuName;
		} else {
			console.log(`Error: Menu '${menuName}' not found!`);
		}
	}

	async handleChoice(choice) {
		const menuItems = this.menuData[this.currentMenu];

		// Handle empty input
		if (!choice || choice.trim() === '') {
			ColorConsole.print("@x06Please enter a valid choice.");
			ColorConsole.print("@x08Press Enter to continue...");
			await cli.question('');
			return;
		}

		const choiceNum = parseInt(choice);

		if (choiceNum === 0) {
			this.navigateToMenu('back');
			return;
		}

		// Check for NaN and out of bounds
		if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > menuItems.length) {
			ColorConsole.print("@x4CInvalid choice! Please try again.");
			ColorConsole.print("@x08Press Enter to continue...");
			await cli.question('');
			return;
		}

		const [name, type, command] = menuItems[choiceNum - 1];

		if (type === 'menu') {
			this.navigateToMenu(command);
		} else if (type === 'exec') {
			await this.executeCommand(command);
		} else if (type === 'debug') {
			await this.executeDebug(command);
		}
	}

	async validateMenuStructure() {
		console.log("🔍 Validating menu structure...");

		// Check if menuData exists and is an object
		if (!this.menuData || typeof this.menuData !== 'object') {
			throw new MenuValidationError("Menu data must be a non-null object");
		}

		// Check if root menu exists
		if (!this.menuData.root) {
			throw new MenuValidationError("Menu structure must have a 'root' menu");
		}

		const errors = [];
		const warnings = [];
		const menuNames = Object.keys(this.menuData);
		const referencedMenus = new Set();
		const allVariables = new Set();
		const duplicateVariables = new Set();

		// Validate each menu
		for (const [menuName, menuItems] of Object.entries(this.menuData)) {
			this.validateMenu(menuName, menuItems, errors, warnings, referencedMenus, allVariables, duplicateVariables);
		}

		// Check for unreferenced menus (except root)
		for (const menuName of menuNames) {
			if (menuName !== 'root' && !referencedMenus.has(menuName)) {
				warnings.push(`Menu '${menuName}' is defined but never referenced`);
			}
		}

		// Check for missing menu references
		for (const referencedMenu of referencedMenus) {
			if (!menuNames.includes(referencedMenu)) {
				errors.push(`Menu '${referencedMenu}' is referenced but not defined`);
			}
		}

		// Check for circular references
		this.checkCircularReferences(errors);

		// Report duplicate variables
		if (duplicateVariables.size > 0) {
			warnings.push(`Duplicate variables found: ${[...duplicateVariables].join(', ')}`);
		}

		// Display results
		if (warnings.length > 0 && !this.isSuppressWarnings) { 
			console.log("⚠️  Menu validation warnings\n");
			console.log("This could be desired behavior:\n     These variables are duplicated. to ignore this warning add { warnings: false } to the menu constructor\n");
			warnings.forEach(warning => console.log(`  - ${warning}`));
			console.log("\nPress Enter to continue...");
			await cli.question('');
		}

		if (errors.length > 0) {
			console.log("❌ Menu validation errors:");
			errors.forEach(error => console.log(`  - ${error}`));
			throw new MenuValidationError(`Menu structure validation failed with ${errors.length} error(s)`);
		}

		console.log(`✅ Menu structure validated successfully (${menuNames.length} menus, ${allVariables.size} unique variables)`);
	}

	validateMenu(menuName, menuItems, errors, warnings, referencedMenus, allVariables, duplicateVariables) {
		if (!Array.isArray(menuItems)) {
			errors.push(`Menu '${menuName}' must be an array`);
			return;
		}

		if (menuItems.length === 0) {
			warnings.push(`Menu '${menuName}' is empty`);
		}

		menuItems.forEach((item, index) => {
			this.validateMenuItem(menuName, item, index, errors, warnings, referencedMenus, allVariables, duplicateVariables);
		});
	}

	validateMenuItem(menuName, item, index, errors, warnings, referencedMenus, allVariables, duplicateVariables) {
		if (!Array.isArray(item) || item.length !== 3) {
			errors.push(`Menu '${menuName}' item ${index}: must be an array with exactly 3 elements [name, type, command]`);
			return;
		}

		const [name, type, command] = item;

		// Validate name
		if (typeof name !== 'string' || name.trim() === '') {
			errors.push(`Menu '${menuName}' item ${index}: name must be a non-empty string`);
		}

		// Validate type
		if (!['menu', 'exec', 'debug'].includes(type)) {
			errors.push(`Menu '${menuName}' item ${index}: type must be 'menu', 'exec', or 'debug', got '${type}'`);
		}

		// Validate command
		if (typeof command !== 'string' || command.trim() === '') {
			errors.push(`Menu '${menuName}' item ${index}: command must be a non-empty string`);
		}

		// Track menu references
		if (type === 'menu' && command !== 'root') {
			referencedMenus.add(command);
		}

		// Check for variables in exec commands
		if (type === 'exec') {
			const variables = this.extractVariables(command);
			variables.forEach(variable => {
				if (allVariables.has(variable)) {
					duplicateVariables.add(variable);
				} else {
					allVariables.add(variable);
				}
			});
		}

		// Special validation for quit command
		if (type === 'exec' && command === 'quit' && name.toLowerCase() !== 'quit') {
			warnings.push(`Menu '${menuName}' item ${index}: 'quit' command should probably be named 'Quit'`);
		}
	}

	checkCircularReferences(errors) {
		const visited = new Set();
		const recursionStack = new Set();

		const hasCircularRef = (menuName, path = []) => {
			if (recursionStack.has(menuName)) {
				// Only report as circular if it's not a simple back navigation
				const isBackNavigation = path.length === 2 && path[0] === menuName;
				if (!isBackNavigation) {
					errors.push(`Circular menu reference detected: ${[...path, menuName].join(' → ')}`);
					return true;
				}
				return false;
			}

			if (visited.has(menuName) && path.length > 0) {
				return false;
			}

			visited.add(menuName);
			recursionStack.add(menuName);

			const menuItems = this.menuData[menuName] || [];
			for (const item of menuItems) {
				if (item[1] === 'menu' && item[2] !== 'root' && item[2] !== '') {
					if (hasCircularRef(item[2], [...path, menuName])) {
						recursionStack.delete(menuName);
						return true;
					}
				}
			}

			recursionStack.delete(menuName);
			return false;
		};

		// Only check from root to avoid false positives with back navigation
		hasCircularRef('root');
	}

	async executeDebug(debugType) {
		ColorConsole.print(`\n@x0D🐛 Debug: @x0F${debugType}`);
		ColorConsole.print("@x03═".repeat(50));

		switch (debugType.toLowerCase()) {
			case 'vars':
			case 'variables':
				this.debugVariables();
				break;
			case 'config':
				this.debugConfig();
				break;
			case 'env':
			case 'environment':
				this.debugEnvironment();
				break;
			case 'menu':
				this.debugMenu();
				break;
			case 'all':
				this.debugVariables();
				ColorConsole.print("\n@x03" + "─".repeat(30));
				this.debugConfig();
				ColorConsole.print("\n@x03" + "─".repeat(30));
				this.debugEnvironment();
				ColorConsole.print("\n@x03" + "─".repeat(30));
				this.debugMenu();
				break;
			default:
				ColorConsole.print(`@x4C❌ Unknown debug type: ${debugType}`);
				ColorConsole.print("@x07Available debug types: vars, config, env, menu, all");
		}

		ColorConsole.print("\n@x08Press Enter to continue...");
		await cli.question('');
	}

	debugVariables() {
		ColorConsole.print("@x09📋 Configuration Variables:");
		this.configManager.listVariables();
	}

	debugConfig() {
		ColorConsole.print("@x0E⚙️  Configuration Details:");
		ColorConsole.print(`@x07  Config file: @x0F${this.configManager.configPath}`);
		ColorConsole.print(`@x07  Variables count: @x0F${Object.keys(this.configManager.config).length}`);
		ColorConsole.print(`@x07  Config exists: @x0F${fs.existsSync(this.configManager.configPath)}`);
	}

	debugEnvironment() {
		ColorConsole.print("@x0A🌍 Environment Information:");
		ColorConsole.print(`@x07  Working directory: @x0F${process.cwd()}`);
		ColorConsole.print(`@x07  Node version: @x0F${process.version}`);
		ColorConsole.print(`@x07  Platform: @x0F${process.platform}`);
		ColorConsole.print(`@x07  Architecture: @x0F${process.arch}`);

		const relevantEnvVars = Object.entries(process.env)
			.filter(([key]) => key.includes('SUPA') || key.includes('NODE') || key.includes('PATH'))
			.slice(0, 5);

		if (relevantEnvVars.length > 0) {
			ColorConsole.print("@x07  Key environment variables:");
			relevantEnvVars.forEach(([key, value]) => {
				const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
				ColorConsole.print(`@x08    ${key}=@x0F${displayValue}`);
			});
		}
	}

	debugMenu() {
		ColorConsole.print("@x09📁 Menu Structure:");
		ColorConsole.print(`@x07  Current menu: @x0F${this.currentMenu}`);
		ColorConsole.print(`@x07  Menu history: @x0F[${this.menuHistory.join(' → ')}]`);
		ColorConsole.print(`@x07  Available menus: @x0F${Object.keys(this.menuData).join(', ')}`);
		ColorConsole.print(`@x07  Current menu items: @x0F${this.menuData[this.currentMenu]?.length || 0}`);
	}

}

// Export classes for use as modules

// ES module - use via import in your scripts