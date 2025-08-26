#!/usr/bin/env node

import readline from 'readline';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
                    console.log(`🔄 Auto-loading: ${envFile}`);
                    this.loadEnvFile(envFile);
                });
            } else if (load) {
                console.log(`🔄 Auto-loading: ${load}`);
                this.loadEnvFile(load);
            }
            
            // Auto-add variables to existing config
            Object.entries(add).forEach(([key, value]) => {
                const values = Array.isArray(value) ? value : [value];
                console.log(`➕ Auto-adding variable: ${key} = [${values.join(', ')}]`);
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
            
            const choice = await new Promise(resolve => {
                rl.question('', resolve);
            });
            
            const choiceNum = parseInt(choice);
            if (choiceNum >= 1 && choiceNum <= options.length) {
                const selectedValue = options[choiceNum - 1];
                this.addVariableValue(varName, selectedValue);
                return selectedValue;
            }
            
            // If not a valid number or chose "new value", fall through to input
            if (choiceNum === options.length + 1 || isNaN(choiceNum)) {
                console.log('Enter new value:');
                const newValue = await new Promise(resolve => {
                    rl.question('', resolve);
                });
                if (newValue.trim()) {
                    this.addVariableValue(varName, newValue);
                    return newValue;
                }
            }
        } else {
            console.log('Enter value:');
            const value = await new Promise(resolve => {
                rl.question('', resolve);
            });
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

const menuStructure = {
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
        ["Back to Main Menu", "menu", "root"]
    ],
    textMenu: [
        ["Count Lines in Files", "menu", "countMenu"],
        ["Search Text", "menu", "searchMenu"],
        ["Back to Main Menu", "menu", "root"]
    ],
    countMenu: [
        ["Count JS files", "exec", "find . -name '*.js' | wc -l"],
        ["Count all files", "exec", "find . -type f | wc -l"],
        ["Back to Main Menu", "menu", "root"]
    ],
    searchMenu: [
        ["Search for TODO comments", "exec", "grep -r 'TODO' . || echo 'No TODO comments found'"],
        ["Search for console.log", "exec", "grep -r 'console.log' . || echo 'No console.log found'"],
        ["Back to Main Menu", "menu", "root"]
    ]
};

export class MenuValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MenuValidationError';
    }
}

export class ConsoleMenu {
    constructor(options = {}, configPath = './menu-config.json') {
        // Handle both old and new constructor patterns
        if (options && typeof options === 'object' && !Array.isArray(options) && (options.menu || options.config || options.load || options.add || options.cfg)) {
            // New fancy pattern: new ConsoleMenu({menu: './menu.json', config: './config.json', load: ['.env']})
            const { 
                menu, 
                config = './menu-config.json', 
                load = [], 
                add = {},
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
                    console.log(`➕ Auto-adding variable: ${key} = [${values.join(', ')}]`);
                    this.configManager.addVariable(key, values);
                });
            }
            
