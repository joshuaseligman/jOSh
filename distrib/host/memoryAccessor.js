var TSOS;
(function (TSOS) {
    class MemoryAccessor {
        constructor() {
            // Variable for determining which memory block we are working with
            this.curSection = 0;
            this.SECTION_SIZE = 0x100;
        }
        // Function to flash a program into memory
        flashProgram(program, section) {
            // Loop through the program and add each byte to memory
            // Load will check to make sure we have no more than 256 bytes of hex digits
            for (let i = 0; i < program.length; i++) {
                _Memory.write(this.getRealAddress(i, section), program[i]);
            }
        }
        // Function to get the actual address depending on the section one is working with
        getRealAddress(virtualAddr, section) {
            return section * this.SECTION_SIZE + virtualAddr;
        }
    }
    TSOS.MemoryAccessor = MemoryAccessor;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memoryAccessor.js.map