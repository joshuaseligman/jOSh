/* ----------------------------------
   DeviceDriverKeyboard.ts

   The Kernel Keyboard Device Driver.
   ---------------------------------- */

module TSOS {

    // Extends DeviceDriver
    export class DeviceDriverKeyboard extends DeviceDriver {

        // Flag to keep track of the state of the caps lock key
        private capsLockOn: boolean;

        constructor() {
            // Override the base method pointers.

            // The code below cannot run because "this" can only be
            // accessed after calling super.
            // super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            // So instead...
            super();
            this.driverEntry = this.krnKbdDriverEntry;
            this.isr = this.krnKbdDispatchKeyPress;

            this.capsLockOn = false;

            // Code from https://www.educative.io/answers/how-to-detect-the-caps-lock-status-in-javascript
            document.addEventListener('keydown', (e) => {
                this.capsLockOn = e.getModifierState('CapsLock');
            });
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
            _Kernel.krnTrace("Key code:" + keyCode + " shifted:" + isShifted + " caps lock: " + this.capsLockOn);
            var chr = "";
            // Check to see if we even want to deal with the key that was pressed.
            if ((keyCode >= 65) && (keyCode <= 90)) { // letter
                if (isShifted || this.capsLockOn) { 
                    chr = String.fromCharCode(keyCode); // Uppercase A-Z
                } else {
                    chr = String.fromCharCode(keyCode + 32); // Lowercase a-z
                }
                _KernelInputQueue.enqueue(chr);
            } else if (((keyCode >= 48) && (keyCode <= 57)) ||   // digits
                        (keyCode == 32) || (keyCode === 8)  ||   // space, backspace
                        (keyCode == 13)) {                       // enter
                let chr: string = '';
                if (isShifted && keyCode !== 32 && keyCode !== 8 && keyCode !== 13) {
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
                    }
                } else {
                    chr = String.fromCharCode(keyCode);
                }
                _KernelInputQueue.enqueue(chr);
            }
        }
    }
}
