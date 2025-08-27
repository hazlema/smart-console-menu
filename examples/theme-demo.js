#!/usr/bin/env node

/**
 * Theme Demo - Interactive showcase of all available themes
 * 
 * This example demonstrates:
 * - Setting themes in constructor
 * - Dynamic theme switching
 * - Theme listing and management
 * - Visual comparison of all themes
 */

import { ConsoleMenu } from '../lib/console-menu.js';
import ColorConsole from '../lib/console-color.js';
import cli from '../lib/console-cli.js';

const demoMenu = {
    root: [
        ["🎨 Switch to Matrix Theme", "exec", "setTheme matrix"],
        ["🌊 Switch to Ocean Theme", "exec", "setTheme ocean"],
        ["🔥 Switch to Fire Theme", "exec", "setTheme fire"],
        ["💜 Switch to Synthwave Theme", "exec", "setTheme synthwave"],
        ["⚪ Switch to Minimal Theme", "exec", "setTheme minimal"],
        ["🏠 Back to Classic Theme", "exec", "setTheme classic"],
        ["📋 List All Themes", "debug", "themes"],
        ["🎭 Theme Showcase", "exec", "showcase"],
        ["🚀 Test Command", "exec", "echo 'This command shows how output looks in the current theme!'"],
        ["🐛 Debug Menu", "menu", "debugMenu"],
        ["❌ Quit", "exec", "quit"]
    ],
    debugMenu: [
        ["🔍 Debug Variables", "debug", "vars"],
        ["⚙️ Debug Config", "debug", "config"],
        ["🌍 Debug Environment", "debug", "env"],
        ["📁 Debug Menu", "debug", "menu"],
        ["🎨 Debug Themes", "debug", "themes"],
        ["📊 Debug All", "debug", "all"],
        ["🔙 Back", "menu", "root"]
    ]
};

// Create menu with Matrix theme to start
const menu = new ConsoleMenu({
    menu: demoMenu,
    theme: 'matrix',
    warnings: false
});

// Override executeCommand to handle custom commands
const originalExecuteCommand = menu.executeCommand.bind(menu);
menu.executeCommand = async function(command) {
    const theme = this.themeManager;
    
    if (command.startsWith('setTheme ')) {
        const themeName = command.split(' ')[1];
        const success = this.setTheme(themeName);
        
        if (success) {
            console.clear();
            ColorConsole.print(`\n${theme.getColor('success')}✨ Switched to ${themeName.toUpperCase()} theme!`);
            ColorConsole.print(`${theme.getColor('info')}Notice how all the colors changed to match the new theme.`);
            ColorConsole.print(`\n${theme.getColor('navHint')}Press Enter to continue...`);
            await cli.question('');
        } else {
            ColorConsole.print(`${theme.getColor('error')}❌ Theme '${themeName}' not found!`);
            ColorConsole.print(`\n${theme.getColor('navHint')}Press Enter to continue...`);
            await cli.question('');
        }
        return;
    }
    
    if (command === 'showcase') {
        await showThemeShowcase.call(this);
        return;
    }
    
    return originalExecuteCommand(command);
};

// Add enhanced themes debug command
const originalExecuteDebug = menu.executeDebug.bind(menu);
menu.executeDebug = async function(debugType) {
    if (debugType === 'themes') {
        const theme = this.themeManager;
        console.clear();
        
        ColorConsole.print(`\n${theme.getColor('debug')}🎨 Theme System Information`);
        ColorConsole.print(`${theme.getColor('separator')}${"═".repeat(60)}`);
        
        ColorConsole.print(`\n${theme.getColor('info')}📋 Available Themes:`);
        this.listThemes();
        
        ColorConsole.print(`\n${theme.getColor('info')}🎭 Current Theme Preview:`);
        ColorConsole.print(`${theme.getColor('titleBorder')}╭─ ${theme.getColor('titleText')}Title Text ${theme.getColor('titleBorder')}─╮`);
        ColorConsole.print(`${theme.getColor('itemBracket')}├ [${theme.getColor('itemNumber')}1${theme.getColor('itemBracket')}]: ${theme.getColor('itemText')}Menu Item Example`);
        ColorConsole.print(`${theme.getColor('itemBracket')}├ [${theme.getColor('itemNumber')}2${theme.getColor('itemBracket')}]: ${theme.getColor('itemText')}Another Menu Item`);
        ColorConsole.print(`${theme.getColor('titleBorder')}╰─────────────────────╯`);
        
        ColorConsole.print(`\n${theme.getColor('info')}💬 Message Types:`);
        ColorConsole.print(`${theme.getColor('success')}  ✅ Success: Operation completed successfully`);
        ColorConsole.print(`${theme.getColor('warning')}  ⚠️  Warning: This action may take a while`);
        ColorConsole.print(`${theme.getColor('error')}  ❌ Error: Connection failed`);
        ColorConsole.print(`${theme.getColor('info')}  ℹ️  Info: Processing command...`);
        ColorConsole.print(`${theme.getColor('debug')}  🐛 Debug: Variable count = 5`);
        
        ColorConsole.print(`\n${theme.getColor('info')}🎨 Color Codes:`);
        const currentTheme = this.getCurrentTheme();
        Object.entries(currentTheme.colors).forEach(([key, value]) => {
            ColorConsole.print(`${theme.getColor('outputText')}  ${key}: ${value}${key} (sample text)`);
        });
        
        ColorConsole.print(`\n${theme.getColor('navHint')}Press Enter to continue...`);
        await cli.question('');
        return;
    }
    
    return originalExecuteDebug(debugType);
};

