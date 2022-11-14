module TSOS {

    // Extends DeviceDriver
    export class DiskSystemDeviceDriver extends DeviceDriver {
        constructor() {
            // Override the base method pointers.

            // The code below cannot run because "this" can only be
            // accessed after calling super.
            // super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            // So instead...
            super();
            this.driverEntry = this.krnDsDriverEntry;
            this.isr = this.krnDsDispatchKeyPress;
        }

        public krnDsDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
        }

        public krnDsDispatchKeyPress(params) {
        }
    }
}