var TSOS;
(function (TSOS) {
    // Extends DeviceDriver
    class DiskSystemDeviceDriver extends TSOS.DeviceDriver {
        constructor() {
            // Override the base method pointers.
            // The code below cannot run because "this" can only be
            // accessed after calling super.
            // super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            // So instead...
            super();
            this.driverEntry = this.krnDsDriverEntry;
            this.isFormatted = false;
        }
        krnDsDriverEntry() {
            // Initialization routine for this, the kernel-mode disk system Device Driver.
            this.status = "loaded";
            // More?
        }
        formatDisk() {
            for (let t = 0; t < NUM_TRACKS; t++) {
                for (let s = 0; s < NUM_SECTORS; s++) {
                    for (let b = 0; b < NUM_BLOCKS; b++) {
                        // Set each block to be 0s
                        // 2 * block size is the number of 0s needed because 2 hex digits is 1 byte
                        sessionStorage.setItem(`${t}:${s}:${b}`, '0'.repeat(2 * BLOCK_SIZE));
                    }
                }
            }
            this.updateTable();
            this.isFormatted = true;
        }
        updateTable() {
            if (this.isFormatted) {
                for (let t = 0; t < NUM_TRACKS; t++) {
                    for (let s = 0; s < NUM_SECTORS; s++) {
                        for (let b = 0; b < NUM_BLOCKS; b++) {
                            // Get the HTML element and the data from storage
                            let tableRow = document.querySelector(`#t${t}s${s}b${b}`);
                            let storage = sessionStorage.getItem(`${t}:${s}:${b}`);
                            // Iterate through each of the cells of the row, excluding the first column
                            for (let i = 1; i < tableRow.cells.length; i++) {
                                switch (i) {
                                    case 1:
                                        // First cell is if the block is in use
                                        tableRow.cells[i].innerHTML = storage.charAt(1);
                                        break;
                                    case 2:
                                        // Second cell is the next tsb for linked allocation
                                        tableRow.cells[i].innerHTML = storage.charAt(3) + ':' + storage.charAt(5) + ':' + storage.charAt(7);
                                        break;
                                    case 3:
                                        // Last cell is the 60 bytes of data
                                        tableRow.cells[i].innerHTML = storage.substring(8);
                                        break;
                                }
                            }
                        }
                    }
                }
            }
            else {
                // Add the header to the table here because the table has not been populated yet
                document.querySelector('#diskTable').innerHTML = '<tr> <th>T:S:B</th> <th>In Use</th> <th>Next T:S:B</th> <th>Data</th> </tr>';
                // We need to create a new row in the table for each block in memory
                for (let t = 0; t < NUM_TRACKS; t++) {
                    for (let s = 0; s < NUM_SECTORS; s++) {
                        for (let b = 0; b < NUM_BLOCKS; b++) {
                            // Create the row element with the appropriate id
                            let newRow = document.createElement('tr');
                            newRow.id = `t${t}s${s}b${b}`;
                            // Create the tsb element and add it to the row
                            let tsbElem = document.createElement('td');
                            tsbElem.innerHTML = `${t}:${s}:${b}`;
                            newRow.appendChild(tsbElem);
                            // Get the current data stored in the block (should be all 0s)
                            let storage = sessionStorage.getItem(`${t}:${s}:${b}`);
                            // Get the in use byte (only need the second digit because 1 or 0) and add the element
                            let inUseElem = document.createElement('td');
                            inUseElem.innerHTML = storage.charAt(1);
                            newRow.appendChild(inUseElem);
                            // Get the next 3 bytes for the next tsb and add the element
                            let nextTsbElem = document.createElement('td');
                            // 3 bytes is 6 characters, but only need the second digit of each byte because everything only needs 1 digit
                            nextTsbElem.innerHTML = storage.charAt(3) + ':' + storage.charAt(5) + ':' + storage.charAt(7);
                            newRow.appendChild(nextTsbElem);
                            // Get the rest of the data and add the element
                            let dataElem = document.createElement('td');
                            dataElem.innerHTML = storage.substring(8);
                            newRow.appendChild(dataElem);
                            // Add the row to the table
                            document.querySelector('#diskTable').appendChild(newRow);
                        }
                    }
                }
            }
        }
    }
    TSOS.DiskSystemDeviceDriver = DiskSystemDeviceDriver;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=diskSystemDeviceDriver.js.map