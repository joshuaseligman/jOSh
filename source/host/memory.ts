module TSOS {
    // This class represents the memory array
    export class Memory {

        // The 6502 has a word size of 1 byte, so each element should be 8 bits
        private _memArr: Uint8Array;

        constructor() {
            // We are creating an array of size 3 * 0x100
            this._memArr = new Uint8Array(0x300);

            this.initializeMemoryTable();
        }

        private initializeMemoryTable(): void {
            let memTable: HTMLTableElement = document.querySelector('#memTable');
            
            // We want to make a row for every 8 addresses
            for (let i: number = 0; i < this._memArr.length / 8; i ++) {
                // Add a new row to the memory table
                memTable.insertRow();

                // The first element of the row will be the address of the first data element of the row
                let addrElement: HTMLTableCellElement = document.createElement('td');

                // Since there are 8 bytes per row, the address at the start will be i * 8
                addrElement.innerHTML = Utils.getHexString(i * 8, 3, true);
                memTable.rows[memTable.rows.length - 1].appendChild(addrElement);

                // Iterate through each of the data elements in the row and set them to 0
                for (let j: number = 0; j < 8; j++) {
                    let dataElement: HTMLTableCellElement = document.createElement('td');
                    dataElement.innerHTML = Utils.getHexString(0, 2, false);
                    memTable.rows[memTable.rows.length - 1].appendChild(dataElement);
                }
            }
        }
    }
}