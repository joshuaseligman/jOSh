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
                    row.children[j].innerHTML = TSOS.Utils.getHexString(this._memArr[i * 8 + j - 1], 2, false);
                }
            }
        }
        write(addr, val) {
            // Sets the location in memory to be the value
            this._memArr[addr] = val;
        }
    }
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memory.js.map