// Theme showcase function
async function showThemeShowcase() {
    const themes = this.getAvailableThemes();
    const currentTheme = this.getCurrentTheme().name;
    
    console.clear();
    ColorConsole.print(`\n🎨 Theme Showcase - All ${themes.length} Available Themes\n`);
    
    for (const themeName of themes) {
        console.log("═".repeat(60));
        console.log(`🎨 ${themeName.toUpperCase()} THEME ${themeName === currentTheme ? '(CURRENT)' : ''}`);
        console.log("═".repeat(60));
        
        // Temporarily switch to show theme
        const tempMenu = new ConsoleMenu({
            menu: { root: [["Sample Item", "exec", "echo test"]] },
            theme: themeName,
            warnings: false,
            validate: false
        });
        
        const theme = tempMenu.themeManager;
        
        // Show sample menu
        ColorConsole.print(`${theme.getColor('titleBorder')}-=( ${theme.getColor('titleText')}Sample Menu${theme.getColor('titleBorder')} )=-`);
        ColorConsole.print(`${theme.getColor('itemBracket')}[${theme.getColor('itemNumber')}1${theme.getColor('itemBracket')}]: ${theme.getColor('itemText')}Deploy to Production`);
        ColorConsole.print(`${theme.getColor('itemBracket')}[${theme.getColor('itemNumber')}2${theme.getColor('itemBracket')}]: ${theme.getColor('itemText')}Database Operations`);
        ColorConsole.print(`${theme.getColor('itemBracket')}[${theme.getColor('itemNumber')}3${theme.getColor('itemBracket')}]: ${theme.getColor('itemText')}Debug Tools`);
        ColorConsole.print(`${theme.getColor('navHint')}[${theme.getColor('navHighlight')}0 ${theme.getColor('navText')}Back, ${theme.getColor('navHighlight')}Q ${theme.getColor('navText')}Quit${theme.getColor('navHint')}]`);
        
        // Show message samples
        ColorConsole.print(`${theme.getColor('success')}✅ Success message in this theme`);
        ColorConsole.print(`${theme.getColor('warning')}⚠️  Warning message in this theme`);
        ColorConsole.print(`${theme.getColor('error')}❌ Error message in this theme`);
        
        console.log("");
    }
    
    const theme = this.themeManager;
    console.log("═".repeat(60));
    ColorConsole.print(`${theme.getColor('info')}🚀 Usage:`);
    console.log("new ConsoleMenu({menu: './menu.json', theme: 'matrix'})");
    console.log("menu.setTheme('synthwave')");
    console.log("");
    ColorConsole.print(`${theme.getColor('navHint')}Press Enter to continue...`);
    await cli.question('');
}

// Start the interactive menu
async function runMenu() {
    // CRITICAL: Initialize CLI interface so prompt handler is registered
    cli.createInterface();
    
    // Welcome message
    console.log("🎨 Smart Console Menu - Interactive Theme Demo");
    console.log("═".repeat(50));
    console.log("Starting with MATRIX theme...");
    console.log("Use the menu options to switch between themes!");
    console.log("Each theme provides a complete color scheme for:");
    console.log("  • Menu titles and borders");  
    console.log("  • Item numbers and text");
    console.log("  • Navigation hints");
    console.log("  • Success/warning/error messages");
    console.log("  • Command execution output");
    console.log("  • Debug information");
    console.log("\nPress Enter to continue...");
    await cli.question('');

    if (menu.shouldValidate) {
        await menu.validateMenuStructure();
    }

    while (menu.running) {
        menu.displayMenu();
        const choice = await cli.readLine();
        
        if (choice.toLowerCase() === 'q') {
            menu.running = false;
            console.log("👋 Thanks for trying the theme demo!");
            cli.close();
            break;
        }
        
        await menu.handleChoice(choice);
    }
}

runMenu().catch(console.error);