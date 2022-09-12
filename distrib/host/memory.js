var TSOS;
(function (TSOS) {
    // This class represents the memory array
    class Memory {
        constructor() {
            // We are creating an array of size 3 * 0x100
            this._memArr = new Uint8Array(0x300);
            this.initializeMemoryTable();
        }
        initializeMemoryTable() {
            let memTable = document.querySelector('#memTable');
            for (let i = 0; i < 32 * 3; i++) {
                memTable.insertRow();
                let addrElement = document.createElement('td');
                addrElement.innerHTML = TSOS.Utils.getHexString(i * 8, 3, true);
                memTable.rows[memTable.rows.length - 1].appendChild(addrElement);
                for (let j = 0; j < 8; j++) {
                    let dataElement = document.createElement('td');
                    dataElement.innerHTML = TSOS.Utils.getHexString(0, 2, false);
                    memTable.rows[memTable.rows.length - 1].appendChild(dataElement);
                }
            }
        }
        // Function that works with the table on the website and updates each value
        updateMemoryTable() {
            let memTable = document.querySelector('#memTable');
        }
    }
    TSOS.Memory = Memory;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memory.js.map