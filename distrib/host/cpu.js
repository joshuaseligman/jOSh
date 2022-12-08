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
        constructor(PC = 0, IR = 0, Acc = 0, Xreg = 0, Yreg = 0, isExecuting = false) {
            this.PC = PC;
            this.IR = IR;
            this.Acc = Acc;
            this.Xreg = Xreg;
            this.Yreg = Yreg;
            this.isExecuting = isExecuting;
            // Variables for the memory table update to highlight the right things
            this.branchTaken = false;
            this.preBranchAddr = 0;
            this.alu = new TSOS.Alu();
        }
        init() {
            this.PC = 0;
            this.IR = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.isExecuting = false;
            // Fetch is first state
            this.pipelineState = TSOS.PipelineState.FETCH;
            // Start with nothing
            this._operand0 = 0x0;
            this._operand1 = 0x0;
            this._fetchState = TSOS.FetchState.FETCH0;
            this._decodeState = TSOS.DecodeState.DECODE0;
            this._executeState = TSOS.ExecuteState.EXECUTE0;
            this._writebackState = TSOS.WritebackState.WRITEBACK0;
        }
        cycle(newCycle = false) {
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
            if (newCycle) {
                this._fetchState = TSOS.FetchState.FETCH0;
            }
            switch (this.pipelineState) {
                case TSOS.PipelineState.FETCH:
                    this.fetch();
                    break;
                case TSOS.PipelineState.DECODE:
                    this.decode();
                    break;
                case TSOS.PipelineState.EXECUTE:
                    this.execute();
                    break;
                case TSOS.PipelineState.WRITEBACK:
                    this.writeback();
                    break;
            }
            // this.fetch();
            // let operands: number[] = this.decode();
            // // Make sure we have a valid instruction before trying to execute
            // if (operands !== undefined) {
            //     this.execute(operands);
            // }
        }
        // Function for fetching an instruction
        fetch() {
            _Kernel.krnTrace('CPU fetch ' + this._fetchState);
            // Get the instruction from memory and increment the PC
            switch (this._fetchState) {
                case TSOS.FetchState.FETCH0:
                    // Transfer the PC to the MAR
                    _MemoryAccessor.setMar(this.PC);
                    this._fetchState = TSOS.FetchState.FETCH1;
                    break;
                case TSOS.FetchState.FETCH1:
                    // Call read and wait for the instruction
                    _MemoryAccessor.callRead();
                    this._fetchState = TSOS.FetchState.FETCH2;
                    break;
                case TSOS.FetchState.FETCH2:
                    // if (_MemoryAccessor.isReady()) {
                    // Set the instruction register
                    this.IR = _MemoryAccessor.getMdr();
                    // Increment program counter and move to Decode phase
                    this.PC += 0x0001;
                    // Switch handle special instructions that do no need to decode
                    switch (this.IR) {
                        // No operands
                        case 0x8A: // TXA
                        case 0x98: // TYA
                        case 0xAA: // TAX
                        case 0xA8: // TAY
                        case 0x00: // BRK
                            // Go straight to the execute phase
                            this.pipelineState = TSOS.PipelineState.EXECUTE;
                            this._executeState = TSOS.ExecuteState.EXECUTE0;
                            break;
                        case 0xEA: // NOP
                            // Go straight to interrupt check because no operation
                            this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                            break;
                        case 0xFF: // SYS (xReg = 1 or xReg = 2)
                            if (this.Xreg === 0x01 || this.Xreg == 0x02) {
                                // Immediately execute
                                this.pipelineState = TSOS.PipelineState.EXECUTE;
                                this._executeState = TSOS.ExecuteState.EXECUTE0;
                                break;
                            } // xReg = 3 will continue to the default
                        default: // All other instructions will perform a decode
                            this.pipelineState = TSOS.PipelineState.DECODE;
                            this._decodeState = TSOS.DecodeState.DECODE0;
                            this._hasSecondOperand = false;
                            break;
                    }
                    // }
                    break;
            }
        }
        // Function for decoding the instruction
        decode() {
            _Kernel.krnTrace('CPU decode ' + this._decodeState);
            switch (this.IR) {
                // One operand
                case 0xA9: // LDA constant
                case 0xA2: // LDX constant
                case 0xA0: // LDY constant
                case 0xD0: // BNE
                    switch (this._decodeState) {
                        case TSOS.DecodeState.DECODE0:
                            // Set the MAR to the program counter to get the one operand
                            _MemoryAccessor.setMar(this.PC);
                            this._decodeState = TSOS.DecodeState.DECODE1;
                            break;
                        case TSOS.DecodeState.DECODE1:
                            // Call read and wait for the operand to come back from memory
                            _MemoryAccessor.callRead();
                            this._decodeState = TSOS.DecodeState.DECODE2;
                            break;
                        case TSOS.DecodeState.DECODE2:
                            // if (_MemoryAccessor.isReady()) {
                            // Move to the execute phase
                            this.PC += 0x0001;
                            this.pipelineState = TSOS.PipelineState.EXECUTE;
                            this._executeState = TSOS.ExecuteState.EXECUTE0;
                            // }
                            break;
                    }
                    break;
                // Two operands
                case 0xAD: // LDA memory
                case 0x8D: // STA
                case 0xAE: // LDX memory
                case 0xAC: // LDY memory
                case 0x6D: // ADC
                case 0xEC: // CPX
                case 0xEE: // INC
                case 0xFF: // SYS (xReg = 3)
                    switch (this._decodeState) {
                        case TSOS.DecodeState.DECODE0:
                            // Get the first operand
                            _MemoryAccessor.setMar(this.PC);
                            this._decodeState = TSOS.DecodeState.DECODE1;
                            break;
                        case TSOS.DecodeState.DECODE1:
                            // Read the operand and move to the next decode step
                            _MemoryAccessor.callRead();
                            if (this._hasSecondOperand) {
                                this._decodeState = TSOS.DecodeState.DECODE3;
                            }
                            else {
                                this._decodeState = TSOS.DecodeState.DECODE2;
                            }
                            break;
                        case TSOS.DecodeState.DECODE2:
                            // if (_MemoryAccessor.isReady()) {
                            // Set the first operand and repeat for the second operand
                            this._operand0 = _MemoryAccessor.getMdr();
                            this.PC += 0x0001;
                            this._decodeState = TSOS.DecodeState.DECODE0;
                            this._hasSecondOperand = true;
                            // }
                            break;
                        case TSOS.DecodeState.DECODE3:
                            // if (_MemoryAccessor.isReady()) {
                            // Set the second operand and move to execute
                            this._operand1 = _MemoryAccessor.getMdr();
                            this.PC += 0x0001;
                            this.pipelineState = TSOS.PipelineState.EXECUTE;
                            this._executeState = TSOS.ExecuteState.EXECUTE0;
                            // }
                            break;
                    }
                    break;
                // Invalid opcode
                default:
                    // Add the interrupt to kill the process and return nothing
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(INVALID_OPCODE_IRQ, [this.IR]));
                    // Get the interrupt processed ASAP
                    this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                    break;
            }
        }
        // Function for executing the instruction
        execute() {
            _Kernel.krnTrace('CPU execute ' + this._executeState);
            switch (this.IR) {
                case 0xA9: // LDA constant
                    // Place the operand in the accumulator
                    this.Acc = _MemoryAccessor.getMdr();
                    // Move to the interrupt check
                    this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                    break;
                case 0xAD: // LDA memory
                    // Get the value from memory
                    switch (this._executeState) {
                        case TSOS.ExecuteState.EXECUTE0:
                            _MemoryAccessor.setLowOrderByte(this._operand0);
                            this._executeState = TSOS.ExecuteState.EXECUTE1;
                            break;
                        case TSOS.ExecuteState.EXECUTE1:
                            _MemoryAccessor.setHighOrderByte(this._operand1);
                            this._executeState = TSOS.ExecuteState.EXECUTE2;
                            break;
                        case TSOS.ExecuteState.EXECUTE2:
                            _MemoryAccessor.callRead();
                            this._executeState = TSOS.ExecuteState.EXECUTE3;
                            break;
                        case TSOS.ExecuteState.EXECUTE3:
                            // if (_MemoryAccessor.isReady()) {
                            // Place the value in the accumulator
                            this.Acc = _MemoryAccessor.getMdr();
                            // Move to the interrupt check
                            this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                            // }
                            break;
                    }
                    break;
                case 0x8D: // STA
                    switch (this._executeState) {
                        // Set the address we want to write to
                        case TSOS.ExecuteState.EXECUTE0:
                            _MemoryAccessor.setLowOrderByte(this._operand0);
                            this._executeState = TSOS.ExecuteState.EXECUTE1;
                            break;
                        case TSOS.ExecuteState.EXECUTE1:
                            _MemoryAccessor.setHighOrderByte(this._operand1);
                            this._executeState = TSOS.ExecuteState.EXECUTE2;
                            break;
                        case TSOS.ExecuteState.EXECUTE2:
                            // Set the MDR appropriately
                            _MemoryAccessor.setMdr(this.Acc);
                            this._executeState = TSOS.ExecuteState.EXECUTE3;
                            break;
                        case TSOS.ExecuteState.EXECUTE3:
                            // Call write
                            _MemoryAccessor.callWrite();
                            // Move to the interrupt check
                            this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                            break;
                    }
                    break;
                case 0x8A: // TXA
                    // Transfer X reg to ACC
                    this.Acc = this.Xreg;
                    // Move to interrupt check
                    this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                    break;
                case 0x98: // TYA
                    // Transfer Y reg to ACC
                    this.Acc = this.Yreg;
                    // Move to interrupt check
                    this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                    break;
                case 0x6D: // ADC
                    switch (this._executeState) {
                        // Set the address of the value we want to add
                        case TSOS.ExecuteState.EXECUTE0:
                            _MemoryAccessor.setLowOrderByte(this._operand0);
                            this._executeState = TSOS.ExecuteState.EXECUTE1;
                            break;
                        case TSOS.ExecuteState.EXECUTE1:
                            _MemoryAccessor.setHighOrderByte(this._operand1);
                            this._executeState = TSOS.ExecuteState.EXECUTE2;
                            break;
                        case TSOS.ExecuteState.EXECUTE2:
                            _MemoryAccessor.callRead();
                            this._executeState = TSOS.ExecuteState.EXECUTE3;
                            break;
                        case TSOS.ExecuteState.EXECUTE3:
                            // if (_MemoryAccessor.isReady()) {
                            // Call add
                            this.Acc = this.alu.addWithCarry(this.Acc, _MemoryAccessor.getMdr());
                            // Move to the interrupt check
                            this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                            // }
                            break;
                    }
                    break;
                case 0xA2: // LDX constant
                    // Put the operand in the X reg
                    this.Xreg = _MemoryAccessor.getMdr();
                    // Move to interrupt check
                    this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                    break;
                case 0xAE: // LDX memory
                    switch (this._executeState) {
                        // Set the address of the value we want to load
                        case TSOS.ExecuteState.EXECUTE0:
                            _MemoryAccessor.setLowOrderByte(this._operand0);
                            this._executeState = TSOS.ExecuteState.EXECUTE1;
                            break;
                        case TSOS.ExecuteState.EXECUTE1:
                            _MemoryAccessor.setHighOrderByte(this._operand1);
                            this._executeState = TSOS.ExecuteState.EXECUTE2;
                            break;
                        case TSOS.ExecuteState.EXECUTE2:
                            _MemoryAccessor.callRead();
                            this._executeState = TSOS.ExecuteState.EXECUTE3;
                            break;
                        case TSOS.ExecuteState.EXECUTE3:
                            // if (_MemoryAccessor.isReady()) {
                            // Place the value in the X reg
                            this.Xreg = _MemoryAccessor.getMdr();
                            // Move to the interrupt check
                            this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                            // }
                            break;
                    }
                    break;
                case 0xAA: // TAX
                    // Transfer ACC to X reg
                    this.Xreg = this.Acc;
                    // Move to interrupt check
                    this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                    break;
                case 0xA0: // LDY constant
                    // Put the operand in the Y reg
                    this.Yreg = _MemoryAccessor.getMdr();
                    // Move to interrupt check
                    this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                    break;
                case 0xAC: // LDY memory
                    switch (this._executeState) {
                        // Set the address of the value we want to load
                        case TSOS.ExecuteState.EXECUTE0:
                            _MemoryAccessor.setLowOrderByte(this._operand0);
                            this._executeState = TSOS.ExecuteState.EXECUTE1;
                            break;
                        case TSOS.ExecuteState.EXECUTE1:
                            _MemoryAccessor.setHighOrderByte(this._operand1);
                            this._executeState = TSOS.ExecuteState.EXECUTE2;
                            break;
                        case TSOS.ExecuteState.EXECUTE2:
                            _MemoryAccessor.callRead();
                            this._executeState = TSOS.ExecuteState.EXECUTE3;
                            break;
                        case TSOS.ExecuteState.EXECUTE3:
                            // if (_MemoryAccessor.isReady()) {
                            // Place the value in the Y reg
                            this.Yreg = _MemoryAccessor.getMdr();
                            // Move to the interrupt check
                            this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                            // }
                            break;
                    }
                    break;
                case 0xA8: // TAY
                    // Transfer ACC to Y reg
                    this.Yreg = this.Acc;
                    // Move to interrupt check
                    this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                    break;
                case 0x00: // BRK
                    // Call an interrupt for the OS to handle to end of the program execution
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(PROG_BREAK_SINGLE_IRQ, []));
                    this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                    break;
                case 0xEC: // CPX
                    switch (this._executeState) {
                        // Set the address of the value we want to compare
                        case TSOS.ExecuteState.EXECUTE0:
                            _MemoryAccessor.setLowOrderByte(this._operand0);
                            this._executeState = TSOS.ExecuteState.EXECUTE1;
                            break;
                        case TSOS.ExecuteState.EXECUTE1:
                            _MemoryAccessor.setHighOrderByte(this._operand1);
                            this._executeState = TSOS.ExecuteState.EXECUTE2;
                            break;
                        case TSOS.ExecuteState.EXECUTE2:
                            _MemoryAccessor.callRead();
                            this._executeState = TSOS.ExecuteState.EXECUTE3;
                            break;
                        case TSOS.ExecuteState.EXECUTE3:
                            // Negate the value in the X register for later use (does not impact the actual register)
                            this.alu.negate(this.Xreg);
                            this._executeState = TSOS.ExecuteState.EXECUTE4;
                            break;
                        case TSOS.ExecuteState.EXECUTE4:
                            // if (_MemoryAccessor.isReady()) {
                            // Run the negated value in X and the value in memory through the adder to set the zFlag if needed
                            this.alu.addWithCarry(this.alu.getLastOutput(), _MemoryAccessor.getMdr());
                            // Go to the interrupt check
                            this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                            // }
                            break;
                    }
                    break;
                case 0xD0: // BNE
                    switch (this._executeState) {
                        case TSOS.ExecuteState.EXECUTE0:
                            // Branch only if the zFlag = 0
                            if (this.alu.getZFlag() == 0) {
                                // Variables for the memory display
                                this.preBranchAddr = this.PC;
                                this.branchTaken = true;
                                // Set the low order byte of the program counter with the branch
                                this.PC = this.PC & 0xFF00 | this.alu.addWithCarry(this.PC & 0x00FF, _MemoryAccessor.getMdr());
                                // Go to EXECUTE1 to update the high order byte of the program counter
                                this._executeState = TSOS.ExecuteState.EXECUTE1;
                            }
                            else {
                                // Branch was not taken
                                this.branchTaken = false;
                                // Go to interrupt check
                                this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                            }
                            break;
                        case TSOS.ExecuteState.EXECUTE1:
                            // Determine what the high order byte should be added to depending on the operand
                            let highOrderAdd = (_MemoryAccessor.getMdr() >> 7 === 1) ? 0xFF : 0x00;
                            // Set the high order byte of the program counter
                            this.PC = this.PC & 0x00FF | (this.alu.addWithCarry((this.PC & 0xFF00) >> 8, highOrderAdd, true) << 8);
                            // Go to the interrupt check
                            this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                            break;
                    }
                    break;
                case 0xEE: // INC
                    switch (this._executeState) {
                        // Set the address of the value we want to increment the value of
                        case TSOS.ExecuteState.EXECUTE0:
                            _MemoryAccessor.setLowOrderByte(this._operand0);
                            this._executeState = TSOS.ExecuteState.EXECUTE1;
                            break;
                        case TSOS.ExecuteState.EXECUTE1:
                            _MemoryAccessor.setHighOrderByte(this._operand1);
                            this._executeState = TSOS.ExecuteState.EXECUTE2;
                            break;
                        case TSOS.ExecuteState.EXECUTE2:
                            _MemoryAccessor.callRead();
                            this._executeState = TSOS.ExecuteState.EXECUTE3;
                            break;
                        case TSOS.ExecuteState.EXECUTE3:
                            // if (_MemoryAccessor.isReady()) {
                            // Transfer MDR to ACC
                            this.Acc = _MemoryAccessor.getMdr();
                            this._executeState = TSOS.ExecuteState.EXECUTE4;
                            // }
                            break;
                        case TSOS.ExecuteState.EXECUTE4:
                            /// Increment the value
                            this.Acc = this.alu.addWithCarry(this.Acc, 0x01);
                            // Go to the writeback state
                            this._writebackState = TSOS.WritebackState.WRITEBACK0;
                            this.pipelineState = TSOS.PipelineState.WRITEBACK;
                            break;
                    }
                    break;
                case 0xFF: // SYS
                    if (this.Xreg === 1) {
                        if (this.Yreg >> 7 === 1) {
                            // We have a negative number and have to put it in a usable format for base 10
                            let printableNum = -1 * this.alu.negate(this.Yreg);
                            // Make a system call for printing the number
                            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SYSCALL_PRINT_INT_IRQ, [printableNum]));
                        }
                        else {
                            // Make a system call for printing the number
                            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SYSCALL_PRINT_INT_IRQ, [this.Yreg]));
                        }
                    }
                    else if (this.Xreg === 2) {
                        // Convert the operands from little endian format to a plain address as described in 0xAD
                        _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SYSCALL_PRINT_STR_IRQ, [this.Yreg]));
                    }
                    else if (this.Xreg === 0x03) {
                        _KernelInterruptQueue.enqueue(new TSOS.Interrupt(SYSCALL_PRINT_STR_IRQ, [this._operand1 << 8 | this._operand0]));
                    }
                    this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
                    break;
            }
        }
        writeback() {
            _Kernel.krnTrace('CPU writeback ' + this._writebackState);
            // Rewrite the value
            if (this._writebackState === TSOS.WritebackState.WRITEBACK0) {
                _MemoryAccessor.setMdr(this.Acc);
                this._writebackState = TSOS.WritebackState.WRITEBACK1;
            }
            else {
                _MemoryAccessor.callWrite();
                this.pipelineState = TSOS.PipelineState.INTERRUPTCHECK;
            }
        }
        // Function to update the table on the website
        updateCpuTable() {
            switch (this.pipelineState) {
                case TSOS.PipelineState.FETCH:
                    document.querySelector('#cpuPipelineState').innerHTML = 'Fetch ' + this._fetchState;
                    break;
                case TSOS.PipelineState.DECODE:
                    document.querySelector('#cpuPipelineState').innerHTML = 'Decode ' + this._decodeState;
                    break;
                case TSOS.PipelineState.EXECUTE:
                    document.querySelector('#cpuPipelineState').innerHTML = 'Execute ' + this._executeState;
                    break;
                case TSOS.PipelineState.WRITEBACK:
                    document.querySelector('#cpuPipelineState').innerHTML = 'Writeback ' + this._writebackState;
                    break;
                case TSOS.PipelineState.INTERRUPTCHECK:
                    document.querySelector('#cpuPipelineState').innerHTML = 'Interrupt Check';
                    break;
            }
            document.querySelector('#cpuPC').innerHTML = TSOS.Utils.getHexString(this.PC, 2, false);
            document.querySelector('#cpuIR').innerHTML = TSOS.Utils.getHexString(this.IR, 2, false);
            document.querySelector('#cpuAcc').innerHTML = TSOS.Utils.getHexString(this.Acc, 2, false);
            document.querySelector('#cpuXReg').innerHTML = TSOS.Utils.getHexString(this.Xreg, 2, false);
            document.querySelector('#cpuYReg').innerHTML = TSOS.Utils.getHexString(this.Yreg, 2, false);
            document.querySelector('#cpuZFlag').innerHTML = this.alu.getZFlag().toString();
        }
        // Function to set all of the variables of the cpu at once
        setCpuStatus(newPC, newIR, newAcc, newXReg, newYReg, newZFlag) {
            // Update the CPU variables state
            this.PC = newPC;
            this.IR = newIR;
            this.Acc = newAcc;
            this.Xreg = newXReg;
            this.Yreg = newYReg;
            this.alu.setZFlag(newZFlag);
            this.updateCpuTable();
        }
    }
    TSOS.Cpu = Cpu;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=cpu.js.map