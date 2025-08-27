#!/usr/bin/env node

import readline from 'readline';

class CLIManager {
	constructor() {
		this.rl = null;
		this.isActive = false;
	}

	createInterface() {
		if (!this.rl) {
			this.rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout
			});
			this.isActive = true;
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

	recreate() {
		this.close();
		return this.createInterface();
	}
}

// Export singleton instance
export default new CLIManager();