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
        formatDisk(quick) {
            for (let t = 0; t < NUM_TRACKS; t++) {
                for (let s = 0; s < NUM_SECTORS; s++) {
                    for (let b = 0; b < NUM_BLOCKS; b++) {
                        // If a quick format is called and the disk has not been formatted before, it will be the same as a low-level format (to set up the session storage)
                        if (quick && this.isFormatted) {
                            // Only set the overhead to make the block free. the data can stay where it is
                            sessionStorage.setItem(`${t}:${s}:${b}`, '00FFFFFF' + sessionStorage.getItem(`${t}:${s}:${b}`).substring(8));
                        }
                        else {
                            // Set each block to be 0s
                            // 2 * (block size - 4) is the number of 0s needed because 2 hex digits is 1 byte and we are starting with a 4 byte overhead
                            sessionStorage.setItem(`${t}:${s}:${b}`, '00FFFFFF' + '0'.repeat((BLOCK_SIZE - 4) * 2));
                        }
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
                // Check if the file already exists
                let nameCheck = this.getDirectoryBlockForFile(fileName);
                if (nameCheck !== '') {
                    out = 2;
                }
                else {
                    // If the file does not exist, then we can try to allocate space on the disk
                    let firstOpenDir = this.getFirstAvailableDirectoryBlock();
                    let firstOpenData = this.getFirstAvailableDataBlock();
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
                        let fileNameHex = '';
                        // Add each character of the file name to the directory entry
                        for (let j = 0; j < fileName.length; j++) {
                            fileNameHex += fileName.charCodeAt(j).toString(16).padStart(2, '0').toUpperCase();
                        }
                        // Pad the rest with 0s
                        fileNameHex = fileNameHex.padEnd(MAX_FILE_NAME_LENGTH * 2, '0');
                        // Make sure the file name has 00 in it to mark the end of the name
                        // We saved room for this when choosing the value for MAX_FILE_NAME_LENGTH
                        fileNameHex += '00';
                        directoryEntry += fileNameHex;
                        // Get the date and store it in hex
                        let date = TSOS.Utils.getDate(false).split('/');
                        date = date.map((elem) => parseInt(elem).toString(16).toUpperCase());
                        directoryEntry += date.join('');
                        // We are initially using 2 block on the disk (1 for directory and 1 for data)
                        directoryEntry += '02';
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
        // 0: File created successfully
        // 1: Disk is not formatted yet
        // 2: File already exists
        // 3: No available directory blocks
        // 4: Not enough available data blocks
        createFileWithInitialSize(fileName, sizeInBytes) {
            let out = 0;
            if (!this.isFormatted) {
                out = 1;
            }
            else {
                // Check if the file already exists
                let nameCheck = this.getDirectoryBlockForFile(fileName);
                if (nameCheck !== '') {
                    out = 2;
                }
                else {
                    // If the file does not exist, then we can try to allocate space on the disk
                    let firstOpenDir = this.getFirstAvailableDirectoryBlock();
                    // The number of blocks needed is the size needed divided by the amount of data space per block
                    let numBlocksNeeded = Math.ceil(sizeInBytes / (BLOCK_SIZE - 4));
                    let availableBlocks = this.getAvailableDataBlocks(numBlocksNeeded);
                    if (firstOpenDir === '') {
                        // There are no open directory spots
                        out = 3;
                    }
                    else if (availableBlocks.length < numBlocksNeeded) {
                        // Make sure there are enough available data blocks to meet the request
                        out = 4;
                    }
                    else {
                        // Start with marking the directory entry as unavailable
                        let directoryEntry = '01';
                        // Go through every other character in the first open data block (t:s:b)
                        for (let i = 0; i < availableBlocks[0].length; i += 2) {
                            directoryEntry += '0' + availableBlocks[0].charAt(i);
                        }
                        let fileNameHex = '';
                        // Add each character of the file name to the directory entry
                        for (let j = 0; j < fileName.length; j++) {
                            fileNameHex += fileName.charCodeAt(j).toString(16).padStart(2, '0').toUpperCase();
                        }
                        // Pad the rest with 0s
                        fileNameHex = fileNameHex.padEnd(MAX_FILE_NAME_LENGTH * 2, '0');
                        // Make sure the file name has 00 in it to mark the end of the name
                        // We saved room for this when choosing the value for MAX_FILE_NAME_LENGTH
                        fileNameHex += '00';
                        directoryEntry += fileNameHex;
                        // Get the date and store it in hex
                        let date = TSOS.Utils.getDate(false).split('/');
                        date = date.map((elem) => parseInt(elem).toString(16).toUpperCase());
                        directoryEntry += date.join('');
                        // Set the number of blocks in use based on the number of blocks needed
                        directoryEntry += (numBlocksNeeded + 1).toString(16).toUpperCase().padStart(2, '0');
                        // Save it on the disk and update the table
                        sessionStorage.setItem(firstOpenDir, directoryEntry);
                        // Mark the data block as unavailable, give it the next block, and the data are all 0s
                        for (let k = 0; k < availableBlocks.length; k++) {
                            let newDataEntry = '01';
                            if (k === availableBlocks.length - 1) {
                                // Last block is the end of the file
                                newDataEntry += 'FFFFFF';
                            }
                            else {
                                // Get the TSB of the next block
                                for (let l = 0; l < availableBlocks[k + 1].length; l += 2) {
                                    newDataEntry += '0' + availableBlocks[k + 1].charAt(l);
                                }
                            }
                            // Update the disk accordingly
                            sessionStorage.setItem(availableBlocks[k], newDataEntry.padEnd(BLOCK_SIZE * 2, '0'));
                        }
                        this.updateTable();
                    }
                }
            }
            return out;
        }
        // Possible outputs at index 0
        // 0: Read successful (will contain a second element with the array of character codes)
        // 1: Disk is not formatted yet
        // 2: File not found
        // 3: Internal error (link ends before reaching 00 EOF)
        readFile(fileName) {
            let out = [0];
            if (!this.isFormatted) {
                // Make sure the disk is formatted first
                out[0] = 1;
            }
            else {
                let curFileBlock = this.getFirstDataBlockForFile(fileName);
                if (curFileBlock === '') {
                    // File is not found if the file block is an empty string
                    out[0] = 2;
                }
                else {
                    // Boolean to represent the end of the file
                    let endFound = false;
                    // The character codes that need to be printed
                    let outHexArr = [];
                    // Continue until the end of the file or an error
                    while (!endFound && out[0] === 0) {
                        // Make sure the block is valid
                        if (curFileBlock !== 'F:F:F') {
                            // Make sure the block is not available
                            if (sessionStorage.getItem(curFileBlock).charAt(1) === '1') {
                                // Get the data in the current block
                                let curData = sessionStorage.getItem(curFileBlock).substring(8);
                                // Go through the block one byte at a time
                                for (let i = 0; i < curData.length && !endFound; i += 2) {
                                    let hexChar = curData.substring(i, i + 2);
                                    if (hexChar === '00') {
                                        // The end of the file has been found
                                        endFound = true;
                                    }
                                    else {
                                        // Add the character code to the array
                                        outHexArr.push(parseInt(hexChar, 16));
                                    }
                                }
                                // Go to the next block if needed
                                if (!endFound) {
                                    let nextTsb = sessionStorage.getItem(curFileBlock).substring(2, 8);
                                    curFileBlock = `${nextTsb.charAt(1)}:${nextTsb.charAt(3)}:${nextTsb.charAt(5)}`;
                                }
                            }
                            else {
                                // Trying to read from an available block
                                out[0] = 4;
                            }
                        }
                        else {
                            // Error if the block is not valid (no end of file marker)
                            out[0] = 4;
                        }
                    }
                    // Only add the hex data if the read was successful
                    if (out[0] === 0) {
                        out.push(outHexArr);
                    }
                }
            }
            return out;
        }
        // 0: Read successful (will contain a second element with the array of character codes)
        // 1: Disk is not formatted yet
        // 2: File not found
        // 3: Internal error
        readFileRaw(fileName, numBytes) {
            let out = [0];
            if (!this.isFormatted) {
                out[0] = 1;
            }
            else {
                let curFileBlock = this.getFirstDataBlockForFile(fileName);
                if (curFileBlock === '') {
                    // File is not found if the file block is an empty string
                    out[0] = 2;
                }
                else {
                    // Number of bytes read so far
                    let bytesRead = 0;
                    // The character codes that need to be printed
                    let outHexArr = [];
                    // Continue until the end of the file or an error
                    while (bytesRead < numBytes && out[0] === 0) {
                        // Make sure the block is valid
                        if (curFileBlock !== 'F:F:F') {
                            // Make sure the block is not available
                            if (sessionStorage.getItem(curFileBlock).charAt(1) === '1') {
                                // Get the data in the current block
                                let curData = sessionStorage.getItem(curFileBlock).substring(8);
                                // Go through the block one byte at a time
                                for (let i = 0; i < curData.length && bytesRead < numBytes; i += 2) {
                                    let hexChar = curData.substring(i, i + 2);
                                    // Add the character code to the array
                                    outHexArr.push(parseInt(hexChar, 16));
                                    bytesRead++;
                                }
                                // Go to the next block if needed
                                if (bytesRead < numBytes) {
                                    let nextTsb = sessionStorage.getItem(curFileBlock).substring(2, 8);
                                    curFileBlock = `${nextTsb.charAt(1)}:${nextTsb.charAt(3)}:${nextTsb.charAt(5)}`;
                                }
                            }
                            else {
                                // Trying to read from an available block
                                out[0] = 3;
                            }
                        }
                        else {
                            // Error if the block is not valid (no end of file marker)
                            out[0] = 3;
                        }
                    }
                    // Only add the hex data if the read was successful
                    if (out[0] === 0) {
                        out.push(outHexArr);
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
        writeFile(fileName, contents, isRaw = false) {
            let out = 0;
            // All files are using at least 2 blocks (1 for directory and 1 for data)
            let numBlocksUsed = 2;
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
                    if (!isRaw) {
                        // Have to convert the string to hex codes
                        for (let i = 0; i < contents.length; i++) {
                            // Add the hex representation of each character to the file contents
                            contentsHex += contents.charCodeAt(i).toString(16).padStart(2, '0').toUpperCase();
                        }
                    }
                    else {
                        // The data are already good to be directly written
                        contentsHex = contents;
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
                            remainingContents = remainingContents.substring((BLOCK_SIZE - 4) * 2);
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
                                // Increment the number of blocks being used
                                numBlocksUsed++;
                            }
                            else {
                                // Memory leak prevention. If writing to fewer blocks, we have to set the rest of the chain to be not in use anymore
                                if (isUsingNextTsb) {
                                    // Get the first tsb that is not being used
                                    let nextTsb = sessionStorage.getItem(curFileBlock).substring(2, 8);
                                    // Continue to the end of the chain
                                    while (nextTsb !== 'FFFFFF') {
                                        // Translate the 3 bytes to a key
                                        let nextKey = `${nextTsb.charAt(1)}:${nextTsb.charAt(3)}:${nextTsb.charAt(5)}`;
                                        // Set the tsb to available
                                        sessionStorage.setItem(nextKey, '00' + sessionStorage.getItem(nextKey).substring(2));
                                        // Continue down the chain
                                        nextTsb = sessionStorage.getItem(nextKey).substring(2, 8);
                                    }
                                }
                                // Set the last block used to be the end of the file by closing the chain
                                sessionStorage.setItem(curFileBlock, sessionStorage.getItem(curFileBlock).substring(0, 2) + 'FFFFFF' + sessionStorage.getItem(curFileBlock).substring(8));
                            }
                        }
                    }
                }
                if (out === 0 || out === 3) {
                    // Update the number of blocks in the directory entry
                    let fileDirTsb = this.getDirectoryBlockForFile(fileName);
                    sessionStorage.setItem(fileDirTsb, sessionStorage.getItem(fileDirTsb).substring(0, (BLOCK_SIZE - 1) * 2) + numBlocksUsed.toString(16).toUpperCase().padStart(2, '0'));
                }
                // Update the HTML and return the status code
                this.updateTable();
            }
            return out;
        }
        // Possible outputs
        // 0: Delete successful
        // 1: Disk is not formatted yet
        // 2: File not found
        // 3: Internal error (file block given is available)
        deleteFile(fileName) {
            let out = 0;
            if (!this.isFormatted) {
                // Disk is not formatted yet
                out = 1;
            }
            else {
                let directoryTsb = this.getDirectoryBlockForFile(fileName);
                if (directoryTsb === '') {
                    // The file does not exist, so cannot be deleted
                    out = 2;
                }
                else {
                    let directoryEntry = sessionStorage.getItem(directoryTsb);
                    if (directoryEntry.charAt(1) === '0') {
                        out = 3;
                    }
                    else {
                        let curDataTsb = `${directoryEntry.charAt(3)}:${directoryEntry.charAt(5)}:${directoryEntry.charAt(7)}`;
                        // Mark the directory entry as available
                        sessionStorage.setItem(directoryTsb, '00' + directoryEntry.substring(2));
                        while (curDataTsb !== 'F:F:F' && out == 0) {
                            let dataEntry = sessionStorage.getItem(curDataTsb);
                            if (dataEntry.charAt(1) === '0') {
                                out = 3;
                            }
                            else {
                                // Set the data entry to be available
                                sessionStorage.setItem(curDataTsb, '00' + dataEntry.substring(2));
                                // Go to the next link
                                curDataTsb = `${dataEntry.charAt(3)}:${dataEntry.charAt(5)}:${dataEntry.charAt(7)}`;
                            }
                        }
                    }
                }
                // Update the table on the webpage
                this.updateTable();
            }
            return out;
        }
        // Possible outputs
        // 0: Rename successful
        // 1: Disk is not formatted yet
        // 2: File not found
        renameFile(oldFileName, newFileName) {
            let out = 0;
            if (!this.isFormatted) {
                // Disk is not formatted
                out = 1;
            }
            else {
                let directoryTsb = this.getDirectoryBlockForFile(oldFileName);
                if (directoryTsb === '') {
                    // The file to rename doesn't exist
                    out = 2;
                }
                else {
                    let newNameHex = '';
                    for (let i = 0; i < newFileName.length; i++) {
                        // Add the byte of character data to the new name hex
                        newNameHex += newFileName.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0');
                    }
                    // Set the new name to the directory entry
                    sessionStorage.setItem(directoryTsb, sessionStorage.getItem(directoryTsb).substring(0, 8) + newNameHex.padEnd((BLOCK_SIZE - 4) * 2, '0'));
                    this.updateTable();
                }
            }
            return out;
        }
        // Possible outputs
        // 0: Rename successful
        // 1: Disk is not formatted yet
        // 2: Current file not found
        // 3: Destination file name already exists
        // 4: No available directory blocks to create new file
        // 5: No available data blocks to create new file
        // 6: Internal error reading the original file data (link ends before reaching 00 EOF)
        // 7: Partial write to the new file (need more space)
        // 8: Internal error writing the new file (file block given is available)
        copyFile(curFileName, newFileName) {
            let out = 0;
            if (!this.isFormatted) {
                out = 1;
            }
            else {
                let curDirectoryTsb = this.getDirectoryBlockForFile(curFileName);
                if (curDirectoryTsb === '') {
                    out = 2;
                }
                else {
                    // Try to create the new file and handle error codes from the file creation
                    let createNewFileOutput = this.createFile(newFileName);
                    switch (createNewFileOutput) {
                        case 1:
                            // Disk not formatted (already checked, so this should never come up here)
                            out = 1;
                            break;
                        case 2:
                            // The name of the new file is already in use
                            out = 3;
                            break;
                        case 3:
                            // The directory is full
                            out = 4;
                            break;
                        case 4:
                            // There are no available data blocks to give the file
                            out = 5;
                            break;
                    }
                    // Only continue if no errors so far
                    if (out === 0) {
                        // Read the original file and get its contents
                        let curData = this.readFile(curFileName);
                        switch (curData[0]) {
                            case 1:
                                // Unformatted disk
                                // Already checked, so should not reach this point
                                out = 1;
                                break;
                            case 2:
                                // Current file not found
                                // Already checked, so should not reach this point
                                out = 2;
                                break;
                            case 3:
                                // Error when reading the file (also should not reach this point)
                                out = 6;
                                break;
                        }
                        // Continue if no errors thus far
                        if (out === 0) {
                            // Convert the number array to base 16 and store it all in a string
                            let rawDataString = curData[1].map((e) => e.toString(16).toUpperCase().padStart(2, '0')).join('');
                            // Write the raw data to the new file
                            let writeOutput = this.writeFile(newFileName, rawDataString, true);
                            switch (writeOutput) {
                                case 1:
                                    // Not formatted, but should not reach here
                                    out = 1;
                                    break;
                                case 2:
                                    // File should always be found because it was just created, but just in case
                                    out = 2;
                                    break;
                                case 3:
                                    // Partial write because ran out of available data blocks
                                    out = 7;
                                    break;
                                case 4:
                                    // Internal error (shouldn't be reached)
                                    out = 8;
                                    break;
                            }
                        }
                    }
                }
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
            else {
                // Set the list to something that marks it as the disk not being formatted
                fileList = null;
            }
            return fileList;
        }
        getDirectoryBlockForFile(fileName) {
            let out = '';
            for (let s = 0; s < NUM_SECTORS && out === ''; s++) {
                for (let b = 0; b < NUM_BLOCKS && out === ''; b++) {
                    if (s === 0 && b === 0) {
                        // Skip the MBR
                        continue;
                    }
                    let directoryTsb = `0:${s}:${b}`;
                    let directoryEntry = sessionStorage.getItem(directoryTsb);
                    // Make sure the directory entry is in use first
                    if (directoryEntry.charAt(1) === '1') {
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
                            out = directoryTsb;
                        }
                    }
                }
            }
            return out;
        }
        getFirstDataBlockForFile(fileName) {
            let outTsb = '';
            // Get the directory location in storage
            let directoryTsb = this.getDirectoryBlockForFile(fileName);
            // Make sure the file exists before getting the data block
            if (directoryTsb !== '') {
                let directoryEntry = sessionStorage.getItem(directoryTsb);
                // Establish the key of the first block of the data because we found the file in the directory
                outTsb = `${directoryEntry.charAt(3)}:${directoryEntry.charAt(5)}:${directoryEntry.charAt(7)}`;
            }
            return outTsb;
        }
        getFirstAvailableDirectoryBlock() {
            let dirTsb = '';
            for (let s = 0; s < NUM_SECTORS && dirTsb === ''; s++) {
                for (let b = 0; b < NUM_BLOCKS && dirTsb === ''; b++) {
                    if (s === 0 && b === 0) {
                        // 0:0:0 is the MBR
                        continue;
                    }
                    // Find the first data block that is not in use
                    if (sessionStorage.getItem(`0:${s}:${b}`).charAt(1) === '0') {
                        dirTsb = `0:${s}:${b}`;
                    }
                }
            }
            return dirTsb;
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
        getAvailableDataBlocks(numBlocks) {
            // Start off with knowing about no open data blocks
            let availableBlocks = [];
            for (let t = 1; t < NUM_TRACKS && availableBlocks.length < numBlocks; t++) {
                for (let s = 0; s < NUM_SECTORS && availableBlocks.length < numBlocks; s++) {
                    for (let b = 0; b < NUM_BLOCKS && availableBlocks.length < numBlocks; b++) {
                        // Find the next data block that is not in use and store it
                        if (sessionStorage.getItem(`${t}:${s}:${b}`).charAt(1) === '0') {
                            availableBlocks.push(`${t}:${s}:${b}`);
                        }
                    }
                }
            }
            return availableBlocks;
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