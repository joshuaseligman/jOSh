module TSOS {
    export class MemoryAccessor {

        // Variable for determining which memory block we are working with
        private curSection: number = 0;

        private SECTION_SIZE: number = 0x100;

        // Function to flash a program into memory
        public flashProgram(program: number[], section: number): void {
            // Loop through the program and add each byte to memory
            // Load will check to make sure we have no more than 256 bytes of hex digits
            for (let i: number = 0; i < program.length; i++) {
                _Memory.write(this.getRealAddress(i, section), program[i]);
            }
        }

        // Function to get the actual address depending on the section one is working with
        private getRealAddress(virtualAddr: number, section: number): number {
            return section * this.SECTION_SIZE + virtualAddr;
        }
    }
}