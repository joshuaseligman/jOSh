/* ------------
     CPU.ts

     Routines for the host CPU simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    export class Cpu {

        constructor(public PC: number = 0,
                    public IR: number = 0,
                    public Acc: number = 0,
                    public Xreg: number = 0,
                    public Yreg: number = 0,
                    public Zflag: number = 0,
                    public isExecuting: boolean = false) {

        }

        public init(): void {
            this.PC = 0;
            this.IR = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        }

        public cycle(): void {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.

            this.fetch();
            let operands: number[] = this.decode();
            this.execute(operands);
        }

        // Function for fetching an instruction
        private fetch(): void {
            // Get the instruction from memory and increment the PC
            this.IR = _MemoryAccessor.callRead(this.PC);
            this.PC++;
        }

        // Function for decoding the instruction
        private decode(): number[] {
            switch (this.IR) {
            // 1 operand
            case 0xA9: // LDA constant
                // Get the operand
                let op: number = _MemoryAccessor.callRead(this.PC);
                // Increment the PC
                this.PC++;
                // Return the operand
                return [op];
            
            // 2 operands
            case 0xAD: // LDA memory
            case 0x8D: // STA
                // Get the operands from memory
                let op1: number = _MemoryAccessor.callRead(this.PC);
                this.PC++;
                let op2: number = _MemoryAccessor.callRead(this.PC);
                this.PC++;

                // Return the operands
                return [op1, op2];
            }
        }

        // Function for executing the instruction
        private execute(operands: number[]): void {
            switch (this.IR) {
            case 0xA9: // LDA constant
                // Update the accumulator
                this.Acc = operands[0];
                break;
            case 0xAD: // LDA memory
                // Convert the operands from little endian format to a plain address
                // Since each operand is 8 bits, we can left shift the first one and do a bitwise OR
                // te combine them into one whole address
                let readAddr: number = operands[1] << 8 | operands[0];
                
                // Set the accumulator to whatever is in memory at the given address
                this.Acc = _MemoryAccessor.callRead(readAddr);
                break;

            case 0x8D: // STA
                // Convert the operands from little endian format to a plain address as described in 0xAD
                let writeAddr: number = operands[1] << 8 | operands[0];

                // Write the accumulator to memory
                _MemoryAccessor.callWrite(writeAddr, this.Acc);
                break;
            }
        }

        // Function to update the table on the website
        public updateCpuTable(): void {
            (<HTMLTableCellElement> document.querySelector('#cpuPC')).innerHTML = Utils.getHexString(this.PC, 2, false);
            (<HTMLTableCellElement> document.querySelector('#cpuIR')).innerHTML = Utils.getHexString(this.IR, 2, false);
            (<HTMLTableCellElement> document.querySelector('#cpuAcc')).innerHTML = Utils.getHexString(this.Acc, 2, false);
            (<HTMLTableCellElement> document.querySelector('#cpuXReg')).innerHTML = Utils.getHexString(this.Xreg, 2, false);
            (<HTMLTableCellElement> document.querySelector('#cpuYReg')).innerHTML = Utils.getHexString(this.Yreg, 2, false);
            (<HTMLTableCellElement> document.querySelector('#cpuPC')).innerHTML = this.Zflag.toString();
        }
    }
}
