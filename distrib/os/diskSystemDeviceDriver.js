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
        // Possible outputs
        // 0: File created successfully
        // 1: Disk is not formatted yet
        // 2: File already exists
        // 3: No available directory blocks
        // 4: No available data blocks
        createFile(fileName) {
            // Assume the file is successfully created
            let out = 0;
            if (!this.isFormatted) {
                out = 1;
            }
            else {
                // Initialize the first open directory spot to be an empty string because nothing is there yet
                let firstOpenDir = '';
                for (let s = 0; s < NUM_SECTORS && out === 0; s++) {
                    for (let b = 0; b < NUM_BLOCKS && out === 0; b++) {
                        if (s === 0 && b === 0) {
                            // 0:0:0 is for the master boot record
                            // Directory is 0:0:1 - 0:1:7
                            continue;
                        }
                        let blockEntry = sessionStorage.getItem(`0:${s}:${b}`);
                        // The block is unavailable, so check to make sure the file doesn't already exist
                        if (blockEntry.charAt(1) === '1') {
                            // Get the remaining 60 bytes of data
                            let fileMetadata = blockEntry.substring(8);
                            // Work to get the file name by going byte by byte through the data
                            let fileNameCheck = '';
                            let charIndex = 0;
                            let endFound = false;
                            while (charIndex < fileMetadata.length && !endFound) {
                                // Get the character code stored at the given byte
                                let nextCharCode = parseInt(fileMetadata.substring(charIndex, charIndex + 2), 16);
                                if (nextCharCode === 0) {
                                    // End of file name
                                    endFound = true;
                                }
                                else {
                                    // Continue with the next character in the file name
                                    fileNameCheck += String.fromCharCode(nextCharCode);
                                    charIndex += 2;
                                }
                            }
                            // Make sure the names do not match
                            if (fileName === fileNameCheck) {
                                out = 2;
                            }
                        }
                        else if (firstOpenDir === '') {
                            // Set the first open directory space accordingly
                            firstOpenDir = `0:${s}:${b}`;
                        }
                    }
                }
                let firstOpenData = '';
                // Data blocks start in track 1
                for (let t = 1; t < NUM_TRACKS && firstOpenData === ''; t++) {
                    for (let s = 0; s < NUM_SECTORS && firstOpenData === ''; s++) {
                        for (let b = 0; b < NUM_BLOCKS && firstOpenData === ''; b++) {
                            // The inUse byte is the first byte, but only need the second digit
                            let inUse = sessionStorage.getItem(`${t}:${s}:${b}`).charAt(1);
                            // 0 means it is available
                            if (inUse === '0') {
                                firstOpenData = `${t}:${s}:${b}`;
                            }
                        }
                    }
                }
                if (out === 0) {
                    if (firstOpenDir === '') {
                        // Return an error code if no available directory space
                        out = 3;
                    }
                    else if (firstOpenData === '') {
                        // Return an error code if no available data blocks
                        out = 4;
                    }
                    else {
                        // Start with marking the directory entry as unavailable
                        let directoryEntry = '01';
                        // Go through every other character in the open data (t:s:b)
                        for (let i = 0; i < firstOpenData.length; i += 2) {
                            directoryEntry += '0' + firstOpenData.charAt(i);
                        }
                        for (let j = 0; j < fileName.length; j++) {
                            directoryEntry += fileName.charCodeAt(j).toString(16).toUpperCase();
                        }
                        // Pad the rest with 0s (should be at least 2)
                        directoryEntry = directoryEntry.padEnd(BLOCK_SIZE * 2, '0');
                        // Save it on the disk and update the table
                        sessionStorage.setItem(firstOpenDir, directoryEntry);
                        // Mark the data block as unavailbale, give it the end of the file, and the data are all 0s
                        sessionStorage.setItem(firstOpenData, '01FFFFFF'.padEnd(BLOCK_SIZE * 2, '0'));
                        this.updateTable();
                    }
                }
            }
            return out;
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