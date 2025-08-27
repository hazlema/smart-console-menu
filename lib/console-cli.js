#!/usr/bin/env node

import readline from 'readline';
import { EventEmitter } from 'events';
import ColorConsole from './console-color.js';

class CLIManager extends EventEmitter {
	constructor() {
		super();
		this.rl = null;
		this.isActive = false;
		this.currentPrompt = '';

		// Event-driven prompt control
		this.on('prompt:set', (str = '') => this.setPrompt(str));
		this.on('prompt:show', () => this.showPrompt());
		this.on('prompt:read', async () => {
			const line = await this.readLine();
			this.emit('prompt:line', line);
		});
	}

	createInterface() {
		if (!this.rl) {
			this.rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout
			});
			this.isActive = true;
			// Register prompt handler for ColorConsole to avoid circular import usage
			ColorConsole.setPromptHandler((prompt) => {
				this.setPrompt(prompt);
				this.showPrompt();
			});
			// Bridge readline 'line' events to our emitter
			this.rl.on('line', (line) => this.emit('line', line));
		}
		return this.rl;
	}

	getInterface() {
		return this.rl || this.createInterface();
	}

	close() {
		if (this.rl) {
			this.rl.close();
			this.rl = null;
			this.isActive = false;
		}
	}

	async question(prompt = '') {
		const rl = this.getInterface();
		return new Promise(resolve => {
			rl.question(prompt, resolve);
		});
	}

	questionColored(str) {
		// Accepts color tokens like @xF2 in str and prompts without newline
		return this.question(ColorConsole.toPrompt(str));
	}

	setPrompt(prompt = '') {
		this.currentPrompt = prompt;
		const rl = this.getInterface();
		if (rl && typeof rl.setPrompt === 'function') {
			rl.setPrompt(prompt);
		}
	}

	showPrompt() {
		const rl = this.getInterface();
		if (typeof rl.setPrompt === 'function') {
			rl.setPrompt(this.currentPrompt || '');
		}
		// Force redraw of prompt even after prior output/clears
		rl.prompt(true);
	}

	readLine() {
		const rl = this.getInterface();
		return new Promise(resolve => {
			rl.once('line', resolve);
		});
	}

	onLine(handler) {
		this.on('line', handler);
		return this;
	}

	recreate() {
		this.close();
		return this.createInterface();
	}
}

// Export singleton instance
export default new CLIManager();