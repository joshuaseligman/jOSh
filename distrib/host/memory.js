var TSOS;
(function (TSOS) {
    // This class represents the memory array
    class Memory {
        constructor() {
            // We are creating an array of size 3 * 0x100
            this._memArr = new Uint8Array(0x300);
            this.initializeMemoryTable();
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
                    row.children[j].classList.remove('opcode');
                    row.children[j].classList.remove('operand');
                    row.children[j].innerHTML = TSOS.Utils.getHexString(this._memArr[i * 8 + j - 1], 2, false);
                }
            }
            this.setMemoryCellClasses();
        }
        setMemoryCellClasses() {
            let desiredAddr = _CPU.PC - 1;
            let numOperands = 0;
            switch (_CPU.IR) {
                // 1 operand
                case 0xA9: // LDA constant
                case 0xA2: // LDX constant
                case 0xA0: // LDY constant
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
                    desiredAddr -= 2;
                    numOperands = 2;
                    break;
                case 0xD0: // BNE
                    if (_CPU.branchTaken) {
                        desiredAddr = _CPU.preBranchAddr - 2;
                    }
                    else {
                        desiredAddr--;
                    }
                    numOperands = 1;
                    break;
            }
            if (_CPU.isExecuting) {
                document.querySelector(`#mem${_MemoryAccessor.getRealAddress(desiredAddr, _MemoryAccessor.curSection)}`).classList.add('opcode');
                for (let i = desiredAddr + 1; i <= desiredAddr + numOperands; i++) {
                    document.querySelector(`#mem${_MemoryAccessor.getRealAddress(i, _MemoryAccessor.curSection)}`).classList.add('operand');
                }
            }
        }
        write(addr, val) {
            // Sets the location in memory to be the value
            this._memArr[addr] = val;
        }
        read(addr) {
            // Returns the value stored in memory at that location
            return this._memArr[addr];
        }
    }
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memory.js.map