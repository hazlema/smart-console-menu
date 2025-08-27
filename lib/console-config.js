import fs from 'fs';
import ColorConsole from './console-color.js';
import cli from './console-cli.js';

export class ConfigManager {
	constructor(options = {}) {
		// Handle both old and new constructor patterns
		if (typeof options === 'string') {
			// Old pattern: new ConfigManager('./path/to/config.json')
			this.configPath = options;
			this.config = this.loadConfig();
		} else {
			// New fancy pattern: new ConfigManager({file: './config.json', load: ['.env'], add: {key: 'value'}})
			const { file = './menu-config.json', load = [], add = {} } = options;

			this.configPath = file;
			this.config = this.loadConfig();

			// Auto-load environment files into existing config
			if (Array.isArray(load)) {
				load.forEach(envFile => {
					ColorConsole.print(`@xF9🔄 Auto-loading: @xFF${envFile}`);
					this.loadEnvFile(envFile);
				});
			} else if (load) {
				ColorConsole.print(`@xF9🔄 Auto-loading: @xFF${load}`);
				this.loadEnvFile(load);
			}

			// Auto-add variables to existing config
			Object.entries(add).forEach(([key, value]) => {
				const values = Array.isArray(value) ? value : [value];
				ColorConsole.print(`@x0A➕ Auto-adding variable: @x0F${key} @x07= @x0F[${values.join(', ')}]`);
				this.addVariable(key, values);
			});
		}
	}

	loadConfig() {
		try {
			if (fs.existsSync(this.configPath)) {
				const data = fs.readFileSync(this.configPath, 'utf8');
				return JSON.parse(data);
			}
		} catch (error) {
			console.log(`Warning: Could not load config: ${error.message}`);
		}
		return {};
	}

	saveConfig() {
		try {
			fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
		} catch (error) {
			console.log(`Warning: Could not save config: ${error.message}`);
		}
	}

	getVariableOptions(varName) {
		return this.config[varName] || [];
	}

	addVariableValue(varName, value) {
		if (!this.config[varName]) {
			this.config[varName] = [];
		}

		// Add to front if new, or move to front if exists
		const existingIndex = this.config[varName].indexOf(value);
		if (existingIndex > -1) {
			this.config[varName].splice(existingIndex, 1);
		}
		this.config[varName].unshift(value);

		// Keep only last 10 values
		this.config[varName] = this.config[varName].slice(0, 10);

		this.saveConfig();
	}

	async promptForVariable(varName) {
		const options = this.getVariableOptions(varName);

		console.log(`\n📝 Variable: ${varName}`);

		if (options.length > 0) {
			console.log('\nRecent values:');
			options.forEach((option, index) => {
				console.log(`${index + 1}. ${option}`);
			});
			console.log(`${options.length + 1}. Enter new value`);
			console.log('\nSelect option or enter new value:');

			const choice = await cli.question('');

			const choiceNum = parseInt(choice);
			if (choiceNum >= 1 && choiceNum <= options.length) {
				const selectedValue = options[choiceNum - 1];
				this.addVariableValue(varName, selectedValue);
				return selectedValue;
			}

			// If not a valid number or chose "new value", fall through to input
			if (choiceNum === options.length + 1 || isNaN(choiceNum)) {
				console.log('Enter new value:');
				const newValue = await cli.question('');
				if (newValue.trim()) {
					this.addVariableValue(varName, newValue);
					return newValue;
				}
			}
		} else {
			console.log('Enter value:');
			const value = await cli.question('');
			if (value.trim()) {
				this.addVariableValue(varName, value);
				return value;
			}
		}

		return null;
	}

	// Enhanced configuration management methods
	addVariable(varName, initialValues = []) {
		if (this.config[varName]) {
			console.log(`⚠️  Variable '${varName}' already exists`);
			return false;
		}

		this.config[varName] = Array.isArray(initialValues) ? [...initialValues] : [initialValues];
		this.saveConfig();
		console.log(`✅ Added variable '${varName}' with ${this.config[varName].length} value(s)`);
		return true;
	}

	removeVariable(varName) {
		if (!this.config[varName]) {
			console.log(`⚠️  Variable '${varName}' does not exist`);
			return false;
		}

		delete this.config[varName];
		this.saveConfig();
		console.log(`✅ Removed variable '${varName}'`);
		return true;
	}

	removeVariableValue(varName, value) {
		if (!this.config[varName]) {
			console.log(`⚠️  Variable '${varName}' does not exist`);
			return false;
		}

		const index = this.config[varName].indexOf(value);
		if (index === -1) {
			console.log(`⚠️  Value '${value}' not found in variable '${varName}'`);
			return false;
		}

		this.config[varName].splice(index, 1);

		// Remove empty variable arrays
		if (this.config[varName].length === 0) {
			delete this.config[varName];
		}

		this.saveConfig();
		console.log(`✅ Removed value '${value}' from variable '${varName}'`);
		return true;
	}

