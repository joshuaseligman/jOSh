module TSOS {
    export class MemoryAccessor {

        // Function to flash a program into memory
        public flashProgram(program: number[], baseAddr: number): void {
            // Loop through the program and add each byte to memory
            // Load will check to make sure we have no more than 256 bytes of hex digits
            for (let i: number = 0; i < program.length; i++) {
                // Write the program
                _Memory.write(this.getPhysicalAddress(i, baseAddr), program[i]);
            }
        }

        // Function to get the actual address depending on the section one is working with
        public getPhysicalAddress(virtualAddr: number, baseAddr: number): number {
            return virtualAddr + baseAddr;
        }

        // Function that gets the data from the given address in memory, taking the curSection into account
        public callRead(addr: number): number {
            // Get the actual address based on the section being used
            let requestedAddr: number = this.getPhysicalAddress(addr, _PCBReadyQueue.getHead().baseReg);
            if (requestedAddr >= _PCBReadyQueue.getHead().limitReg) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new Interrupt(MEM_EXCEPTION_IRQ, [requestedAddr, _PCBReadyQueue.getHead().segment]));
                return -1;
            } else {
                // Requested address is in bounds
                return _Memory.read(requestedAddr);
            }
        }

        // Function that writes the data into the address in memory, taking the curSection into account
        public callWrite(addr: number, val: number): void {
            // Get the actual address based on the section being used
            let requestedAddr: number = this.getPhysicalAddress(addr, _PCBReadyQueue.getHead().baseReg);
            if (requestedAddr >= _PCBReadyQueue.getHead().limitReg) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new Interrupt(MEM_EXCEPTION_IRQ, [requestedAddr, _PCBReadyQueue.getHead().segment]));
            } else {
                // Requested address is in bounds
                _Memory.write(requestedAddr, val);
            }
        }

        // Clears memory from the start up to, but not including stop
        public clearMemory(start: number, stop: number): void {
            for (let i = start; i < stop; i++) {
                _Memory.write(i, 0x0);
            }
        }
    }
}