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
import { ConsoleMenu } from '../lib/console-menu.js';

new ConsoleMenu({
	menu: {
		root: [
			["File Menu", "menu", "fileMenu"],
			["Debug Variables", "debug", "vars"],
			["Quit", "exec", "quit"]
		],
		fileMenu: [
			["Create File", "exec", "touch ${filename} && echo 'Created: ${filename}'"],
			["List Files", "exec", "ls -la"],
			["Edit File", "exec", "${editor} ${filename}"],
		]
	}
}).exec().catch(console.error);
```

**That's it!** The menu will:
- Remember your server names, usernames, and database names
- Handle SSH authentication properly
- Provide instant debug information
- Validate your menu structure

## 📖 Table of Contents

- [Installation](#installation)
- [Fancy Constructors](#constructor)
- [Menu Structure](#mstructure)
- [Variable System](#variable-system)
- [Interactive Commands](#interactive-commands)
- [Debug Menu Type](#debug-menu-type)
- [Configuration Management](#configuration-management)
- [API Reference](./docs/API.md)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

<a id="installation"></a>
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

<a id="constructor"></a>
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

<a id="mstructure"></a>
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

<a id="variable-system"></a>
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

<a id="interactive-commands"></a>
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

<a id="debug-menu-type"></a>
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

<a id="configuration-management"></a>
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


<a id="examples"></a>
## 💡 Examples

Explore these example files to see Smart Console Menu in action:

### `basic-usage.js`
Simple demonstration of creating a menu with variable substitution and configuration management.

### `devops-workflow.js`
Complete DevOps workflow menu with server management, database operations, and debugging tools.

### `errors.js`
Demonstrates menu validation warnings for duplicate variables and how to suppress them.

### `super-dev.js`
Advanced development menu showcasing complex workflows and interactive commands.

### `cli-menu`
Executable CLI menu script for quick testing and demonstration.

### Running Examples

```bash
# Run any example directly
node examples/basic-usage.js
node examples/devops-workflow.js
node examples/errors.js

# Or make executable and run
chmod +x examples/cli-menu
./examples/cli-menu
```

<a id="troubleshooting"></a>
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