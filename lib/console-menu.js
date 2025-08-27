#!/usr/bin/env node

import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import ColorConsole from './console-color.js';
import { ConfigManager } from './console-config.js';
import cli from './console-cli.js';
import ThemeManager from './console-themes.js';

class MenuValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'MenuValidationError';
	}
}

export class ConsoleMenu {
	constructor(options = {}, configPath = './menu-config.json') {
		// Handle both old and new constructor patterns
		if (options &&
			typeof options === 'object' &&
			!Array.isArray(options) &&
			(options.menu || options.config || options.load || options.add || options.cfg || options.warnings || options.theme)) {
			// New fancy pattern: new ConsoleMenu({menu: './menu.json', config: './config.json', load: ['.env'], theme: 'matrix'})
			const {
				menu,
				config = './menu-config.json',
				load = [],
				add = {},
				isSuppressWarnings = options.warnings === false,
				cfg = null,
				validate = true,
				theme = 'classic'
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
					// Note: themeManager isn't initialized yet, so use fallback colors
					ColorConsole.print(`@x0A➕ Auto-adding variable: @x0F${key} @x07= @x0F[${values.join(', ')}]`);
					this.configManager.addVariable(key, values);
				});
			}

			// Initialize theme manager
			this.themeManager = new ThemeManager();
			if (!this.themeManager.setTheme(theme)) {
				console.log(`⚠️  Theme '${theme}' not found, using 'classic' theme`);
				this.themeManager.setTheme('classic');
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

			// Initialize theme manager with default theme
			this.themeManager = new ThemeManager();
			this.themeManager.setTheme('classic');

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
		const theme = this.themeManager;
		ColorConsole.print(`\n${theme.getColor('titleBorder')}-=( ${theme.getColor('titleText')} ${this.getMenuTitle(this.currentMenu)} ${theme.getColor('titleBorder')} )=-\n`);

		const menuItems = this.menuData[this.currentMenu];
		if (!menuItems) {
			ColorConsole.print(`${theme.getColor('error')}Error: Menu not found!`);
			return;
		}

		menuItems.forEach((item, index) => {
			const [name, type] = item;
			let icon;
			switch (type) {
				case 'menu':
					icon = '📁';
					break;
				case 'debug':
					icon = '🐛';
					break;
				default:
					if (["quit", "exit"].includes(name.toLowerCase())) {
						icon = '⛔';
					} else {
						icon = '🏃';
					}
			}
			//ColorConsole.print(`${theme.getColor('itemBracket')}[${theme.getColor('itemNumber')}${index + 1}${theme.getColor('itemBracket')}]: ${theme.getColor('itemText')}${icon} ${name}`);
			ColorConsole.print(`${theme.getColor('itemBracket')}[${theme.getColor('itemNumber')}${index + 1}${theme.getColor('itemBracket')}]: ${theme.getColor('itemText')}${name}`);
		});

		ColorConsole.print(`\n${theme.getColor('navHint')}[${theme.getColor('navHighlight')}0 ${theme.getColor('navText')}to Go Back, ${theme.getColor('navHighlight')}Q ${theme.getColor('navText')}to quit${theme.getColor('navHint')}]`);
		ColorConsole.print(`${theme.getColor('navHint')}[${theme.getColor('promptText')}Enter your choice${theme.getColor('promptBracket')}]: ${theme.getColor('itemText')}`, { return: false });
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
		const theme = this.themeManager;
		ColorConsole.print(`\n${theme.getColor('info')}Executing interactive command: ${theme.getColor('execHighlight')}${command}`);
		ColorConsole.print(`${theme.getColor('info')}🔄 Handing control to interactive session...\n`);

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

				ColorConsole.print(`\n${theme.getColor('success')}✅ Command completed with exit code: ${code}`);
				ColorConsole.print(`\n${theme.getColor('navHint')}Press Enter to continue...`);

				cli.question('').then(() => {
					resolve();
				});
			});

			child.on('error', (error) => {
				// Create new readline interface
				createNewRL();

				ColorConsole.print(`${theme.getColor('error')}❌ Error running interactive command: ${error.message}`);
				ColorConsole.print(`\n${theme.getColor('navHint')}Press Enter to continue...`);

				cli.question('').then(() => {
					resolve();
				});
			});
		});
	}

	async executeCommand(command) {
		const theme = this.themeManager;
		
		if (command === 'quit') {
			ColorConsole.print(`\n${theme.getColor('success')}Goodbye! 👋`);
			this.running = false;
			cli.close();
			return;
		}

		// Check for variables and substitute them
		const processedCommand = await this.substituteVariables(command);
		if (processedCommand === null) {
			ColorConsole.print(`${theme.getColor('error')}Command cancelled due to missing variables.`);
			ColorConsole.print(`\n${theme.getColor('navHint')}Press Enter to continue...`);
			await cli.question('');
			return;
		}

		// Check if this is an interactive command
		if (this.isInteractiveCommand(processedCommand)) {
			await this.executeInteractiveCommand(processedCommand);
			return;
		}

		// Start spinner for command execution
		const spinner = ColorConsole.print(`${theme.getColor('info')}Executing: ${theme.getColor('execHighlight')}${processedCommand} ${theme.getColor('info')}${'\${spinner}'}`);

		return new Promise((resolve) => {
			// Ensure proper working directory for Supabase commands
			const isSupabaseCommand = /supabase/.test(processedCommand);
			const workingDir = isSupabaseCommand ?
				path.resolve(process.cwd(), '..') :
				process.cwd();

			exec(processedCommand, { cwd: workingDir }, (error, stdout, stderr) => {
				spinner.stopSpinner(); // Stop the spinner first

				if (error) {
					ColorConsole.print(`${theme.getColor('error')}❌ Error: ${error.message}`);
				} else if (stderr) {
					ColorConsole.print(`${theme.getColor('warning')}⚠️  Warning: ${stderr}`);
				} else {
					ColorConsole.print(`${theme.getColor('outputText')}${stdout}`);
				}

				ColorConsole.print(`\n${theme.getColor('navHint')}Press Enter to continue...`);
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
		const theme = this.themeManager;

		// Handle empty input
		if (!choice || choice.trim() === '') {
			ColorConsole.print(`${theme.getColor('warning')}Please enter a valid choice.`);
			ColorConsole.print(`\n${theme.getColor('navHint')}Press Enter to continue...`);
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
			ColorConsole.print(`${theme.getColor('error')}Invalid choice! Please try again.`);
			ColorConsole.print(`\n${theme.getColor('navHint')}Press Enter to continue...`);
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
		const theme = this.themeManager;
		ColorConsole.print(`\n${theme.getColor('debug')}🐛 Debug: ${theme.getColor('execHighlight')}${debugType}`);
		ColorConsole.print(`${theme.getColor('separator')}${"═".repeat(50)}`);

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
				ColorConsole.print(`\n${theme.getColor('separator')}${"─".repeat(30)}`);
				this.debugConfig();
				ColorConsole.print(`\n${theme.getColor('separator')}${"─".repeat(30)}`);
				this.debugEnvironment();
				ColorConsole.print(`\n${theme.getColor('separator')}${"─".repeat(30)}`);
				this.debugMenu();
				break;
			default:
				ColorConsole.print(`${theme.getColor('error')}❌ Unknown debug type: ${debugType}`);
				ColorConsole.print(`${theme.getColor('outputText')}Available debug types: vars, config, env, menu, all`);
		}

		ColorConsole.print(`\n${theme.getColor('navHint')}Press Enter to continue...`);
		await cli.question('');
	}

	debugVariables() {
		const theme = this.themeManager;
		ColorConsole.print(`${theme.getColor('info')}📋 Configuration Variables:`);
		this.configManager.listVariables();
	}

	debugConfig() {
		const theme = this.themeManager;
		ColorConsole.print(`${theme.getColor('info')}⚙️  Configuration Details:`);
		ColorConsole.print(`${theme.getColor('outputText')}  Config file: ${theme.getColor('execHighlight')}${this.configManager.configPath}`);
		ColorConsole.print(`${theme.getColor('outputText')}  Variables count: ${theme.getColor('execHighlight')}${Object.keys(this.configManager.config).length}`);
		ColorConsole.print(`${theme.getColor('outputText')}  Config exists: ${theme.getColor('execHighlight')}${fs.existsSync(this.configManager.configPath)}`);
	}

	debugEnvironment() {
		const theme = this.themeManager;
		ColorConsole.print(`${theme.getColor('success')}🌍 Environment Information:`);
		ColorConsole.print(`${theme.getColor('outputText')}  Working directory: ${theme.getColor('execHighlight')}${process.cwd()}`);
		ColorConsole.print(`${theme.getColor('outputText')}  Node version: ${theme.getColor('execHighlight')}${process.version}`);
		ColorConsole.print(`${theme.getColor('outputText')}  Platform: ${theme.getColor('execHighlight')}${process.platform}`);
		ColorConsole.print(`${theme.getColor('outputText')}  Architecture: ${theme.getColor('execHighlight')}${process.arch}`);

		const relevantEnvVars = Object.entries(process.env)
			.filter(([key]) => key.includes('SUPA') || key.includes('NODE') || key.includes('PATH'))
			.slice(0, 5);

		if (relevantEnvVars.length > 0) {
			ColorConsole.print(`${theme.getColor('outputText')}  Key environment variables:`);
			relevantEnvVars.forEach(([key, value]) => {
				const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
				ColorConsole.print(`${theme.getColor('navHint')}    ${key}=${theme.getColor('execHighlight')}${displayValue}`);
			});
		}
	}

	debugMenu() {
		const theme = this.themeManager;
		ColorConsole.print(`${theme.getColor('info')}📁 Menu Structure:`);
		ColorConsole.print(`${theme.getColor('outputText')}  Current menu: ${theme.getColor('execHighlight')}${this.currentMenu}`);
		ColorConsole.print(`${theme.getColor('outputText')}  Menu history: ${theme.getColor('execHighlight')}[${this.menuHistory.join(' → ')}]`);
		ColorConsole.print(`${theme.getColor('outputText')}  Available menus: ${theme.getColor('execHighlight')}${Object.keys(this.menuData).join(', ')}`);
		ColorConsole.print(`${theme.getColor('outputText')}  Current menu items: ${theme.getColor('execHighlight')}${this.menuData[this.currentMenu]?.length || 0}`);
	}

	// Theme management methods
	setTheme(themeName) {
		if (this.themeManager.setTheme(themeName)) {
			return true;
		}
		return false;
	}

	getCurrentTheme() {
		return this.themeManager.getCurrentTheme();
	}

	getAvailableThemes() {
		return this.themeManager.getThemeNames();
	}

	listThemes() {
		const theme = this.themeManager;
		const currentTheme = this.getCurrentTheme();
		const themes = this.getAvailableThemes();
		
		ColorConsole.print(`${theme.getColor('info')}🎨 Available Themes:`);
		themes.forEach(themeName => {
			const indicator = themeName === currentTheme.name ? '●' : '○';
			ColorConsole.print(`${theme.getColor('itemText')}  ${indicator} ${themeName}`);
		});
	}

}

// Export classes for use as modules

// ES module - use via import in your scripts