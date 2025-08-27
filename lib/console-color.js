import { EventEmitter } from 'events';

export default class ColorConsole extends EventEmitter {
    #spinnerInterval = null;  // Private state—hidden like a secret level.

    constructor(str, options = {}) {
        super();  // EventEmitter superpowers for custom endsAfter events!
        // Ready to print? We're instantiated and caffeinated!
        if (str) {
            this.print(str, options);  // Auto-print if str given—like a constructor with benefits.
        }
        this.#setupAutoEnd(options);
    }

    #setupAutoEnd(options) {
        const { endsAfter, success, fail } = options;
        if (!endsAfter) return;  // No drama? Spin freely!

        if (typeof endsAfter === 'number') {
            // Timer mode: Set it and forget it—like a microwave for spinners.
            if (isNaN(endsAfter) || endsAfter <= 0) {
                console.warn('Invalid timer—spinning eternally! ⏳');
                return;
            }
            setTimeout(() => {
                this.#endSpinner(success || '@X02Done!', fail);
            }, endsAfter);
        } else if (typeof endsAfter === 'string') {
            // Event mode: Listen for 'myEvent' like a promise on steroids.
            this.once(endsAfter, (err) => {
                this.#endSpinner(err ? (fail || '@X04Error!') : (success || '@X02Success!'), err ? err : null);
            });
        } else {
            console.warn('Bad endsAfter—must be number (ms) or string (event)—spinning on! 🔄');
        }
    }

    #endSpinner(message, error = null) {
        this.stopSpinner();
        this.print(message);  // Print the finale—color-coded drama!
        if (error) console.error(error);  // Log fails for debug duels.
    }

    static print(str, options = {}) {
        const instance = new ColorConsole();  // Spawn a fresh stub instance—like cloning a console minion!
        instance.print(str, options);
        return instance;  // Return the stub for spinner control or chaining shenanigans.
    }

    print(str, options = {}) {
        const isAnsiSupported = process.stdout.isTTY && process.env.TERM !== 'dumb';
        
        if (!isAnsiSupported && !options.forceAnsi) {
            // No ANSI? No problem—strip codes and log plain like a minimalist monk.
            const plainStr = str.replace(/@x[0-9A-F][0-9A-F]/gi, '');
            console.log(plainStr);
            return;
        }
        
        const regex = /@x[0-9A-F][0-9A-F]/gi;
        const colors = {
            "F0": "\x1b[30m", "F4": "\x1b[31m", "F2": "\x1b[32m",
            "F6": "\x1b[33m", "F1": "\x1b[34m", "F5": "\x1b[35m",
            "F3": "\x1b[36m", "F7": "\x1b[37m",
            "F8": "\x1b[30;1m", "F9": "\x1b[34;1m", "FA": "\x1b[32;1m",
            "FB": "\x1b[36;1m", "FC": "\x1b[31;1m", "FD": "\x1b[35;1m",
            "FE": "\x1b[33;1m", "FF": "\x1b[37;1m",
            "B0": "\x1b[40m", "B4": "\x1b[41m", "B2": "\x1b[42m",
            "B6": "\x1b[43m", "B1": "\x1b[44m", "B5": "\x1b[45m",
            "B3": "\x1b[46m", "B7": "\x1b[47m",
            "B8": "\x1b[40;1m", "B9": "\x1b[44;1m", "BA": "\x1b[42;1m",
            "BB": "\x1b[46;1m", "BC": "\x1b[41;1m", "BD": "\x1b[45;1m",
            "BE": "\x1b[43;1m", "BF": "\x1b[47;1m"
        };
        
        let coloredStr = str.replace(regex, (match) => {
            const upper = match.toUpperCase();
            const bgKey = `B${upper[2]}`;
            const fgKey = `F${upper[3]}`;
            const bg = colors[bgKey] || '';
            const fg = colors[fgKey] || '';
            return `\x1b[0;0m${bg}${fg}`;
        });
        
        // Spinner magic: If ${spinner} detected, amp it up with animation!
        if (coloredStr.includes('${spinner}')) {
            // Stop any existing spinner first—like hitting Ctrl+C on a infinite loop.
            this.stopSpinner();
            
            const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];  // Braillie spinner—geeky and compact!
            let frameIndex = 0;
            const staticPart = coloredStr.replace('${spinner}', '');  // Remove placeholder, we'll add spinner dynamically.
            
            // Start the spin cycle: Update every 80ms till next print or stop.
            this.#spinnerInterval = setInterval(() => {
                const frame = frames[frameIndex++ % frames.length];
                process.stdout.write(`\r${frame} ${staticPart}\x1b[0;0m`);  // Overwrite line with \r.
            }, 80);
            
            // Note: Next print will auto-stop this—stateful like a REPL!
        } else {
            // No spinner? Just print and reset.
            this.stopSpinner();
            console.log(`${coloredStr}\x1b[0;0m`);
        }
    }

    stopSpinner() {
        if (this.#spinnerInterval) {
            clearInterval(this.#spinnerInterval);
            process.stdout.write('\r\x1b[K');  // Wipe any lingering spinner line.
            this.#spinnerInterval = null;
        }
    }
}