	listVariables() {
		const variables = Object.keys(this.config);

		if (variables.length === 0) {
			console.log("📋 No variables configured");
			return {};
		}

		console.log(`📋 Configuration Variables (${variables.length}):`);
		console.log("─".repeat(50));

		variables.sort().forEach(varName => {
			const values = this.config[varName];
			const count = values.length;
			const preview = values.slice(0, 3).join(', ');
			const more = count > 3 ? ` (+${count - 3} more)` : '';

			console.log(`🔹 ${varName} (${count}): ${preview}${more}`);
		});

		return this.config;
	}

	loadEnvFile(envPath = '.env.local') {
		try {
			if (!fs.existsSync(envPath)) {
				console.log(`⚠️  Environment file '${envPath}' not found`);
				return false;
			}

			const envContent = fs.readFileSync(envPath, 'utf8');
			const envVars = this.parseEnvContent(envContent);

			let addedCount = 0;
			for (const [key, value] of Object.entries(envVars)) {
				if (!this.config[key]) {
					this.config[key] = [];
				}

				// Add value if it's not already in the list
				if (!this.config[key].includes(value)) {
					this.config[key].unshift(value);
					// Keep only last 10 values
					this.config[key] = this.config[key].slice(0, 10);
					addedCount++;
				}
			}

			if (addedCount > 0) {
				this.saveConfig();
				console.log(`✅ Loaded ${addedCount} variables from '${envPath}'`);
			} else {
				console.log(`ℹ️  No new variables found in '${envPath}'`);
			}

			return true;

		} catch (error) {
			console.log(`❌ Error loading env file '${envPath}': ${error.message}`);
			return false;
		}
	}

	parseEnvContent(content) {
		const envVars = {};
		const lines = content.split('\n');

		for (const line of lines) {
			const trimmed = line.trim();

			// Skip empty lines and comments
			if (!trimmed || trimmed.startsWith('#')) continue;

			// Parse KEY=VALUE format
			const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
			if (match) {
				const key = match[1];
				let value = match[2];

				// Remove quotes if present
				if ((value.startsWith('"') && value.endsWith('"')) ||
					(value.startsWith("'") && value.endsWith("'"))) {
					value = value.slice(1, -1);
				}

				envVars[key] = value;
			}
		}

		return envVars;
	}

	clearConfig() {
		this.config = {};
		this.saveConfig();
		console.log('✅ Configuration cleared');
	}

	exportConfig(outputPath) {
		try {
			const exportData = {
				configPath: this.configPath,
				timestamp: new Date().toISOString(),
				variables: this.config
			};

			fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
			console.log(`✅ Configuration exported to '${outputPath}'`);
			return true;
		} catch (error) {
			console.log(`❌ Error exporting config: ${error.message}`);
			return false;
		}
	}
}

export const menuStructure = {
	root: [
		["File Operations", "menu", "fileMenu"],
		["System Tools", "menu", "systemMenu"],
		["Text Processing", "menu", "textMenu"],
		["Show Current Directory", "exec", "pwd"],
		["List Files", "exec", "ls -la"],
		["Cat", "exec", "cat ${catFile}"],
		["Quit", "exec", "quit"]
	],
	fileMenu: [
		["Create New File", "exec", "touch ${filename} && echo 'File created: ${filename}'"],
		["Edit File", "exec", "${editor} ${filename}"],
		["View File Contents", "menu", "viewMenu"],
		["Delete Files", "menu", "deleteMenu"],
		["Back to Main Menu", "menu", "root"]
	],
	viewMenu: [
		["View package.json", "exec", "cat package.json || echo 'No package.json found'"],
		["View current directory", "exec", "ls -la"],
		["View hidden files", "exec", "ls -la | grep '^\\.'"],
		["Back to Main Menu", "menu", "root"]
	],
	deleteMenu: [
		["Delete temp files", "exec", "rm -f *.tmp && echo 'Temp files deleted'"],
		["Delete log files", "exec", "rm -f *.log && echo 'Log files deleted'"],
		["Back to Main Menu", "menu", "root"]
	],
	systemMenu: [
		["Show System Info", "exec", "uname -a"],
		["Show Disk Usage", "exec", "df -h"],
		["Show Memory Usage", "exec", "free -h"],
		["Show Running Processes", "exec", "ps aux | head -10"],
		["Connect to Server", "exec", "ssh ${username}@${serverName}"],
		["Ping Host", "exec", "ping -c 4 ${hostName}"],
	],
	textMenu: [
		["Count Lines in Files", "menu", "countMenu"],
		["Search Text", "menu", "searchMenu"],
	],
	countMenu: [
		["Count JS files", "exec", "find . -name '*.js' | wc -l"],
		["Count all files", "exec", "find . -type f | wc -l"],
	],
	searchMenu: [
		["Search for TODO comments", "exec", "grep -r 'TODO' . || echo 'No TODO comments found'"],
		["Search for console.log", "exec", "grep -r 'console.log' . || echo 'No console.log found'"],
	]
};
