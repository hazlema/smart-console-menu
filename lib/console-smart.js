#!/usr/bin/env node

import { ConsoleMenu } from './console-menu.js';
import ColorConsole from './console-color.js';
import cli from './console-cli.js';

export default class SmartConsoleMenu extends ConsoleMenu {
	constructor(options = {}, configPath = './menu-config.json') {
		super(options, configPath);
		return this;
	}

	async start() {
		// Validate menu structure if needed
		if (this.shouldValidate) {
			await this.validateMenuStructure();
		}

		ColorConsole.print("@x0A=� Console Menu System Started!");

		while (this.running) {
			this.displayMenu();

			const choice = await cli.question('');

			await this.handleChoice(choice);
		}

		return this;
	}

	async run() {
		return this.start();
	}

	static async start(options = {}, configPath = './menu-config.json') {
		const menu = new SmartConsoleMenu(options, configPath);
		return await menu.start();
	}
}