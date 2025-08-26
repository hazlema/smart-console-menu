# Smart Console Menu API Reference

A powerful, interactive console menu system for Node.js applications with variable substitution, configuration management, and validation.

## Table of Contents

- [Quick Start](#quick-start)
- [Classes](#classes)
  - [ConsoleMenu](#consolemenu)
  - [ConfigManager](#configmanager)
  - [MenuValidationError](#menuvalidationerror)
- [Menu Structure](#menu-structure)
- [Variable System](#variable-system)
- [Configuration Management](#configuration-management)
- [Validation](#validation)
- [Error Handling](#error-handling)

## Quick Start

```javascript
import { ConsoleMenu } from 'smart-console-menu';

// Simple menu
new ConsoleMenu({
  menu: {
    root: [
      ["List Files", "exec", "ls -la"],
      ["Show Date", "exec", "date"],
      ["Quit", "exec", "quit"]
    ]
  }
}).exec();
```

## Classes

### ConsoleMenu

The main class for creating and managing console menus.

#### Constructor

```javascript
new ConsoleMenu(options, configPath?)
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options` | `Object\|MenuData` | `{}` | Menu configuration or legacy menu data |
| `configPath` | `string` | `'./menu-config.json'` | Path to config file (legacy) |

**Options Object:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `menu` | `Object\|string` | `{ root: [] }` | Menu structure or path to menu JSON file |
| `config` | `string` | `'./menu-config.json'` | Configuration file path |
| `load` | `string\|string[]` | `[]` | Environment files to auto-load |
| `add` | `Object` | `{}` | Variables to auto-add |
| `warnings` | `boolean` | `true` | Show validation warnings |
| `cfg` | `ConfigManager` | `null` | Pre-configured ConfigManager instance |
| `validate` | `boolean` | `true` | Enable menu validation |

#### Methods

##### `exec()` → `Promise<ConsoleMenu>`

Starts the menu system and returns a promise that resolves when the menu exits.

```javascript
const menu = new ConsoleMenu(options);
await menu.exec();
```

##### `run()` → `Promise<ConsoleMenu>`

Alias for `exec()`.

##### `displayMenu()`

Displays the current menu to the console.

##### `handleChoice(choice)` → `Promise<void>`

Processes user menu selection.

##### `executeCommand(command)` → `Promise<void>`

Executes a shell command with variable substitution.

##### `navigateToMenu(menuName)`

Navigates to a different menu.

##### `validateMenuStructure()` → `Promise<void>`

Validates the menu structure and displays warnings/errors.

##### `extractVariables(command)` → `string[]`

Extracts variable names from a command string.

```javascript
menu.extractVariables("cat ${file}"); // Returns: ["file"]
```

#### Static Methods

##### `ConsoleMenu.new(menuData, configPath?)` → `ConsoleMenu`

Alternative constructor supporting both patterns.

### ConfigManager

Manages configuration variables and environment loading.

#### Constructor

```javascript
new ConfigManager(options?)
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options` | `string\|Object` | `{}` | Config file path or options object |

**Options Object:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `file` | `string` | `'./menu-config.json'` | Configuration file path |
| `load` | `string\|string[]` | `[]` | Environment files to auto-load |
| `add` | `Object` | `{}` | Variables to auto-add |

#### Methods

##### `promptForVariable(varName)` → `Promise<string|null>`

Prompts user for variable value with history.

##### `addVariable(varName, initialValues?)` → `boolean`

Adds a new variable to configuration.

##### `removeVariable(varName)` → `boolean`

Removes a variable from configuration.

##### `addVariableValue(varName, value)`

Adds/updates a variable value and saves configuration.

##### `getVariableOptions(varName)` → `string[]`

Gets available options for a variable.

##### `loadEnvFile(envPath?)` → `boolean`

Loads variables from environment file.

##### `listVariables()` → `Object`

Lists all configured variables.

##### `clearConfig()`

Clears all configuration data.

##### `exportConfig(outputPath)` → `boolean`

Exports configuration to a file.

### MenuValidationError

Custom error class for menu validation failures.

```javascript
try {
  await menu.validateMenuStructure();
} catch (error) {
  if (error instanceof MenuValidationError) {
    console.log("Menu validation failed:", error.message);
  }
}
```

## Menu Structure

Menus are defined as JavaScript objects with named menu sections:

```javascript
{
  "root": [
    ["Menu Item Name", "type", "command"]
  ],
  "submenu": [
    ["Another Item", "exec", "ls"]
  ]
}
```

### Menu Item Types

| Type | Description | Command |
|------|-------------|---------|
| `exec` | Execute shell command | Shell command string |
| `menu` | Navigate to submenu | Menu name |
| `debug` | Debug information | Debug type (`vars`, `config`, `env`, `menu`, `all`) |

### Special Commands

- `quit` - Exits the menu system
- `${variable}` - Variable substitution in commands

## Variable System

Variables are substituted in commands using `${variableName}` syntax.

### Variable Features

- **History**: Recent values are remembered
- **Autocomplete**: Choose from previous values or enter new ones
- **Persistence**: Variables are saved to configuration file
- **Environment Loading**: Auto-load from `.env` files

### Example

```javascript
// Command with variable
["Edit File", "exec", "nano ${filename}"]

// User will be prompted:
// 📝 Variable: filename
// Recent values:
// 1. config.json
// 2. package.json
// 3. Enter new value
```

## Configuration Management

### Auto-loading Environment Files

```javascript
new ConsoleMenu({
  config: './my-config.json',
  load: ['.env', '.env.local'],
  menu: { /* ... */ }
});
```

### Auto-adding Variables

```javascript
new ConsoleMenu({
  add: {
    server: ['localhost', '192.168.1.100'],
    port: ['3000', '8080']
  },
  menu: { /* ... */ }
});
```

### Configuration File Format

```json
{
  "filename": ["config.json", "package.json"],
  "server": ["localhost", "staging.example.com"],
  "port": ["3000", "8080", "80"]
}
```

## Validation

Menu validation occurs automatically and checks for:

### Errors (Will prevent menu from running)
- Missing root menu
- Invalid menu structure
- Invalid menu item format
- Missing referenced menus
- Circular menu references

### Warnings (Displayed but allow menu to run)
- Duplicate variables across commands
- Empty menus
- Unreferenced menus
- Inconsistent quit command naming

### Controlling Validation

```javascript
// Disable warnings
new ConsoleMenu({
  warnings: false,
  menu: { /* ... */ }
});

// Disable all validation
new ConsoleMenu({
  validate: false,
  menu: { /* ... */ }
});
```

## Error Handling

### Interactive Commands

Commands detected as interactive are handled specially:

```javascript
// These commands get full terminal control
["SSH to Server", "exec", "ssh user@${server}"]
["Edit Config", "exec", "nano ${file}"]
["Database Shell", "exec", "mysql -u root -p"]
```

### Command Execution Errors

```javascript
// Errors are displayed but don't crash the menu
["Risky Command", "exec", "rm nonexistent-file"]
// Shows: ❌ Error: rm: cannot remove 'nonexistent-file': No such file or directory
// User can press Enter to continue
```

### Menu Navigation

```javascript
// Built-in navigation
["Back to Main", "menu", "root"]      // Go to root menu
["", "menu", ""]                      // Go back (same as option 0)
```

## Complete Example

```javascript
import { ConsoleMenu, ConfigManager } from 'smart-console-menu';

// Advanced setup with all features
const config = new ConfigManager({
  file: './dev-config.json',
  load: ['.env.local', '.env'],
  add: {
    server: ['localhost', 'staging'],
    port: ['3000', '8080']
  }
});

const menu = new ConsoleMenu({
  cfg: config,
  warnings: true,
  menu: {
    root: [
      ["🚀 Deploy", "menu", "deploy"],
      ["🔧 Development", "menu", "dev"],
      ["📊 Debug Info", "debug", "all"],
      ["❌ Quit", "exec", "quit"]
    ],
    deploy: [
      ["Deploy to ${server}", "exec", "npm run deploy --server=${server}"],
      ["Check Status", "exec", "curl -f http://${server}:${port}/health"],
      ["View Logs", "exec", "ssh ${user}@${server} 'tail -f /var/log/app.log'"],
      ["🔙 Back", "menu", "root"]
    ],
    dev: [
      ["Start Dev Server", "exec", "npm run dev --port=${port}"],
      ["Run Tests", "exec", "npm test"],
      ["Build Project", "exec", "npm run build"],
      ["🔙 Back", "menu", "root"]
    ]
  }
});

// Start the menu
await menu.exec();
```

## Migration from Legacy API

### Old Style (Still Supported)
```javascript
const menu = new ConsoleMenu(menuData, './config.json');
```

### New Style (Recommended)
```javascript
const menu = new ConsoleMenu({
  menu: menuData,
  config: './config.json'
});
```