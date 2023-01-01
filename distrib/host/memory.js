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
            // The state for the delay for getting the memory
            this.memoryState = TSOS.MemoryState.READY;
            this._readCalled = false;
            this.initializeMemoryTable();
        }
        // Called every clock tick
        pulse() {
            if (this._readCalled) {
                this.memoryState++;
                if (this.memoryState === TSOS.MemoryState.WAIT2) {
                    this.read();
                }
            }
        }
        initiateRead() {
            this._readCalled = true;
        }
        read() {
            // Get the value from the memory array
            this.mdr = this._memArr[this.mar];
            this.memoryState = TSOS.MemoryState.READY;
            this._readCalled = false;
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
            if (_CPU.opcodeAddr !== undefined) {
                document.querySelector(`#mem${_CPU.opcodeAddr}`).classList.add('opcode');
            }
            if (_CPU.operand0Addr !== undefined) {
                document.querySelector(`#mem${_CPU.operand0Addr}`).classList.add('operand');
            }
            if (_CPU.operand1Addr !== undefined) {
                document.querySelector(`#mem${_CPU.operand1Addr}`).classList.add('operand');
            }
        }
    }
    // The amount of space that is being addressed
    Memory.ADDRESSABLE_SPACE = 0x300;
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memory.js.map