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
                        sessionStorage.setItem(`${t}:${s}:${b}`, '00FFFFFF' + '0'.repeat((BLOCK_SIZE - 4) * 2));
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
                        // Add each character of the file name to the directory entry
                        for (let j = 0; j < fileName.length; j++) {
                            directoryEntry += fileName.charCodeAt(j).toString(16).padStart(2, '0').toUpperCase();
                        }
                        // Pad the rest with 0s (should be at least 2)
                        directoryEntry = directoryEntry.padEnd(BLOCK_SIZE * 2, '0');
                        // Save it on the disk and update the table
                        sessionStorage.setItem(firstOpenDir, directoryEntry);
                        // Mark the data block as unavailable, give it the end of the file, and the data are all 0s
                        sessionStorage.setItem(firstOpenData, '01FFFFFF'.padEnd(BLOCK_SIZE * 2, '0'));
                        this.updateTable();
                    }
                }
            }
            return out;
        }
        // Possible outputs
        // 0: Write successful
        // 1: Disk is not formatted yet
        // 2: File not found
        // 3: Partial write (need more space)
        // 4: Internal error (file block given is available)
        writeFile(fileName, contents) {
            let out = 0;
            if (!this.isFormatted) {
                // Disk is not formatted
                out = 1;
            }
            else {
                let curFileBlock = this.getFirstDataBlockForFile(fileName);
                if (curFileBlock === '') {
                    // File was not found
                    out = 2;
                }
                else {
                    let contentsHex = '';
                    for (let i = 0; i < contents.length; i++) {
                        // Add the hex representation of each character to the file contents
                        contentsHex += contents.charCodeAt(i).toString(16).padStart(2, '0').toUpperCase();
                    }
                    // Add the EOF operator to the end of the contents hex string
                    contentsHex += '00';
                    // Flag to help determine the next block that is needed. Default to true so we use the blocks already in use before going to a new block
                    let isUsingNextTsb = true;
                    // Write until there is nothing left to write
                    let remainingContents = contentsHex;
                    while (remainingContents.length > 0 && out === 0) {
                        if (sessionStorage.getItem(curFileBlock).charAt(1) === '0') {
                            // The block should always be available
                            out = 4;
                        }
                        else {
                            // Separate the first 60 "bytes" of data and the remaining data
                            let contentsToWrite = remainingContents.substring(0, (BLOCK_SIZE - 4) * 2).padEnd((BLOCK_SIZE - 4) * 2, '0');
                            remainingContents = remainingContents.substring((BLOCK_SIZE + 4) * 2);
                            // Write the contents to the file
                            sessionStorage.setItem(curFileBlock, sessionStorage.getItem(curFileBlock).substring(0, 8) + contentsToWrite);
                            if (sessionStorage.getItem(curFileBlock).substring(2, 8) === 'FFFFFF') {
                                isUsingNextTsb = false;
                            }
                            // Check to see if there is still more to write
                            if (remainingContents.length > 0) {
                                let newTsb = '';
                                if (isUsingNextTsb) {
                                    // Use the next block in the link because we know it is already reserved for the given file
                                    let nextTsbInfo = sessionStorage.getItem(curFileBlock).substring(2, 8);
                                    newTsb = `${nextTsbInfo.charAt(1)}:${nextTsbInfo.charAt(3)}:${nextTsbInfo.charAt(5)}`;
                                }
                                else {
                                    // Otherwise, use the next available block
                                    newTsb = this.getFirstAvailableDataBlock();
                                }
                                // Check if the next block was found or not
                                if (newTsb === '') {
                                    // Remove the last byte to replace with an EOF operator
                                    sessionStorage.setItem(curFileBlock, sessionStorage.getItem(curFileBlock).substring(0, BLOCK_SIZE * 2 - 2) + '00');
                                    out = 3;
                                }
                                else {
                                    // Update the current file block with the new link
                                    let updatedFileBlock = sessionStorage.getItem(curFileBlock).substring(0, 2) + '0' + newTsb.charAt(0) + '0' + newTsb.charAt(2) + '0' + newTsb.charAt(4) + sessionStorage.getItem(curFileBlock).substring(8);
                                    sessionStorage.setItem(curFileBlock, updatedFileBlock);
                                    // Set the status of the new block to be in use and as the end of the file
                                    sessionStorage.setItem(newTsb, '01' + sessionStorage.getItem(newTsb).substring(2, 8) + '0'.repeat((BLOCK_SIZE - 4) * 2));
                                    // Set the current TSB to the new TSB
                                    curFileBlock = newTsb;
                                }
                            }
                            else {
                                let nextTsb = sessionStorage.getItem(curFileBlock).substring(2, 8);
                                console.log(nextTsb);
                                while (nextTsb !== 'FFFFFF') {
                                    let nextKey = `${nextTsb.charAt(1)}:${nextTsb.charAt(3)}:${nextTsb.charAt(5)}`;
                                    sessionStorage.setItem(nextKey, '00' + sessionStorage.getItem(nextKey).substring(2));
                                    nextTsb = sessionStorage.getItem(nextKey).substring(2, 8);
                                    console.log(nextTsb);
                                }
                                sessionStorage.setItem(curFileBlock, sessionStorage.getItem(curFileBlock).substring(0, 2) + 'FFFFFF' + sessionStorage.getItem(curFileBlock).substring(8));
                            }
                        }
                    }
                }
                // Update the HTML and return the status code
                this.updateTable();
            }
            return out;
        }
        getFileList() {
            let fileList = [];
            if (this.isFormatted) {
                for (let s = 0; s < NUM_SECTORS; s++) {
                    for (let b = 0; b < NUM_BLOCKS; b++) {
                        if (s === 0 && b === 0) {
                            // Skip 0:0:0 (Master boot record)
                            continue;
                        }
                        // Get the directory entry
                        let directoryEntry = sessionStorage.getItem(`0:${s}:${b}`);
                        // Make sure the directory entry is in use
                        if (directoryEntry.charAt(1) === '1') {
                            // The hex representation of the name
                            let fileNameHex = directoryEntry.substring(8);
                            // The real representation of the file name
                            let fileName = '';
                            let endFound = false;
                            // Every 2 characters is a byte = real character
                            for (let i = 0; i < fileNameHex.length && !endFound; i += 2) {
                                let charCode = parseInt(fileNameHex.substring(i, i + 2), 16);
                                if (charCode === 0) {
                                    endFound = true;
                                }
                                else {
                                    fileName += String.fromCharCode(charCode);
                                }
                            }
                            fileList.push(fileName);
                        }
                    }
                }
            }
            return fileList;
        }
        getFirstDataBlockForFile(fileName) {
            let outTsb = '';
            for (let s = 0; s < NUM_SECTORS && outTsb === ''; s++) {
                for (let b = 0; b < NUM_BLOCKS && outTsb === ''; b++) {
                    if (s === 0 && b === 0) {
                        // 0:0:0 is the MBR
                        continue;
                    }
                    let directoryEntry = sessionStorage.getItem(`0:${s}:${b}`);
                    // The hex representation of the name
                    let fileNameHex = directoryEntry.substring(8);
                    // The real representation of the file name
                    let fileNameStr = '';
                    let endFound = false;
                    // Every 2 characters is a byte = real character
                    for (let i = 0; i < fileNameHex.length && !endFound; i += 2) {
                        let charCode = parseInt(fileNameHex.substring(i, i + 2), 16);
                        if (charCode === 0) {
                            endFound = true;
                        }
                        else {
                            fileNameStr += String.fromCharCode(charCode);
                        }
                    }
                    if (fileName === fileNameStr) {
                        // Establish the key of the first block of the data because we found the file in the directory
                        outTsb = `${directoryEntry.charAt(3)}:${directoryEntry.charAt(5)}:${directoryEntry.charAt(7)}`;
                    }
                }
            }
            return outTsb;
        }
        getFirstAvailableDataBlock() {
            // The TSB to return (initialized to nothing)
            let dataTsb = '';
            // Go through each data block
            for (let t = 1; t < NUM_TRACKS && dataTsb === ''; t++) {
                for (let s = 0; s < NUM_SECTORS && dataTsb === ''; s++) {
                    for (let b = 0; b < NUM_BLOCKS && dataTsb === ''; b++) {
                        // Find the first data block that is not in use
                        if (sessionStorage.getItem(`${t}:${s}:${b}`).charAt(1) === '0') {
                            dataTsb = `${t}:${s}:${b}`;
                        }
                    }
                }
            }
            return dataTsb;
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