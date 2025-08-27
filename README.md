# Smart Console Menu: Your CLI Adventure Awaits! 🚀🍔

Hey there, terminal tamer! 👋 Welcome to **Smart Console Menu**—the Node.js CLI framework that's like a choose-your-own-adventure book, but for devs who prefer pixels over pages. Tired of bland bash scripts? This bad boy whips up interactive menus with smart variable swaps, config wizardry, and debug spells that'll make your terminal glow like a neon-lit arcade. It's got that retro geek vibe with modern JS flair—pun intended, because who doesn't love a "console"-ation prize? 😎

Whether you're orchestrating DevOps dances or just need a quick file-fiddling feast, we've got you covered. Let's geek out and get you started!

## Why Choose This Menu? (Spoiler: It's Deliciously Smart) 🍟

- **Interactive Menus on Steroids**: Navigate submenus like a pro gamer, with icons (📁 for folders, ⚡ for zaps) and back buttons that won't leave you lost in the void.
- **Variable Magic**: Prompt for inputs with history (MRU style—Most Recently Used, not a typo for "meow" 🐱), auto-load from .env files, and substitute like a regex ninja: `cat ${filename}` becomes reality without hardcoding headaches.
- **Config Superpowers**: Manage vars in JSON, add/remove like a CRUD boss, export for backups—because who wants config chaos in their code cave?
- **Interactive Command Handoff**: Run SSH, editors, or Supabase logins without stdin squabbles—hands over the terminal reins gracefully.
- **Validation Vault**: Catches menu mishaps (circular refs, missing bits) before they crash your party. Warnings? Optional, for the brave souls.
- **Debug Delights**: Peek vars, env, menus with built-in tools—because debugging should be fun, not a bug hunt in the dark.
- **Fancy Constructors**: Old-school or options-object chic? We've got compat for both, plus auto-load/add for envs and vars.
- **Geeky Goodies**: Emojis, colors (via your Wildcat-inspired hacks?), and punny logs to keep the vibes high.

Built with love in modern JS—no legacy lint here. And hey, if there's a bug? We'll squash it like Mario on a Goomba. 🐞

## Installation: Easy as Pie (or npm i) 🥧

Fire up your terminal and summon the package:

```bash
npm install smart-console-menu
```

Or yarn it up if you're feeling fibrous:

```bash
yarn add smart-console-menu
```

Pro tip: Node.js v14+ recommended—because who wants to party like it's 1999? 🎉

## Quick Start: Your First Menu Quest 🗺️

Import the heroes and launch your CLI epic:

```javascript
// basic-usage.js – Let's menu-fy!
import { ConsoleMenu, ConfigManager } from 'smart-console-menu';

const menuData = {
  root: [
    ['Show Directory', 'exec', 'ls -la'],
    ['Cat File', 'exec', 'cat ${filename}'],
    ['Quit', 'exec', 'quit']
  ]
};

const config = new ConfigManager('./menu-config.json');
const menu = new ConsoleMenu(menuData, config);
menu.start().catch(console.error);  // Beam me up, Scotty! 🚀
```

Run it: `node basic-usage.js`—bam! Navigate, input vars (with history!), and execute like a boss. If `${filename}` pops, it'll prompt smartly. Geek humor: It's like autocomplete, but for your brain cells. 🧠

Fancy mode? Load menus from JSON and envs on the fly:

```javascript
new ConsoleMenu({
  menu: './my-menu.json',
  config: './config.json',
  load: ['.env.local'],
  add: { editor: ['vim'] }
}).start();
```

## Features: The Full Buffet 🍲

### Menu Mastery 📜
- Define structures as objects: Keys are menu names, values are arrays of `[label, type ('menu'/'exec'), command/target]`.
- Auto-icons: 📁 for menus, ⚡ for execs.
- Back nav with history stack—no infinite loops here!
- Quit gracefully with 'quit' command.

### Variable Vibes 🔄
- Prompt with recent options (up to 10—configurable? TODO if you want!).
- Substitute in commands: `${varName}` → user input magic.
- Interactive check: Hands over for SSH/vim/etc without fights.

### Config Chronicles 📚
- JSON persistence: Load/save automagically.
- Env loading: Slurp .env files, parse KEY=VALUE (quotes? Handled!).
- Add/remove vars/values: Keep your configs clean and mean.

### Debug Dungeon 🐛
- Modes: vars, config, env, menu, all.
- Logs working dir, Node version, and more—geek intel at your fingertips.

### Validation Victory 🛡️
- Checks structure, circles, dups—throws if busted, warns if shady.
- Suppress warnings? `{ warnings: false }` in constructor.

## API Reference: The Dev's Spellbook 📖

### ConfigManager Class
Your config keeper—handles vars like a digital hoarder, but organized.

- **Constructor(options)**: Flexible flavors!
  - Old: `new ConfigManager('./config.json')` – Simple path.
  - Fancy: `new ConfigManager({ file: './config.json', load: ['.env'], add: { key: ['value'] } })` – Auto-load envs, add vars.
  
