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
            case 0xA2: // LDX constant
            case 0xA0: // LDY constant
            case 0xD0: // BNE
                // Get the operand
                let op: number = _MemoryAccessor.callRead(this.PC);
                // Increment the PC
                this.PC++;
                // Return the operand
                return [op];
            
            // 2 operands
            case 0xAD: // LDA memory
            case 0x8D: // STA
            case 0x6D: // ADC
            case 0xAE: // LDX memory
            case 0xAC: // LDY memory
            case 0xEC: // CPX
            case 0xEE: // INC
                // Get the operands from memory
                let op1: number = _MemoryAccessor.callRead(this.PC);
                this.PC++;
                let op2: number = _MemoryAccessor.callRead(this.PC);
                this.PC++;

                // Return the operands
                return [op1, op2];
            
            // 0 operands
            case 0xEA: // NOP
            case 0x00: // BRK
            case 0xFF: // SYS
                return [];
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

            case 0x6D: // ADC
                // Convert the operands from little endian format to a plain address as described in 0xAD
                let addAddr: number = operands[1] << 8 | operands[0];

                // Get the value to add to the accumulator
                let addVal: number = _MemoryAccessor.callRead(addAddr);

                // Add the numbers together
                this.Acc = this.add(this.Acc, addVal);
                break;

            case 0xA2: // LDX constant
                // Put the operand into the x register
                this.Xreg = operands[0];
                break;

            case 0xAE: // LDX memory
                // Convert the operands from little endian format to a plain address as described in 0xAD
                let xAddr: number = operands[1] << 8 | operands[0];

                // Set the x register to the value in memory
                this.Xreg = _MemoryAccessor.callRead(xAddr);
                break;

            case 0xA0: // LDY constant
                // Put the operand into the y register
                this.Yreg = operands[0];
                break;

            case 0xAC: // LDY memory
                // Convert the operands from little endian format to a plain address as described in 0xAD
                let yAddr: number = operands[1] << 8 | operands[0];

                // Set the x register to the value in memory
                this.Yreg = _MemoryAccessor.callRead(yAddr);
                break;

            case 0xEA: // NOP
                // Do nothing for a no operation
                break;

            case 0x00: // BRK
                // Call an interrupt for the OS to handle to end of the program execution
                _KernelInterruptQueue.enqueue(new Interrupt(PROG_BREAK_IRQ, []));
                break;
            
            case 0xEC: // CPX
                // Convert the operands from little endian format to a plain address as described in 0xAD
                let compAddr: number = operands[1] << 8 | operands[0];

                // Get the value in memory and negate it
                let compVal: number = _MemoryAccessor.callRead(compAddr);
                let compValNeg: number = this.negate(compVal);

                // Run the values through the adder
                // The Z flag will be updated appropriately to be 1 if they are equal and 0 if not
                this.add(this.Xreg, compValNeg);
                break;

            case 0xD0: // BNE
                // Only branch if the z flag is not enabled
                if (this.Zflag === 0) {
                    // Add the operand to the program counter
                    this.PC = this.add(this.PC, operands[0]);
                }
                break;
            
            case 0xEE: // INC
                // Convert the operands from little endian format to a plain address as described in 0xAD
                let incAddr: number = operands[1] << 8 | operands[0];

                // Get the value from memory and add 1 to it
                let origVal: number = _MemoryAccessor.callRead(incAddr);
                let newVal: number = this.add(origVal, 1);

                // Write the new value back to memory
                _MemoryAccessor.callWrite(incAddr, newVal);
                break;

            case 0xFF: // SYS
                if (this.Xreg === 1) {
                    if (this.Yreg >> 7 === 1) {
                        // We have a negative number and have to put it in a usable format for base 10
                        let printableNum: number = -1 * this.negate(this.Yreg);
                        // Make a system call for printing the number
                        _KernelInterruptQueue.enqueue(new Interrupt(SYSCALL_PRINT_INT_IRQ, [printableNum]));
                    } else {
                        // Make a system call for printing the number
                        _KernelInterruptQueue.enqueue(new Interrupt(SYSCALL_PRINT_INT_IRQ, [this.Yreg]));
                    }
                } else if (this.Xreg === 2) {
                    // Convert the operands from little endian format to a plain address as described in 0xAD
                    _KernelInterruptQueue.enqueue(new Interrupt(SYSCALL_PRINT_STR_IRQ, [this.Yreg]));
                }
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
            (<HTMLTableCellElement> document.querySelector('#cpuZFlag')).innerHTML = this.Zflag.toString();
        }

        // All ALU code below is from Computer Organization and Architecture project
        // https://github.com/joshuaseligman/422-tsiraM/blob/master/src/hardware/Alu.ts

        // Low-level adder for 2 8-bit numbers
        private add(num1: number, num2: number): number {
            // Sum is the outputted answer and starts at 0 and carry will initally be 0
            let sum: number = 0;
            let carry: number = 0;

            // Iterate 8 times because each number is 8 bits
            for (let i = 0; i < 8; i++) {
                // Get the bits to add
                let bit1: number = num1 & 1;
                let bit2: number = num2 & 1;

                // Update the numbers
                num1 = num1 >> 1;
                num2 = num2 >> 1;

                // Get the result
                let result: number[] = this.fullAdder(bit1, bit2, carry);

                // Update the final total and carry for next adder
                sum = result[0] << i | sum;
                carry = result[1];
            }
            
            // Update the z flag accordingly
            this.Zflag = (sum === 0) ? 1 : 0;
            return sum;
        }

        // Low-level full adder for adding 2 bits with carry
        private fullAdder(bit1: number, bit2: number, carry: number): number[] {
            // Add the 2 bits together
            let firstOut: number[] = this.halfAdder(bit1, bit2);
            // Add the sum of the 2 bits with the carry bit
            let secondOut: number[] = this.halfAdder(firstOut[0], carry);

            // The total sum is the sum of the second output and the carry output is if either half adder returned a carry flag
            return [secondOut[0], firstOut[1] | secondOut[1]];
        }

        // Low-level half adder for adding 2 bits
        private halfAdder(bit1: number, bit2: number): number[] {
            // The sum is the XOR or the bits and the carry is the AND of the bits
            let sum: number = bit1 ^ bit2;
            let carry: number = bit1 & bit2;
            return [sum, carry];
        }

        // Negates a number using 2s complement
        private negate(num: number): number {
            return ((~num) & 0xFF) + 1;
        }
    }
}
