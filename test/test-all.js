#!/usr/bin/env node

// Simple test suite for smart-console-menu
import { ConsoleMenu, ConfigManager } from '../lib/console-menu.js';
import fs from 'node:fs';

console.log("🧪 Running Smart Console Menu Test Suite...\n");

let testsRun = 0;
let testsPassed = 0;

function test(name, testFn) {
    testsRun++;
    try {
        testFn();
        console.log(`✅ ${name}`);
        testsPassed++;
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
    }
}

// Test 1: Basic menu structure validation
test("Menu structure validation", () => {
    const validMenu = {
        root: [
            ["Test Item", "exec", "echo test"],
            ["Test Menu", "menu", "testMenu"],
            ["Test Debug", "debug", "vars"]
        ],
        testMenu: [
            ["Back", "menu", "root"]
        ]
    };
    
    const menu = new ConsoleMenu(validMenu);
    if (!menu.menuData) throw new Error("Menu data not loaded");
});

// Test 2: Invalid menu structure should throw
test("Invalid menu structure rejection", () => {
    try {
        const invalidMenu = {
            // Missing root menu
            notRoot: [["Test", "exec", "echo test"]]
        };
        new ConsoleMenu(invalidMenu);
        throw new Error("Should have thrown validation error");
    } catch (error) {
        if (!error.message.includes("Menu structure must have a 'root' menu")) {
            throw error;
        }
    }
});

// Test 3: ConfigManager basic operations
test("ConfigManager basic operations", () => {
    const testConfigPath = './test-config.json';
    const config = new ConfigManager(testConfigPath);
    
    // Clean start
    if (fs.existsSync(testConfigPath)) {
        fs.unlinkSync(testConfigPath);
    }
    
    // Test adding variables
    const result = config.addVariable('testVar', ['value1', 'value2']);
    if (!result) throw new Error("Failed to add variable");
    
    // Test getting variables
    const options = config.getVariableOptions('testVar');
    if (options.length !== 2) throw new Error("Wrong number of options");
    
    // Test removing variables
    const removeResult = config.removeVariable('testVar');
    if (!removeResult) throw new Error("Failed to remove variable");
    
    // Cleanup
    if (fs.existsSync(testConfigPath)) {
        fs.unlinkSync(testConfigPath);
    }
});

// Test 4: Variable extraction
test("Variable extraction from commands", () => {
    const menu = new ConsoleMenu({ root: [] });
    const variables = menu.extractVariables("ssh ${username}@${server} 'cd ${path}'");
    
    if (variables.length !== 3) {
        throw new Error(`Expected 3 variables, got ${variables.length}`);
    }
    
    if (!variables.includes('username') || !variables.includes('server') || !variables.includes('path')) {
        throw new Error("Missing expected variables");
    }
});

// Test 5: Interactive command detection
test("Interactive command detection", () => {
    const menu = new ConsoleMenu({ root: [] });
    
    const interactiveCommands = [
        "npx supabase login",
        "ssh user@server",
        "nano file.txt",
        "mysql -u user -p database"
    ];
    
    const nonInteractiveCommands = [
        "ls -la",
        "echo hello",
        "cat file.txt"
    ];
    
    interactiveCommands.forEach(cmd => {
        if (!menu.isInteractiveCommand(cmd)) {
            throw new Error(`${cmd} should be detected as interactive`);
        }
    });
    
    nonInteractiveCommands.forEach(cmd => {
        if (menu.isInteractiveCommand(cmd)) {
            throw new Error(`${cmd} should not be detected as interactive`);
        }
    });
});

// Test 6: Environment file parsing
test("Environment file parsing", () => {
    const config = new ConfigManager('./test-env-config.json');
    
    // Create test .env file
    const testEnvContent = `# Test environment
DATABASE_URL="postgresql://localhost:5432/test"
API_KEY=test-key-123
NODE_ENV=development
QUOTED_VALUE='single quoted'`;
    
    const testEnvPath = './test.env';
    fs.writeFileSync(testEnvPath, testEnvContent);
    
    try {
        const envVars = config.parseEnvContent(testEnvContent);
        
        if (envVars.DATABASE_URL !== "postgresql://localhost:5432/test") {
            throw new Error("Failed to parse quoted DATABASE_URL");
        }
        
        if (envVars.API_KEY !== "test-key-123") {
            throw new Error("Failed to parse unquoted API_KEY");
        }
        
        if (envVars.QUOTED_VALUE !== "single quoted") {
            throw new Error("Failed to parse single quoted value");
        }
        
    } finally {
        // Cleanup
        if (fs.existsSync(testEnvPath)) fs.unlinkSync(testEnvPath);
        if (fs.existsSync('./test-env-config.json')) fs.unlinkSync('./test-env-config.json');
    }
});

// Test Results
console.log(`\n📊 Test Results: ${testsPassed}/${testsRun} tests passed`);

if (testsPassed === testsRun) {
    console.log("🎉 All tests passed!");
    process.exit(0);
} else {
    console.log("❌ Some tests failed!");
    process.exit(1);
}