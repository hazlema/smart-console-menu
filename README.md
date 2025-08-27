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

## Contributing: Join the CLI Clan! 🤝

Fork, PR, geek out! Report bugs? We'll debug like Sherlock on steroids. 🕵️‍♂️ Stars appreciated—fuel for more puns. Follow @hazlema on X for updates.

## License: MIT – Share the Love ❤️

Free as in speech (and beer? Nah, but close). See LICENSE for deets.

Thanks for menu-surfing! If bugs bite or features fizz, holler. May your terminals be ever colorful and your vars always substituted. 🎮✨