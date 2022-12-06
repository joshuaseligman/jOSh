var TSOS;
(function (TSOS) {
    // This class represents the memory array
    class Memory {
        constructor() {
            // We are creating an array of size 3 * 0x100
            this._memArr = new Uint8Array(Memory.ADDRESSABLE_SPACE);
            // Initialize the MAR and MDR to be 0
            this.mar = 0x0;
            this.mdr = 0x0;
            this.initializeMemoryTable();
        }
        read() {
            // Get the value from the memory array
            this.mdr = this._memArr[this.mar];
        }
        write() {
            // Set the value in the memory array appropriately
            this._memArr[this.mar] = this.mdr;
        }
        readImmediate(addr) {
            // Returns the value stored in memory at that location
            return this._memArr[addr];
        }
        writeImmediate(addr, val) {
            // Sets the location in memory to be the value
            this._memArr[addr] = val;
        }
        // Memory table is initially empty, so we need to fill it with the appropriate elements
        initializeMemoryTable() {
            let memTable = document.querySelector('#memTable');
            // We want to make a row for every 8 addresses
            for (let i = 0; i < this._memArr.length / 8; i++) {
                // Add a new row to the memory table
                memTable.insertRow();
                // The first element of the row will be the address of the first data element of the row
                let addrElement = document.createElement('td');
                // Since there are 8 bytes per row, the address at the start will be i * 8
                addrElement.innerHTML = TSOS.Utils.getHexString(i * 8, 3, true);
                memTable.rows[memTable.rows.length - 1].appendChild(addrElement);
                // Iterate through each of the data elements in the row and set them to 0
                for (let j = 0; j < 8; j++) {
                    let dataElement = document.createElement('td');
                    dataElement.id = `mem${i * 8 + j}`;
                    dataElement.innerHTML = TSOS.Utils.getHexString(0, 2, false);
                    memTable.rows[memTable.rows.length - 1].appendChild(dataElement);
                }
            }
        }
        // Update the table with the updated values
        updateMemoryTable() {
            let memTable = document.querySelector('#memTable');
            // Iterate through each row of the table
            for (let i = 0; i < memTable.rows.length; i++) {
                // Get the row
                let row = memTable.rows[i];
                // The actual data goes from index 1 to 8
                for (let j = 1; j <= 8; j++) {
                    // Clear the classes
                    row.children[j].classList.remove('opcode');
                    row.children[j].classList.remove('operand');
                    // Update the value in the HTML
                    row.children[j].innerHTML = TSOS.Utils.getHexString(this._memArr[i * 8 + j - 1], 2, false);
                }
            }
            // Update the classes for highlighting the opcode and operands
            if (_PCBReadyQueue.getSize() > 0) {
                this.setMemoryCellClasses();
            }
        }
        // Function to highlight the opcode and operands
        setMemoryCellClasses() {
            // The desired address is going to start at the current program counter - 1 (no operands)
            let desiredAddr = _MemoryAccessor.getPhysicalAddress(_CPU.PC - 1, _PCBReadyQueue.getHead().baseReg);
            // Initial assumption is that there were no operands
            let numOperands = 0;
            // Determine the location of the opcode and the number of operands
            switch (_CPU.IR) {
                // 1 operand
                case 0xA9: // LDA constant
                case 0xA2: // LDX constant
                case 0xA0: // LDY constant
                    // Go back 1 more spot in memory because we have 1 operand
                    desiredAddr--;
                    numOperands = 1;
                    break;
                // 2 operands
                case 0xAD: // LDA memory
                case 0x8D: // STA
                case 0x6D: // ADC
                case 0xAE: // LDX memory
                case 0xAC: // LDY memory
                case 0xEC: // CPX
                case 0xEE: // INC
                    // Go back 2 more spots in memory because we have 2 operands
                    desiredAddr -= 2;
                    numOperands = 2;
                    break;
                case 0xD0: // BNE
                    if (_CPU.branchTaken) {
                        // If the branch was taken, we want to go to the old PC before the branch and go back 2 spaces
                        desiredAddr = _CPU.preBranchAddr - 2;
                    }
                    else {
                        // Otherwise just go back 1 for the operand
                        desiredAddr--;
                    }
                    // Set the operands to 1
                    numOperands = 1;
                    break;
            }
            // Only show highlights if th CPU is running and the desired address is a valid address
            if (_CPU.isExecuting && desiredAddr >= _PCBReadyQueue.getHead().baseReg) {
                // Set the opcode to highlight as the opcode
                document.querySelector(`#mem${desiredAddr}`).classList.add('opcode');
                // Set the operands to be highlighted
                for (let i = desiredAddr + 1; i <= desiredAddr + numOperands; i++) {
                    document.querySelector(`#mem${i}`).classList.add('operand');
                }
            }
        }
    }
    // The amount of space that is being addressed
    Memory.ADDRESSABLE_SPACE = 0x300;
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memory.js.map