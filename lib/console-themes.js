export class MenuTheme {
	constructor(name, colors) {
		this.name = name;
		this.colors = {
			// Menu structure colors
			titleBorder: colors.titleBorder || '@X08',
			titleText: colors.titleText || '@X0F',
			
			// Menu items
			itemBracket: colors.itemBracket || '@X08',
			itemNumber: colors.itemNumber || '@X06',
			itemText: colors.itemText || '@X0F',
			
			// Navigation hints
			navHint: colors.navHint || '@x08',
			navHighlight: colors.navHighlight || '@X06',
			navText: colors.navText || '@X0F',
			
			// Input prompt
			promptText: colors.promptText || '@x0f',
			promptBracket: colors.promptBracket || '@X08',
			
			// Messages and feedback
			success: colors.success || '@x0A',
			warning: colors.warning || '@x6E',
			error: colors.error || '@x4C',
			info: colors.info || '@x03',
			debug: colors.debug || '@x0D',
			
			// Command execution
			execText: colors.execText || '@x03',
			execHighlight: colors.execHighlight || '@x0F',
			outputText: colors.outputText || '@x07',
			
			// Separators and decorative
			separator: colors.separator || '@x03',
			reset: colors.reset || '@x07'
		};
	}
}

export class ThemeManager {
	constructor() {
		this.themes = new Map();
		this.currentTheme = null;
		this.initializeDefaultThemes();
	}

	initializeDefaultThemes() {
		// Classic theme (current colors)
		this.addTheme(new MenuTheme('classic', {
			titleBorder: '@X08',
			titleText: '@X0F',
			itemBracket: '@X08',
			itemNumber: '@X06',
			itemText: '@X0F',
			navHint: '@x08',
			navHighlight: '@X06',
			navText: '@X0F',
			promptText: '@x0f',
			promptBracket: '@X08',
			success: '@x0A',
			warning: '@x6E',
			error: '@x4C',
			info: '@x03',
			debug: '@x0D',
			execText: '@x03',
			execHighlight: '@x0F',
			outputText: '@x07',
			separator: '@x03'
		}));

		// Matrix theme (green on black)
		this.addTheme(new MenuTheme('matrix', {
			titleBorder: '@x08',
			titleText: '@x20',
			itemBracket: '@x08',
			itemNumber: '@x0A',
			itemText: '@x07',
			navHint: '@x08',
			navHighlight: '@x0e',
			navText: '@x0A',
			promptText: '@x0A',
			promptBracket: '@x08',
			success: '@xFA',
			warning: '@x0E',
			error: '@x04',
			info: '@x0A',
			debug: '@x0E',
			execText: '@x0A',
			execHighlight: '@xFA',
			outputText: '@x0F',
			separator: '@x0A'
		}));

		// Synthwave theme (purple/pink/cyan)
		this.addTheme(new MenuTheme('synthwave', {
			titleBorder: '@x0D',
			titleText: '@x0D',
			itemBracket: '@x05',
			itemNumber: '@x0B',
			itemText: '@x0D',
			navHint: '@x05',
			navHighlight: '@x0B',
			navText: '@x0D',
			promptText: '@x0D',
			promptBracket: '@x05',
			success: '@x0B',
			warning: '@x0E',
			error: '@x0C',
			info: '@x0B',
			debug: '@x0D',
			execText: '@x0B',
			execHighlight: '@xFD',
			outputText: '@x0F',
			separator: '@x0D'
		}));

		// Ocean theme (blue tones)
		this.addTheme(new MenuTheme('ocean', {
			titleBorder: '@x01',
			titleText: '@x09',
			itemBracket: '@x09',
			itemNumber: '@x0B',
			itemText: '@x09',
			navHint: '@x01',
			navHighlight: '@x0B',
			navText: '@x09',
			promptText: '@x09',
			promptBracket: '@x09',
			success: '@x0B',
			warning: '@x0E',
			error: '@x04',
			info: '@x09',
			debug: '@x01',
			execText: '@x09',
			execHighlight: '@xF9',
			outputText: '@x0F',
			separator: '@x01'
		}));

		// Fire theme (red/orange/yellow)
		this.addTheme(new MenuTheme('fire', {
			titleBorder: '@x04',
			titleText: '@x0E',
			itemBracket: '@x0C',
			itemNumber: '@x0E',
			itemText: '@x0E',
			navHint: '@x04',
			navHighlight: '@x0E',
			navText: '@x0E',
			promptText: '@x0E',
			promptBracket: '@x0C',
			success: '@x0E',
			warning: '@xFE',
			error: '@xFC',
			info: '@x06',
			debug: '@x04',
			execText: '@x06',
			execHighlight: '@xFE',
			outputText: '@x0F',
			separator: '@x04'
		}));

		// Minimal theme (grayscale)
		this.addTheme(new MenuTheme('minimal', {
			titleBorder: '@x08',
			titleText: '@x0F',
			itemBracket: '@x08',
			itemNumber: '@x07',
			itemText: '@x0F',
			navHint: '@x08',
			navHighlight: '@x07',
			navText: '@x0F',
			promptText: '@x0F',
			promptBracket: '@x08',
			success: '@x0F',
			warning: '@x07',
			error: '@x08',
			info: '@x07',
			debug: '@x08',
			execText: '@x07',
			execHighlight: '@x0F',
			outputText: '@x0F',
			separator: '@x08'
		}));

		// Set classic as default
		this.setTheme('classic');
	}

	addTheme(theme) {
		this.themes.set(theme.name, theme);
	}

	setTheme(themeName) {
		const theme = this.themes.get(themeName);
		if (theme) {
			this.currentTheme = theme;
			return true;
		}
		return false;
	}

	getCurrentTheme() {
		return this.currentTheme;
	}

	getThemeNames() {
		return Array.from(this.themes.keys());
	}

	getColor(colorKey) {
		if (!this.currentTheme) {
			return '@x0F'; // Fallback to white
		}
		return this.currentTheme.colors[colorKey] || '@x0F';
	}
}

export default ThemeManager;