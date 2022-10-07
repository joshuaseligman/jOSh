/* ----------------------------------
   DeviceDriverKeyboard.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */

module TSOS {

    // Extends DeviceDriver
    export class DeviceDriverKeyboard extends DeviceDriver {
        constructor() {
            // Override the base method pointers.

            // The code below cannot run because "this" can only be
            // accessed after calling super.
            // super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            // So instead...
            super();
            this.driverEntry = this.krnKbdDriverEntry;
            this.isr = this.krnKbdDispatchKeyPress;
        }

        public krnKbdDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
        }

        public krnKbdDispatchKeyPress(params) {
            // Parse the params.  TODO: Check that the params are valid and osTrapError if not.
            var keyCode = params[0];
            var isShifted = params[1];
            let capsLockOn: boolean = params[2];
            let controlPressed: boolean = params[3];
            _Kernel.krnTrace("Key code:" + keyCode + " shifted:" + isShifted + " caps lock: " + capsLockOn + " ctrl: " + controlPressed);
            var chr = "";
            // Check to see if we even want to deal with the key that was pressed.
            if ((keyCode >= 65) && (keyCode <= 90)) { // letter
                if (keyCode === 67 && controlPressed) {
                    // Kill the running program
                    _KernelInterruptQueue.enqueue(new Interrupt(PROG_BREAK_ALL_IRQ, []));
                } else {
                    if (isShifted || capsLockOn) { 
                        chr = String.fromCharCode(keyCode); // Uppercase A-Z
                    } else {
                        chr = String.fromCharCode(keyCode + 32); // Lowercase a-z
                    }
                    _KernelInputQueue.enqueue(chr);
                }

            } else if (((keyCode >= 48) && (keyCode <= 57)) ||    // digits
                        (keyCode === 32) || (keyCode === 8)  ||   // space, backspace
                        (keyCode === 13) || (keyCode === 186 || keyCode === 59) ||   // enter, semicolon
                        (keyCode === 61 || keyCode === 187) || (keyCode === 188) ||  // equal, comma
                        (keyCode === 173 || keyCode === 189) || (keyCode === 190) || // hyphen, period
                        (keyCode === 191) || (keyCode === 192) || // slash, backtick
                        (keyCode === 219) || (keyCode === 220) || // left bracket, back slash
                        (keyCode === 221) || (keyCode === 222) || // right bracket, apostrophe
                        (keyCode === 9)) { // tab
                let chr: string = '';
                if (isShifted && keyCode !== 32 && keyCode !== 8 && keyCode !== 13 && keyCode !== 9) {
                    // Get the shifted special characters
                    switch (keyCode) {
                    case 49: // 1
                        chr = '!';
                        break;
                    case 50: // 2
                        chr = '@';
                        break;
                    case 51: // 3
                        chr = '#';
                        break;
                    case 52: // 4
                        chr = '$';
                        break;
                    case 53: // 5
                        chr = '%';
                        break;
                    case 54: // 6
                        chr = '^';
                        break;
                    case 55: // 7
                        chr = '&';
                        break;
                    case 56: // 8
                        chr = '*';
                        break;
                    case 57: // 9
                        chr = '(';
                        break;
                    case 48: // 0
                        chr = ')';
                        break;
                    case 59: // ;
                    case 186:
                        chr = ':';
                        break;
                    case 61: // =
                    case 187:
                        chr = '+';
                        break;
                    case 188: // ,
                        chr = '<';
                        break;
                    case 173: // -
                    case 189:
                        chr = '_';
                        break;
                    case 190: // .
                        chr = '>';
                        break;
                    case 191: // /
                        chr = '?';
                        break;
                    case 192: // `
                        chr = '~';
                        break;
                    case 219: // [
                        chr = '{';
                        break;
                    case 220: // \
                        chr = '|';
                        break;
                    case 221: // ]
                        chr = '}';
                        break;
                    case 222: // '
                        chr = '"';
                        break;
                    }
                } else {
                    // Get unshifted special characters
                    switch (keyCode) {
                    case 59: // ;
                    case 186:
                        chr = ';';
                        break;
                    case 61: // =
                    case 187:
                        chr = '=';
                        break;
                    case 188: // ,
                        chr = ',';
                        break;
                    case 173: // -
                    case 189:
                        chr = '-';
                        break;
                    case 190: // .
                        chr = '.';
                        break;
                    case 191: // /
                        chr = '/';
                        break;
                    case 192: // `
                        chr = '`';
                        break;
                    case 219: // [
                        chr = '[';
                        break;
                    case 220: // \
                        chr = '\\';
                        break;
                    case 221: // ]
                        chr = ']';
                        break;
                    case 222: // '
                        chr = '\'';
                        break;
                    default:
                        // The rest or the ascii codes match the key code
                        chr = String.fromCharCode(keyCode);
                    }
                }
                _KernelInputQueue.enqueue(chr);
            } else if (keyCode === 38 || keyCode === 40) {
                // Handle the up and down arrows
                switch (keyCode) {
                case 38:
                    // We cannot just put in the character from the keycode because 38 is '&' in ASCII
                    _KernelInputQueue.enqueue('up');
                    break;
                case 40:
                    // Following the same practice as the up arrow
                    _KernelInputQueue.enqueue('down');
                    break;
                }
            }
        }
    }
}
