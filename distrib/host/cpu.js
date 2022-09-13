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
var TSOS;
(function (TSOS) {
    class Cpu {
        constructor(PC = 0, IR = 0, Acc = 0, Xreg = 0, Yreg = 0, Zflag = 0, isExecuting = false) {
            this.PC = PC;
            this.IR = IR;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.Zflag = Zflag;
            this.isExecuting = isExecuting;
        }
        init() {
            this.PC = 0;
            this.IR = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = 0;
            this.isExecuting = false;
        }
        cycle() {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
            this.fetch();
            let operands = this.decode();
            this.execute(operands);
        }
        // Function for fetching an instruction
        fetch() {
            // Get the instruction from memory and increment the PC
            this.IR = _MemoryAccessor.callRead(this.PC);
            this.PC++;
        }
        // Function for decoding the instruction
        decode() {
            switch (this.IR) {
                // 1 operand
                case 0xA9: // LDA constant
                case 0xA2: // LDX constant
                case 0xA0: // LDY constant
                case 0xD0: // BNE
                    // Get the operand
                    let op = _MemoryAccessor.callRead(this.PC);
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
                    let op1 = _MemoryAccessor.callRead(this.PC);
                    this.PC++;
                    let op2 = _MemoryAccessor.callRead(this.PC);
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
        execute(operands) {
            switch (this.IR) {
                case 0xA9: // LDA constant
                    // Update the accumulator
                    this.Acc = operands[0];
                    break;
                case 0xAD: // LDA memory
                    // Convert the operands from little endian format to a plain address
                    // Since each operand is 8 bits, we can left shift the first one and do a bitwise OR
                    // te combine them into one whole address
                    let readAddr = operands[1] << 8 | operands[0];
                    // Set the accumulator to whatever is in memory at the given address
                    this.Acc = _MemoryAccessor.callRead(readAddr);
                    break;
                case 0x8D: // STA
                    // Convert the operands from little endian format to a plain address as described in 0xAD
                    let writeAddr = operands[1] << 8 | operands[0];
                    // Write the accumulator to memory
                    _MemoryAccessor.callWrite(writeAddr, this.Acc);
                    break;
                case 0xA2: // LDX constant
                    // Put the operand into the x register
                    this.Xreg = operands[0];
                    break;
                case 0xAE: // LDX memory
                    // Convert the operands from little endian format to a plain address as described in 0xAD
                    let xAddr = operands[1] << 8 | operands[0];
                    // Set the x register to the value in memory
                    this.Xreg = _MemoryAccessor.callRead(xAddr);
                    break;
                case 0xA0: // LDY constant
                    // Put the operand into the y register
                    this.Yreg = operands[0];
                    break;
                case 0xAC: // LDY memory
                    // Convert the operands from little endian format to a plain address as described in 0xAD
                    let yAddr = operands[1] << 8 | operands[0];
                    // Set the x register to the value in memory
                    this.Yreg = _MemoryAccessor.callRead(yAddr);
                    break;
                case 0x00: // BRK
                    // Call an interrupt for the OS to handle to end of the program execution
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(PROG_BREAK_IRQ, []));
                    break;
            }
        }
        // Function to update the table on the website
        updateCpuTable() {
            document.querySelector('#cpuPC').innerHTML = TSOS.Utils.getHexString(this.PC, 2, false);
            document.querySelector('#cpuIR').innerHTML = TSOS.Utils.getHexString(this.IR, 2, false);
            document.querySelector('#cpuAcc').innerHTML = TSOS.Utils.getHexString(this.Acc, 2, false);
            document.querySelector('#cpuXReg').innerHTML = TSOS.Utils.getHexString(this.Xreg, 2, false);
            document.querySelector('#cpuYReg').innerHTML = TSOS.Utils.getHexString(this.Yreg, 2, false);
            document.querySelector('#cpuZFlag').innerHTML = this.Zflag.toString();
        }
    }
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=cpu.js.map