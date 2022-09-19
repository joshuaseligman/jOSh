module TSOS {
    export class MemoryAccessor {

        // Variable for determining which memory block we are working with
        public curSection: number = 0;

        private SECTION_SIZE: number = 0x100;

        // Function to flash a program into memory
        public flashProgram(program: number[], section: number): void {
            // Loop through the program and add each byte to memory
            // Load will check to make sure we have no more than 256 bytes of hex digits
            for (let i: number = 0; i < this.SECTION_SIZE; i++) {
                if (i < program.length) {
                    // Write the program
                    _Memory.write(this.getRealAddress(i, section), program[i]);
                } else {
                    // Rest of the section should be 0
                    _Memory.write(this.getRealAddress(i, section), 0);
                }
            }
        }

        // Function to get the actual address depending on the section one is working with
        public getRealAddress(virtualAddr: number, section: number): number {
            return section * this.SECTION_SIZE + virtualAddr;
        }

        // Function that gets the data from the given address in memory, taking the curSection into account
        public callRead(addr: number): number {
            // Get the actual address based on the section being used
            let requestedAddr: number = this.getRealAddress(addr, this.curSection);
            if (addr >= this.SECTION_SIZE) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new Interrupt(MEM_EXCEPTION_IRQ, [requestedAddr, this.curSection]));
                return -1;
            } else {
                // Requested address is in bounds
                return _Memory.read(requestedAddr);
            }
        }

        // Function that writes the data into the address in memory, taking the curSection into account
        public callWrite(addr: number, val: number): void {
            // Get the actual address based on the section being used
            let requestedAddr: number = this.getRealAddress(addr, this.curSection);
            if (addr >= this.SECTION_SIZE) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new Interrupt(MEM_EXCEPTION_IRQ, [requestedAddr, this.curSection]));
            } else {
                // Requested address is in bounds
                _Memory.write(this.getRealAddress(addr, this.curSection), val);
            }
        }
    }
}