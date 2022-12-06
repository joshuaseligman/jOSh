var TSOS;
(function (TSOS) {
    class MemoryAccessor {
        // Function to flash a program into memory
        flashProgram(program, baseAddr) {
            // Loop through the program and add each byte to memory
            // Load will check to make sure we have no more than 256 bytes of hex digits
            for (let i = 0; i < program.length; i++) {
                // Write the program
                _Memory.writeImmediate(this.getPhysicalAddress(i, baseAddr), program[i]);
            }
        }
        // Function to get the actual address depending on the section one is working with
        getPhysicalAddress(virtualAddr, baseAddr) {
            return virtualAddr + baseAddr;
        }
        callRead() {
            if (this.getMar() >= _PCBReadyQueue.getHead().limitReg) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(MEM_EXCEPTION_IRQ, [this.getMar(), _PCBReadyQueue.getHead().segment]));
            }
            else {
                // Requested address is in bounds
                _Memory.read();
            }
        }
        callWrite() {
            if (this.getMar() >= _PCBReadyQueue.getHead().limitReg) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(MEM_EXCEPTION_IRQ, [this.getMar(), _PCBReadyQueue.getHead().segment]));
            }
            else {
                // Requested address is in bounds
                _Memory.write();
            }
        }
        // Function that gets the data from the given address in memory, taking the curSection into account
        readImmediate(addr) {
            // Get the actual address based on the section being used
            let requestedAddr = this.getPhysicalAddress(addr, _PCBReadyQueue.getHead().baseReg);
            if (requestedAddr >= _PCBReadyQueue.getHead().limitReg) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(MEM_EXCEPTION_IRQ, [requestedAddr, _PCBReadyQueue.getHead().segment]));
                return -1;
            }
            else {
                // Requested address is in bounds
                return _Memory.readImmediate(requestedAddr);
            }
        }
        // Function that writes the data into the address in memory, taking the curSection into account
        writeImmediate(addr, val) {
            // Get the actual address based on the section being used
            let requestedAddr = this.getPhysicalAddress(addr, _PCBReadyQueue.getHead().baseReg);
            if (requestedAddr >= _PCBReadyQueue.getHead().limitReg) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(MEM_EXCEPTION_IRQ, [requestedAddr, _PCBReadyQueue.getHead().segment]));
            }
            else {
                // Requested address is in bounds
                _Memory.writeImmediate(requestedAddr, val);
            }
        }
        /**
         * Sets the value of the MAR in one cycle
         * @param newMar The new value of the 16-bit MAR
         */
        setMar(newMar) {
            _Memory.mar = this.getPhysicalAddress(newMar, _PCBReadyQueue.getHead().baseReg);
        }
        /**
         * Sets the low order byte of the MAR
         * @param newLowByte The new low order byte
         */
        setLowOrderByte(newLowByte) {
            if (newLowByte > 0xFF) {
                _Kernel.krnTrace('ERR: Failed to set low order byte. Address undefined');
            }
            else {
                // Get the current MAR
                let oldMar = _Memory.mar;
                // Reset the low order byte to be 0x00
                let shiftedHighByte = oldMar & 0xFF00;
                // Add the new low order byte
                let newMar = shiftedHighByte | newLowByte;
                // Update the actual MAR
                this.setMar(newMar);
            }
        }
        /**
         * Sets the high order byte of the MAR
         * @param newHighByte The new high order byte
         */
        setHighOrderByte(newHighByte) {
            if (newHighByte > 0xFF) {
                _Kernel.krnTrace('ERR: Failed to set high order byte. Address undefined');
            }
            else {
                // Get the current MAR
                let oldMar = _Memory.mar;
                // Reset the high order byte to be 0x00
                let lowByte = oldMar & 0x00FF;
                // Combine the new high byte with the current low byte
                let newMar = newHighByte << 8 | lowByte;
                // Update the actual MAR
                this.setMar(newMar);
            }
        }
        /**
         * Sets the MDR to the new value
         * @param newMdr The new MDR
         */
        setMdr(newMdr) {
            if (newMdr > 0xFF) {
                _Kernel.krnTrace('ERR: Failed to set MDR. Value exceeds range');
            }
            else {
                _Memory.mdr = newMdr;
            }
        }
        // Gets a chunk of memory
        memoryDump(baseAddr, limitAddr) {
            // Initialize to nothing
            let dump = [];
            // Go through the requested range of addresses
            for (let addr = baseAddr; addr < limitAddr; addr++) {
                // Push the value to the array
                dump.push(_Memory.readImmediate(addr));
            }
            return dump;
        }
        // Clears memory from the start up to, but not including stop
        clearMemory(start, stop) {
            for (let i = start; i < stop; i++) {
                _Memory.writeImmediate(i, 0x0);
            }
        }
        getMar() {
            return _Memory.mar;
        }
        getMdr() {
            return _Memory.mdr;
        }
    }
    TSOS.MemoryAccessor = MemoryAccessor;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memoryAccessor.js.map