- **Methods**:
  - `addVariable(name, values = [])`: Add a var with initial array (or single). Returns bool. ✅
  - `removeVariable(name)`: Nuke a var. Returns bool. ❌
  - `removeVariableValue(name, value)`: Snip a value from var's list. Returns bool.
  - `listVariables()`: Print and return all vars with previews. 📋
  - `loadEnvFile(path = '.env.local')`: Slurp env file into vars. Handles quotes, skips comments.
  - `clearConfig()`: Wipe slate clean. 🧹
  - `exportConfig(outputPath)`: Dump to JSON. 📤
  - `promptForVariable(name)`: Async prompt with history/options. Returns value or null.
  - `getVariableOptions(name)`: Fetch array of saved values.
  - `addVariableValue(name, value)`: Add/move to front, cap at 10.

Punny note: It's like a config "manager" – because who wants unmanaged chaos? 😅

### ConsoleMenu Class
The menu maestro—builds, validates, runs your CLI symphony.

- **Constructor(options, configPath?)**: Dual modes!
  - Old: `new ConsoleMenu(menuData, './config.json')`.
  - Fancy: `new ConsoleMenu({ menu: dataOrPath, config: path, load: [...], add: {...}, warnings: false, validate: true })`.
  - Uses ConfigManager internally (pass existing via `cfg`).

- **Methods**:
  - `exec()`: Async run the menu loop. Validates first (skip with `{ validate: false }`).
  - `displayMenu()`: Clear & show current menu with title, items, icons.
  - `handleChoice(choice)`: Process input—nav or exec.
  - `executeCommand(cmd)`: Sub vars, check interactive, run via exec/spawn.
  - `executeInteractiveCommand(cmd)`: Handover stdin for interactive tools.
  - `navigateToMenu(name)`: Jump menus, handle back.
  - `validateMenuStructure()`: Deep checks for errors/warnings. Throws on fails.
  - `run()`: Alias for exec().

Static: `ConsoleMenu.new(...)` – Constructor wrapper for fancy/old compat.

Bonus: Integrates with ConfigManager for var prompts. If interactive, closes readline temporarily—geeky stdin swap!

## Examples: Real-World Recipes 👨‍🍳

Check the `examples/` dir for full scripts:
- **basic-usage.js**: Simple menu with var subs.
- **devops-workflow.js**: SSH, pings, system stats—Ops hero mode!
- **super-dev.js**: Git, lint, test—Dev dashboard dreams.
- **errors.js**: Test validation fails (for science! 🔬).
- **cli-menu**: Bin script for direct terminal takeover.

Mix in your own: Load from JSON for mega-menus.

### Theme Magic ✨

```javascript
// Set a theme when creating your menu
new ConsoleMenu({
  menu: './menu.json',
  theme: 'matrix'  // 🕶️ Enter the Matrix
});

// Or switch themes dynamically  
menu.setTheme('synthwave');  // 💜 80s cyberpunk vibes
menu.listThemes();           // See all available themes
```

### Built-in Theme Collection 🎭

| Theme | Vibe | Perfect For |
|-------|------|-------------|
| **classic** | Clean gray/white | Professional, default look |
| **matrix** 🕶️ | Green on black | Terminal hacking sessions |
| **synthwave** 💜 | Purple/pink/cyan | 80s retro cyberpunk feels |
| **ocean** 🌊 | Blue tones | Chill late-night coding |
| **fire** 🔥 | Red/orange/yellow | When your deploys need INTENSITY |
| **minimal** ⚪ | Grayscale only | Clean, distraction-free |

### Create Your Own Theme 🖌️

Want to go full nerd? Design custom themes:

```javascript
import { ThemeManager, MenuTheme } from 'smart-console-menu';

const themeManager = new ThemeManager();
themeManager.addTheme(new MenuTheme('cyberpunk', {
  titleBorder: '@x0D',    // Purple borders
  titleText: '@xFD',      // Bright purple text  
  itemText: '@x0B',       // Cyan items
  success: '@x0A',        // Green success
  error: '@x0C'           // Red errors
  // ... customize all the colors!
}));
```

### Colors in honer of the good ol' BBS days (If you know, you know) 🎨

| # | Color     | Attribute         | # | Color     | Attribute         |
|---|-----------|-------------------|---|-----------|-------------------|
| 0	| Black	    | Normal            | 1	| Blue	    | Normal            |
| 2	| Green	    | Normal            | 3	| Cyan	    | Normal            | 
| 4	| Red	    | Normal            | 5	| Magenta	| Normal            |
| 6	| Yellow    | Normal            | 7	| White	    | Normal            |
| 8	| Black	    | High Intensity    | 9	| Blue	    | High Intensity    | 
| A	| Green	    | High Intensity    | B	| Cyan	    | High Intensity    | 
| C	| Red	    | High Intensity    | D	| Magenta   | High Intensity    | 
| E	| Yellow    | High Intensity    | F	| White	    | High Intensity    |

Try the interactive demo: `node examples/theme-demo.js` 🎪

---

Thanks for menu-surfing! If bugs bite or features fizz, holler. May your terminals be ever colorful and your vars always substituted. 🎮✨

## Contributing: Join the CLI Clan! 🤝

Fork, PR, geek out! Report bugs? We'll debug like Sherlock on steroids. 🕵️‍♂️ Stars appreciated—fuel for more puns. Follow @hazlema on X for updates.

## License: MIT – Share the Love ❤️

Free as in speech (and beer? Nah, but close). See LICENSE for deets.

## The Super Over-Engineered Section 🎨⚡

Because why have boring terminals when you can have *fabulous* ones? We went completely overboard and added **6 gorgeous themes** to make your menus look absolutely stunning. This is totally optional (your menus work fine without themes), but where's the fun in that?

