# Smart Console Menu 🚀

A powerful, feature-rich console menu framework for Node.js with intelligent variable substitution, interactive command support, and built-in debugging tools.

[![npm version](https://badge.fury.io/js/smart-console-menu.svg)](https://badge.fury.io/js/smart-console-menu)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **Intelligent Variable Substitution** - Persistent variable history with smart selection
- 🔄 **Interactive Command Support** - Seamless handling of browser auth, SSH, editors, and more
- 🐛 **Built-in Debug Tools** - Instant access to configuration, environment, and menu information
- ✅ **Comprehensive Validation** - Catch menu structure errors before runtime
- 📂 **Environment Integration** - Load variables from .env files automatically
- 🎨 **Rich User Interface** - Icons, colors, and intuitive navigation
- 🔧 **Powerful Configuration** - Full CRUD operations on variables and settings

## 🚀 Quick Start

```bash
npm install smart-console-menu
```

```javascript
const { ConsoleMenu } = require('smart-console-menu');

// Option 1: Fancy Constructor with inline menu
const menu = new ConsoleMenu({
    menu: {
        root: [
            ["Deploy to Server", "exec", "ssh ${username}@${server} 'cd /app && git pull'"],
            ["Database Backup", "exec", "mysqldump -u ${dbUser} -p ${database} > backup.sql"],
            ["Debug Info", "debug", "all"],
            ["Quit", "exec", "quit"]
        ]
    },
    add: {
        username: ['admin', 'deploy'],
        server: ['production.com', 'staging.com']
    }
});

// Option 2: Fancy Constructor with menu file
const menu2 = new ConsoleMenu({
    menu: './my-menu.json',
    config: './my-config.json',
    load: ['.env.local', '.env.production'],
    add: { environment: 'production' }
});

menu.run();
```

**That's it!** The menu will:
- Remember your server names, usernames, and database names
- Handle SSH authentication properly
- Provide instant debug information
- Validate your menu structure

## 📖 Table of Contents

- [Installation](#installation)
- [Fancy Constructors](#fancy-constructors)
- [Basic Usage](#basic-usage)
- [Menu Structure](#menu-structure)
- [Variable System](#variable-system)
- [Interactive Commands](#interactive-commands)
- [Debug Menu Type](#debug-menu-type)
- [Configuration Management](#configuration-management)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## 📦 Installation

```bash
npm install smart-console-menu
```

```javascript
// ES6/CommonJS
const { ConsoleMenu, ConfigManager } = require('smart-console-menu');

// ES Modules
import { ConsoleMenu, ConfigManager } from 'smart-console-menu';
```

## ✨ Fancy Constructors

Elegant object destructuring syntax for streamlined setup with auto-loading and pre-population features.

### ConsoleMenu Fancy Constructor

Create menus with automatic environment loading and variable pre-population:

```javascript
const { ConsoleMenu } = require('smart-console-menu');

// Ultra-simple: Just provide a menu file
const menu1 = new ConsoleMenu({
    menu: './devops-menu.json'
});

// Full-featured: Everything in one elegant call
const menu2 = new ConsoleMenu({
    menu: './cli/menu.json',           // Menu structure from file
    config: './cli/settings.json',    // Custom config location
    load: ['.env.local', '.env.prod'], // Auto-load environment files
    add: {                             // Pre-populate variables
        servers: ['prod1.com', 'prod2.com'],
        environment: ['production', 'staging'],
        deployKey: 'deploy-2024'
    }
});

// Inline menu data (no file needed)
const menu3 = new ConsoleMenu({
    menu: {
        root: [
            ["Deploy", "exec", "ssh ${user}@${server} './deploy.sh'"],
            ["Status", "exec", "curl -s ${server}/health"],
            ["Quit", "exec", "quit"]
        ]
    },
    add: {
        user: ['admin', 'deploy'],
        server: ['prod.example.com']
    }
});

// Works with static new() method too
const menu4 = ConsoleMenu.new({
    menu: './menu.json',
    load: '.env'
}).exec();
```

### ConfigManager Fancy Constructor

Advanced configuration management with auto-loading and variable initialization:

```javascript
const { ConfigManager } = require('smart-console-menu');

// Simple: Just specify file location
const config1 = new ConfigManager({
    file: './my-settings.json'
});

// Advanced: Load environments and pre-populate
const config2 = new ConfigManager({
    file: './cli/config.json',         // Custom config file
    load: ['.env.local', '.env'],      // Load multiple .env files
    add: {                             // Add initial variables
        databases: ['prod_db', 'staging_db'],
        apiKeys: ['primary', 'backup'],
        timeout: '30000'
    }
});

// Auto-load single .env file
const config3 = new ConfigManager({
    file: './config.json',
    load: '.env.production'           // String for single file
});
```

### Fancy Constructor Features

#### ✅ **Backward Compatibility**
Old constructor patterns continue to work unchanged:

```javascript
// Old way - still works perfectly
const menu = new ConsoleMenu(menuData, './config.json');
const config = new ConfigManager('./settings.json');

// New way - fancy constructors
const menu2 = new ConsoleMenu({ menu: menuData, config: './config.json' });
const config2 = new ConfigManager({ file: './settings.json' });
```

#### ✅ **Auto-Loading**
Environment files are loaded during construction:

```javascript
const menu = new ConsoleMenu({
    menu: './menu.json',
    load: ['.env', '.env.local', '.env.production']  // All loaded automatically
});

// Equivalent to:
const config = new ConfigManager('./menu-config.json');
config.loadEnvFile('.env');
config.loadEnvFile('.env.local');
config.loadEnvFile('.env.production');
const menu = new ConsoleMenu(menuData, './menu-config.json');
```

#### ✅ **Pre-Population**
Variables are added with initial values during construction:

```javascript
const menu = new ConsoleMenu({
    menu: './menu.json',
    add: {
        servers: ['prod.com', 'staging.com'],
        users: ['admin', 'deploy', 'readonly'],
        port: '3000'
    }
});

// Variables are immediately available for menu commands
// No prompting needed for first use!
```

#### ✅ **Menu Source Flexibility**
Load menus from files or provide inline:

```javascript
// From file path
const menu1 = new ConsoleMenu({ menu: './devops.json' });

// Inline menu object
const menu2 = new ConsoleMenu({
    menu: {
        root: [["Test", "exec", "echo hello"]]
    }
});
```

### Real-World Example

```javascript
// Complete DevOps setup in one call
const devopsMenu = new ConsoleMenu({
    menu: './devops-menu.json',
    config: './devops-config.json',
    load: ['.env.local', '.env.production', '.env.secrets'],
    add: {
        servers: [
            'production-1.mycompany.com',
            'production-2.mycompany.com',
            'staging.mycompany.com'
        ],
        users: ['admin', 'deploy', 'monitoring'],
        databases: ['primary', 'analytics', 'cache'],
        environments: ['production', 'staging', 'development']
    }
});

await devopsMenu.run();
```

This single constructor call:
- Loads the menu structure from `devops-menu.json`
- Uses custom config file for persistence
- Automatically loads 3 environment files
- Pre-populates 4 variable categories with common values
- Ready to run with zero additional setup required!

## 🎯 Basic Usage

### Simple Menu

```javascript
const { ConsoleMenu } = require('smart-console-menu');

const simpleMenu = {
    root: [
        ["Show Date", "exec", "date"],
        ["List Files", "exec", "ls -la"],
        ["Quit", "exec", "quit"]
    ]
};

const menu = new ConsoleMenu(simpleMenu);
menu.run();
```

### With Variables

```javascript
const menuWithVars = {
    root: [
        ["Connect to Server", "exec", "ssh ${username}@${serverName}"],
        ["Backup Database", "exec", "mysqldump -u ${dbUser} -p ${database} > ${backupFile}"],
        ["Quit", "exec", "quit"]
    ]
};

// Fluent API
ConsoleMenu.new(menuWithVars).exec();
```

## 🏗️ Menu Structure

Menu items are arrays with three elements: `[name, type, command]`

### Menu Item Types

| Type | Icon | Description | Example |
|------|------|-------------|---------|
| `menu` | 📁 | Navigate to another menu | `["Submenu", "menu", "submenuName"]` |
| `exec` | ⚡ | Execute a command | `["List Files", "exec", "ls -la"]` |
| `debug` | 🐛 | Show debug information | `["Debug Variables", "debug", "vars"]` |

### Example Structure

```javascript
const menuStructure = {
    root: [
        ["File Operations", "menu", "fileMenu"],
        ["System Tools", "menu", "systemMenu"],
        ["Debug", "debug", "all"],
        ["Quit", "exec", "quit"]
    ],
    fileMenu: [
        ["Create File", "exec", "touch ${filename}"],
        ["Edit File", "exec", "${editor} ${filename}"],
        ["Back to Main Menu", "menu", "root"]
    ],
    systemMenu: [
        ["Show Processes", "exec", "ps aux | head -10"],
        ["Disk Usage", "exec", "df -h"],
        ["Back to Main Menu", "menu", "root"]
    ]
};
```

## 🔧 Variable System

Variables use `${variableName}` syntax and are automatically managed with persistent history.

### How Variables Work

1. **First Use**: Prompts user for value
2. **Subsequent Uses**: Shows recent values + option to enter new
3. **Automatic Storage**: Saves to `menu-config.json`
4. **Smart Ordering**: Most recent values appear first

### Example Variable Flow

```bash
🔧 Variable: serverName

Recent values:
1. production.example.com
2. staging.example.com
3. localhost
4. Enter new value

Select option or enter new value: 2
```

### Loading from .env Files

```javascript
const { ConfigManager } = require('smart-console-menu');

const config = new ConfigManager();
config.loadEnvFile('.env.local');  // Loads SUPABASE_URL, DATABASE_URL, etc.
```

## 🔄 Interactive Commands

Automatically detected and handled with proper terminal control:

### Supported Interactive Commands

| Pattern | Examples | Use Case |
|---------|----------|----------|
| `npx supabase login` | Authentication | Opens browser, waits for auth |
| `ssh user@server` | Remote access | Interactive login prompts |
| `nano file.txt` | Text editors | Full editor control |
| `mysql -u user -p db` | Database clients | Password prompts |
| `git commit` | Version control | Commit message editor |

### How It Works

```javascript
// This command will be detected as interactive
["Login to Supabase", "exec", "npx supabase login"]

// User gets full terminal control:
// - Browser opens for OAuth
// - Can interact with prompts
// - Returns to menu when complete
```

## 🐛 Debug Menu Type

Instant access to system information without writing debug commands.

### Debug Types

```javascript
["Show Variables", "debug", "vars"]     // All configured variables
["Show Config", "debug", "config"]      // Configuration file info
["Show Environment", "debug", "env"]    // System & environment vars
["Show Menu Info", "debug", "menu"]     // Current menu structure
["Show All", "debug", "all"]            // Comprehensive debug info
```

### Debug Output Example

```bash
🐛 Debug: vars
══════════════════════════════════════════════════
📋 Configuration Variables (3):
──────────────────────────────────────────────────
🔹 serverName (2): production.com, staging.com
🔹 username (3): admin, user, guest
🔹 database (1): myapp_production

Press Enter to continue...
```

## ⚙️ Configuration Management

Advanced configuration operations via `ConfigManager`.

### Basic Operations

```javascript
const { ConfigManager } = require('smart-console-menu');
const config = new ConfigManager();

// Add variables
config.addVariable('servers', ['prod.com', 'staging.com']);

// Remove variables
config.removeVariable('oldVariable');
config.removeVariableValue('servers', 'staging.com');

// List all variables
config.listVariables();

// Load from .env files
config.loadEnvFile('.env.production');

// Export configuration
config.exportConfig('./backup.json');
```

### Environment File Integration

```bash
# .env.local
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
DATABASE_URL="postgresql://user:pass@host:5432/db"
```

```javascript
config.loadEnvFile('.env.local');
// Now SUPABASE_URL, SUPABASE_ANON_KEY, DATABASE_URL are available as variables
```

## 📚 API Reference

### ConsoleMenu Class

#### Constructor
```javascript
// Traditional constructor (backward compatible)
new ConsoleMenu(menuData, configPath = './menu-config.json')

// Fancy constructor with object destructuring
new ConsoleMenu({
    menu: menuData | menuFilePath,       // Menu object or file path
    config?: configPath,                 // Optional config file path
    load?: envFilePath | envFileArray,   // Optional .env file(s) to load
    add?: variablesObject                // Optional variables to pre-populate
})
```

#### Static Methods
```javascript
// Traditional static method
ConsoleMenu.new(menuData, configPath)  // Fluent factory method

// Fancy static method
ConsoleMenu.new({
    menu: menuData | menuFilePath,
    config?: configPath,
    load?: envFilePath | envFileArray,
    add?: variablesObject
})
```

#### Instance Methods
```javascript
async menu.run()                       // Start menu (alias for exec)
async menu.exec()                      // Start menu execution
menu.validateMenuStructure()           // Validate menu structure
```

### ConfigManager Class

#### Constructor
```javascript
// Traditional constructor (backward compatible)
new ConfigManager(configPath = './menu-config.json')

// Fancy constructor with object destructuring
new ConfigManager({
    file?: configPath,                   // Optional config file path
    load?: envFilePath | envFileArray,   // Optional .env file(s) to load
    add?: variablesObject                // Optional variables to pre-populate
})
```

#### Variable Management
```javascript
config.addVariable(name, values)           // Add new variable
config.removeVariable(name)                // Remove variable
config.removeVariableValue(name, value)    // Remove specific value
config.getVariableOptions(name)            // Get variable values
config.listVariables()                     // List all variables
```

#### File Operations
```javascript
config.loadEnvFile(path)                   // Load .env file
config.exportConfig(path)                  // Export configuration
config.clearConfig()                       // Clear all variables
```

## 💡 Examples

### DevOps Menu
```javascript
const devOpsMenu = {
    root: [
        ["Server Management", "menu", "serverMenu"],
        ["Database Operations", "menu", "dbMenu"],
        ["Debug Tools", "menu", "debugMenu"],
        ["Quit", "exec", "quit"]
    ],
    serverMenu: [
        ["Deploy Application", "exec", "ssh ${username}@${server} 'cd /app && ./deploy.sh'"],
        ["Check Server Status", "exec", "ssh ${username}@${server} 'systemctl status ${service}'"],
        ["View Logs", "exec", "ssh ${username}@${server} 'tail -f /var/log/${logFile}'"],
        ["Back", "menu", "root"]
    ],
    dbMenu: [
        ["Create Backup", "exec", "mysqldump -u ${dbUser} -p ${database} > backup-$(date +%Y%m%d).sql"],
        ["Run Migration", "exec", "mysql -u ${dbUser} -p ${database} < ${migrationFile}"],
        ["Connect to Database", "exec", "mysql -u ${dbUser} -p ${database}"],
        ["Back", "menu", "root"]
    ],
    debugMenu: [
        ["Show Variables", "debug", "vars"],
        ["Show Environment", "debug", "env"],
        ["Show All Debug Info", "debug", "all"],
        ["Back", "menu", "root"]
    ]
};
```

### Development Workflow
```javascript
const devMenu = {
    root: [
        ["Project Setup", "menu", "setupMenu"],
        ["Development", "menu", "devMenu"],
        ["Testing", "menu", "testMenu"],
        ["Quit", "exec", "quit"]
    ],
    setupMenu: [
        ["Clone Repository", "exec", "git clone ${repoUrl} ${projectName}"],
        ["Install Dependencies", "exec", "cd ${projectName} && npm install"],
        ["Setup Environment", "exec", "cp .env.example .env.local"],
        ["Back", "menu", "root"]
    ],
    devMenu: [
        ["Start Development Server", "exec", "cd ${projectName} && npm run dev"],
        ["Run Build", "exec", "cd ${projectName} && npm run build"],
        ["Open in Editor", "exec", "${editor} ${projectName}"],
        ["Back", "menu", "root"]
    ],
    testMenu: [
        ["Run Tests", "exec", "cd ${projectName} && npm test"],
        ["Run Specific Test", "exec", "cd ${projectName} && npm test ${testFile}"],
        ["Coverage Report", "exec", "cd ${projectName} && npm run test:coverage"],
        ["Back", "menu", "root"]
    ]
};
```

## 🚨 Troubleshooting

### Common Issues

#### Variables Not Working
```javascript
// Debug variables
["Debug Variables", "debug", "vars"]

// Check configuration
["Debug Config", "debug", "config"]
```

#### Interactive Commands Hanging
- Most interactive commands are automatically detected
- For custom interactive commands, they run with full terminal control
- Use `debug env` to check environment setup

#### Menu Validation Errors
```bash
❌ Menu validation errors:
  - Menu 'root' item 1: must be an array with exactly 3 elements [name, type, command]
  - Circular menu reference detected: root → menuA → menuB → menuA
```

#### Environment Variables Missing
```javascript
// Load .env files explicitly
const config = new ConfigManager();
config.loadEnvFile('.env.local');
```

### Getting Help

1. **Use Debug Tools**: Add `["Debug All", "debug", "all"]` to any menu
2. **Check Validation**: Menu structure errors are caught automatically
3. **Inspect Variables**: Use `debug vars` to see what's configured
4. **Environment Check**: Use `debug env` to verify working directory and environment variables

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

Built with ❤️ for the Node.js community. Special thanks to all the developers who need better console menu tools!

---

**Happy Console Menu Building!** 🚀