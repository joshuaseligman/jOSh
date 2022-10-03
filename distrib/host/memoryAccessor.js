var TSOS;
(function (TSOS) {
    class MemoryAccessor {
        // Function to flash a program into memory
        flashProgram(program, baseAddr) {
            // Loop through the program and add each byte to memory
            // Load will check to make sure we have no more than 256 bytes of hex digits
            for (let i = 0; i < program.length; i++) {
                // Write the program
                _Memory.write(this.getPhysicalAddress(i, baseAddr), program[i]);
            }
        }
        // Function to get the actual address depending on the section one is working with
        getPhysicalAddress(virtualAddr, baseAddr) {
            return virtualAddr + baseAddr;
        }
        // Function that gets the data from the given address in memory, taking the curSection into account
        callRead(addr) {
            // Get the actual address based on the section being used
            let requestedAddr = this.getPhysicalAddress(addr, _PCBReadyQueue.getHead().baseReg);
            if (requestedAddr >= _PCBReadyQueue.getHead().limitReg) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(3 /* Interrupts.MEM_EXCEPTION_IRQ */, [requestedAddr, _PCBReadyQueue.getHead().baseReg / 0x0100]));
                return -1;
            }
            else {
                // Requested address is in bounds
                return _Memory.read(requestedAddr);
            }
        }
        // Function that writes the data into the address in memory, taking the curSection into account
        callWrite(addr, val) {
            // Get the actual address based on the section being used
            let requestedAddr = this.getPhysicalAddress(addr, _PCBReadyQueue.getHead().baseReg);
            if (requestedAddr >= _PCBReadyQueue.getHead().limitReg) {
                // Throw an error when trying to access memory outside of the range of the section
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(3 /* Interrupts.MEM_EXCEPTION_IRQ */, [requestedAddr, _PCBReadyQueue.getHead().baseReg / 0x0100]));
            }
            else {
                // Requested address is in bounds
                _Memory.write(requestedAddr, val);
            }
        }
    }
    TSOS.MemoryAccessor = MemoryAccessor;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memoryAccessor.js.map