            // Validate menu structure on construction
            if (validate) {
                this.validateMenuStructure();
            }
        } else {
            // Old pattern: new ConsoleMenu(menuData, configPath)
            this.menuData = options || { root: [] };
            this.currentMenu = 'root';
            this.menuHistory = [];
            this.running = true;
            this.configManager = new ConfigManager(configPath);
            
            // Validate menu structure on construction
            this.validateMenuStructure();
        }
    }

    static new(menuData, configPath) {
        // Support fancy constructor in static method too
        if (typeof menuData === 'object' && (menuData.menu || menuData.config || menuData.load || menuData.add || menuData.cfg)) {
            return new ConsoleMenu(menuData);
        }
        return new ConsoleMenu(menuData, configPath);
    }

    async exec() {
        console.log("🚀 Console Menu System Started!");
        
        while (this.running) {
            this.displayMenu();
            
            const choice = await new Promise(resolve => {
                rl.question('', resolve);
            });

            await this.handleChoice(choice);
        }
        
        return this;
    }

    displayMenu() {
        console.clear();
        console.log(`\n=== ${this.getMenuTitle(this.currentMenu)} ===\n`);
        
        const menuItems = this.menuData[this.currentMenu];
        if (!menuItems) {
            console.log("Error: Menu not found!");
            return;
        }

        menuItems.forEach((item, index) => {
            const [name, type, command] = item;
            let icon;
            switch(type) {
                case 'menu': icon = '📁'; break;
                case 'debug': icon = '🐛'; break;
                default: icon = '⚡';
            }
            console.log(`${index + 1}. ${icon} ${name}`);
        });

        console.log("\n0. Go Back");
        console.log("\nEnter your choice (number): ");
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
        console.log(`\nExecuting interactive command: ${command}`);
        console.log("🔄 Handing control to interactive session...\n");
        
        return new Promise((resolve) => {
            // Completely close our readline interface to release stdin
            rl.close();
            
            // Create a new readline interface after the command completes
            const createNewRL = () => {
                rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                return rl;
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
                const newRL = createNewRL();
                
                console.log(`\n✅ Command completed with exit code: ${code}`);
                console.log("\nPress Enter to continue...");
                
                newRL.question('', () => {
                    resolve();
                });
            });
            
            child.on('error', (error) => {
                // Create new readline interface
                const newRL = createNewRL();
                
                console.log(`❌ Error running interactive command: ${error.message}`);
                console.log("\nPress Enter to continue...");
                
                newRL.question('', () => {
                    resolve();
                });
            });
        });
    }

    async executeCommand(command) {
        if (command === 'quit') {
            console.log("\nGoodbye! 👋");
            this.running = false;
            rl.close();
            return;
        }

        // Check for variables and substitute them
        const processedCommand = await this.substituteVariables(command);
        if (processedCommand === null) {
            console.log("Command cancelled due to missing variables.");
            console.log("\nPress Enter to continue...");
            await new Promise(resolve => rl.question('', resolve));
            return;
        }

        // Check if this is an interactive command
        if (this.isInteractiveCommand(processedCommand)) {
            await this.executeInteractiveCommand(processedCommand);
            return;
        }

        console.log(`\nExecuting: ${processedCommand}\n`);
        
        return new Promise((resolve) => {
            // Ensure proper working directory for Supabase commands
            const isSupabaseCommand = /supabase/.test(processedCommand);
            const workingDir = isSupabaseCommand ? 
path.resolve(process.cwd(), '..') : 
                process.cwd();
                
            exec(processedCommand, { cwd: workingDir }, (error, stdout, stderr) => {
                if (error) {
                    console.log(`❌ Error: ${error.message}`);
                } else if (stderr) {
                    console.log(`⚠️  Warning: ${stderr}`);
                } else {
                    console.log(stdout);
                }
                
                console.log("\nPress Enter to continue...");
                rl.question('', () => {
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
            console.log("Please enter a valid choice.");
            console.log("Press Enter to continue...");
            await new Promise(resolve => rl.question('', resolve));
            return;
        }
        
        const choiceNum = parseInt(choice);

        if (choiceNum === 0) {
            this.navigateToMenu('back');
            return;
        }

        // Check for NaN and out of bounds
        if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > menuItems.length) {
            console.log("Invalid choice! Please try again.");
            console.log("Press Enter to continue...");
            await new Promise(resolve => rl.question('', resolve));
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

    validateMenuStructure() {
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
        if (warnings.length > 0) {
            console.log("⚠️  Menu validation warnings:");
            warnings.forEach(warning => console.log(`  - ${warning}`));
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
        console.log(`\n🐛 Debug: ${debugType}`);
        console.log("═".repeat(50));
        
        switch(debugType.toLowerCase()) {
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
                console.log("\n" + "─".repeat(30));
                this.debugConfig();
                console.log("\n" + "─".repeat(30));
                this.debugEnvironment();
                console.log("\n" + "─".repeat(30));
                this.debugMenu();
                break;
            default:
                console.log(`❌ Unknown debug type: ${debugType}`);
                console.log("Available debug types: vars, config, env, menu, all");
        }
        
        console.log("\nPress Enter to continue...");
        await new Promise(resolve => rl.question('', resolve));
    }
    
    debugVariables() {
        console.log("📋 Configuration Variables:");
        this.configManager.listVariables();
    }
    
    debugConfig() {
        console.log("⚙️  Configuration Details:");
        console.log(`  Config file: ${this.configManager.configPath}`);
        console.log(`  Variables count: ${Object.keys(this.configManager.config).length}`);
        console.log(`  Config exists: ${fs.existsSync(this.configManager.configPath)}`);
    }
    
    debugEnvironment() {
        console.log("🌍 Environment Information:");
        console.log(`  Working directory: ${process.cwd()}`);
        console.log(`  Node version: ${process.version}`);
        console.log(`  Platform: ${process.platform}`);
        console.log(`  Architecture: ${process.arch}`);
        
        const relevantEnvVars = Object.entries(process.env)
            .filter(([key]) => key.includes('SUPA') || key.includes('NODE') || key.includes('PATH'))
            .slice(0, 5);
        
        if (relevantEnvVars.length > 0) {
            console.log("  Key environment variables:");
            relevantEnvVars.forEach(([key, value]) => {
                const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
                console.log(`    ${key}=${displayValue}`);
            });
        }
    }
    
    debugMenu() {
        console.log("📁 Menu Structure:");
        console.log(`  Current menu: ${this.currentMenu}`);
        console.log(`  Menu history: [${this.menuHistory.join(' → ')}]`);
        console.log(`  Available menus: ${Object.keys(this.menuData).join(', ')}`);
        console.log(`  Current menu items: ${this.menuData[this.currentMenu]?.length || 0}`);
    }

    async run() {
        return this.exec();
    }
}

// Export classes for use as modules
export { menuStructure as defaultMenuStructure };

// ES module - use via import in your scripts