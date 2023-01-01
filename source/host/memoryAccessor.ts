module TSOS {
    export class MemoryAccessor {

        // Function to flash a program into memory
        public flashProgram(program: number[], baseAddr: number): void {
            // Loop through the program and add each byte to memory
            // Load will check to make sure we have no more than 256 bytes of hex digits
            for (let i: number = 0; i < program.length; i++) {
                // Write the program
                _Memory.writeImmediate(this.getPhysicalAddress(i, baseAddr), program[i]);
            }
        }

        // Function to get the actual address depending on the section one is working with
        public getPhysicalAddress(virtualAddr: number, baseAddr: number): number {
            return virtualAddr + baseAddr;
        }

        /**
         * Checks to see if the memory is ready
         * @returns The ready state of memory
         */
        public isReady(): boolean {
            return _Memory.memoryState === MemoryState.READY;
        }

        public callRead(): void {
            if (this.getMar() >= _PCBReadyQueue.getHead().limitReg) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new Interrupt(MEM_EXCEPTION_IRQ, [this.getMar(), _PCBReadyQueue.getHead().segment]));
            } else {
                // Requested address is in bounds
                _Memory.initiateRead();
            }
        }

        public callWrite(): void {
            if (this.getMar() >= _PCBReadyQueue.getHead().limitReg) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new Interrupt(MEM_EXCEPTION_IRQ, [this.getMar(), _PCBReadyQueue.getHead().segment]));
            } else {
                // Requested address is in bounds
                _Memory.write();
            }
        }

        // Function that gets the data from the given address in memory, taking the curSection into account
        public readImmediate(addr: number): number {
            // Get the actual address based on the section being used
            let requestedAddr: number = this.getPhysicalAddress(addr, _PCBReadyQueue.getHead().baseReg);
            if (requestedAddr >= _PCBReadyQueue.getHead().limitReg) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new Interrupt(MEM_EXCEPTION_IRQ, [requestedAddr, _PCBReadyQueue.getHead().segment]));
                return -1;
            } else {
                // Requested address is in bounds
                return _Memory.readImmediate(requestedAddr);
            }
        }

        // Function that writes the data into the address in memory, taking the curSection into account
        public writeImmediate(addr: number, val: number): void {
            // Get the actual address based on the section being used
            let requestedAddr: number = this.getPhysicalAddress(addr, _PCBReadyQueue.getHead().baseReg);
            if (requestedAddr >= _PCBReadyQueue.getHead().limitReg) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new Interrupt(MEM_EXCEPTION_IRQ, [requestedAddr, _PCBReadyQueue.getHead().segment]));
            } else {
                // Requested address is in bounds
                _Memory.writeImmediate(requestedAddr, val);
            }
        }

        /**
         * Sets the value of the MAR in one cycle
         * @param newMar The new value of the 16-bit MAR
         */
        public setMar(newMar: number): void {
            _Memory.mar = this.getPhysicalAddress(newMar, _PCBReadyQueue.getHead().baseReg);
        }

        /**
         * Sets the low order byte of the MAR
         * @param newLowByte The new low order byte
         */
        public setLowOrderByte(newLowByte: number): void {
            if (newLowByte > 0xFF) {
                _Kernel.krnTrace('ERR: Failed to set low order byte. Address undefined');
            } else {
                // Get the current MAR
                let oldMar: number = _Memory.mar;
                // Reset the low order byte to be 0x00
                let shiftedHighByte: number = oldMar & 0xFF00;
                // Add the new low order byte
                let newMar: number = shiftedHighByte | newLowByte;
                // Update the actual MAR
                this.setMar(newMar);
            }
        }

        /**
         * Sets the high order byte of the MAR
         * @param newHighByte The new high order byte
         */
        public setHighOrderByte(newHighByte: number): void {
            if (newHighByte > 0xFF) {
                _Kernel.krnTrace('ERR: Failed to set high order byte. Address undefined');
            } else {
                // Get the current MAR
                let oldMar: number = _Memory.mar;
                // Reset the high order byte to be 0x00
                let lowByte: number = oldMar & 0x00FF;
                // Combine the new high byte with the current low byte
                let newMar: number = newHighByte << 8 | lowByte;
                // Update the actual MAR
                this.setMar(newMar);
            }
        }

        /**
         * Sets the MDR to the new value
         * @param newMdr The new MDR
         */
        public setMdr(newMdr: number): void {
            if (newMdr > 0xFF) {
                _Kernel.krnTrace('ERR: Failed to set MDR. Value exceeds range');
            } else {
                _Memory.mdr = newMdr;
            }
        }

        // Gets a chunk of memory
        public memoryDump(baseAddr: number, limitAddr: number): number[] {
            // Initialize to nothing
            let dump: number[] = [];
            // Go through the requested range of addresses
            for (let addr: number = baseAddr; addr < limitAddr; addr++) {
                // Push the value to the array
                dump.push(_Memory.readImmediate(addr));
            }
            return dump;
        }

        // Clears memory from the start up to, but not including stop
        public clearMemory(start: number, stop: number): void {
            for (let i = start; i < stop; i++) {
                _Memory.writeImmediate(i, 0x0);
            }
        }

        public getMar(): number {
            return _Memory.mar;
        }

        public getMdr(): number {
            return _Memory.mdr;
        }
    }
}