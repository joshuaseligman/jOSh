module TSOS {

    // Extends DeviceDriver
    export class DiskSystemDeviceDriver extends DeviceDriver {

        // Flag for if the disk has been formatted yet
        private isFormatted: boolean;

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

        public krnDsDriverEntry() {
            // Initialization routine for this, the kernel-mode disk system Device Driver.
            this.status = "loaded";
            // More?
        }

        public formatDisk(quick: boolean) {
            for (let t: number = 0; t < NUM_TRACKS; t++) {
                for (let s: number = 0; s < NUM_SECTORS; s++) {
                    for (let b: number = 0; b < NUM_BLOCKS; b++) {
                        // If a quick format is called and the disk has not been formatted before, it will be the same as a low-level format (to set up the session storage)
                        if (quick && this.isFormatted) {
                            // Only set the overhead to make the block free. the data can stay where it is
                            sessionStorage.setItem(`${t}:${s}:${b}`, '00FFFFFF' + sessionStorage.getItem(`${t}:${s}:${b}`).substring(8));
                        } else {
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
        public createFile(fileName: string): number {
            // Assume the file is successfully created
            let out: number = 0;

            if (!this.isFormatted) {
                out = 1;
            } else {
                // Check if the file already exists
                let nameCheck: string = this.getDirectoryBlockForFile(fileName);
                if (nameCheck !== '') {
                    out = 2;
                } else {
                    // If the file does not exist, then we can try to allocate space on the disk
                    let firstOpenDir: string = this.getFirstAvailableDirectoryBlock();

                    let firstOpenData: string = this.getFirstAvailableDataBlock();

                    if (firstOpenDir === '') {
                        // Return an error code if no available directory space
                        out = 3;
                    } else if (firstOpenData === '') {
                        // Return an error code if no available data blocks
                        out = 4;
                    } else {
                        // Start with marking the directory entry as unavailable
                        let directoryEntry: string = '01';
                        
                        // Go through every other character in the open data (t:s:b)
                        for (let i: number = 0; i < firstOpenData.length; i += 2) {
                            directoryEntry += '0' + firstOpenData.charAt(i);
                        }

                        let fileNameHex: string = '';
                        // Add each character of the file name to the directory entry
                        for (let j: number = 0; j < fileName.length; j++) {
                            fileNameHex += fileName.charCodeAt(j).toString(16).padStart(2, '0').toUpperCase();
                        }
                        
                        // Pad the rest with 0s
                        fileNameHex = fileNameHex.padEnd(MAX_FILE_NAME_LENGTH * 2, '0');

                        // Make sure the file name has 00 in it to mark the end of the name
                        // We saved room for this when choosing the value for MAX_FILE_NAME_LENGTH
                        fileNameHex += '00';

                        directoryEntry += fileNameHex;

                        // Get the date and store it in hex
                        let date: string[] = Utils.getDate(false).split('/');
                        date = date.map((elem: string) => {
                            let res: string = parseInt(elem).toString(16).toUpperCase();
                            if (res.length % 2 === 1) {
                                res = '0' + res;
                            }
                            return res;
                        });
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
        public createFileWithInitialSize(fileName: string, sizeInBytes: number): number {
            let out: number = 0;

            if (!this.isFormatted) {
                out = 1;
            } else {
                // Check if the file already exists
                let nameCheck: string = this.getDirectoryBlockForFile(fileName);
                if (nameCheck !== '') {
                    out = 2;
                } else {
                    // If the file does not exist, then we can try to allocate space on the disk
                    let firstOpenDir: string = this.getFirstAvailableDirectoryBlock();

                    // The number of blocks needed is the size needed divided by the amount of data space per block
                    let numBlocksNeeded: number = Math.ceil(sizeInBytes / (BLOCK_SIZE - 4));
                    let availableBlocks: string[] = this.getAvailableDataBlocks(numBlocksNeeded);

                    if (firstOpenDir === '') {
                        // There are no open directory spots
                        out = 3;
                    } else if (availableBlocks.length < numBlocksNeeded) {
                        // Make sure there are enough available data blocks to meet the request
                        out = 4;
                    } else {
                        // Start with marking the directory entry as unavailable
                        let directoryEntry: string = '01';
                        
                        // Go through every other character in the first open data block (t:s:b)
                        for (let i: number = 0; i < availableBlocks[0].length; i += 2) {
                            directoryEntry += '0' + availableBlocks[0].charAt(i);
                        }

                        let fileNameHex: string = '';
                        // Add each character of the file name to the directory entry
                        for (let j: number = 0; j < fileName.length; j++) {
                            fileNameHex += fileName.charCodeAt(j).toString(16).padStart(2, '0').toUpperCase();
                        }
                        
                        // Pad the rest with 0s
                        fileNameHex = fileNameHex.padEnd(MAX_FILE_NAME_LENGTH * 2, '0');

                        // Make sure the file name has 00 in it to mark the end of the name
                        // We saved room for this when choosing the value for MAX_FILE_NAME_LENGTH
                        fileNameHex += '00';

                        directoryEntry += fileNameHex;

                        // Get the date and store it in hex
                        let date: string[] = Utils.getDate(false).split('/');
                        date = date.map((elem: string) => {
                            let res: string = parseInt(elem).toString(16).toUpperCase();
                            if (res.length % 2 === 1) {
                                res = '0' + res;
                            }
                            return res;
                        });
                        directoryEntry += date.join('');

                        // Set the number of blocks in use based on the number of blocks needed
                        directoryEntry += (numBlocksNeeded + 1).toString(16).toUpperCase().padStart(2, '0');

                        // Save it on the disk and update the table
                        sessionStorage.setItem(firstOpenDir, directoryEntry);

                        // Mark the data block as unavailable, give it the next block, and the data are all 0s
                        for (let k: number = 0; k < availableBlocks.length; k++) {
                            let newDataEntry: string = '01';

                            if (k === availableBlocks.length - 1) {
                                // Last block is the end of the file
                                newDataEntry += 'FFFFFF'
                            } else {
                                // Get the TSB of the next block
                                for (let l: number = 0; l < availableBlocks[k + 1].length; l += 2) {
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
        public readFile(fileName: string): any[] {
            let out: any[] = [0];
            if (!this.isFormatted) {
                // Make sure the disk is formatted first
                out[0] = 1;
            } else {
                let curFileBlock: string = this.getFirstDataBlockForFile(fileName);
                if (curFileBlock === '') {
                    // File is not found if the file block is an empty string
                    out[0] = 2;
                } else {
                    // Boolean to represent the end of the file
                    let endFound: boolean = false;
                    // The character codes that need to be printed
                    let outHexArr: number[] = [];

                    // Continue until the end of the file or an error
                    while (!endFound && out[0] === 0) {
                        // Make sure the block is valid
                        if (curFileBlock !== 'F:F:F') {
                            // Make sure the block is not available
                            if (sessionStorage.getItem(curFileBlock).charAt(1) === '1') { 
                                // Get the data in the current block
                                let curData: string = sessionStorage.getItem(curFileBlock).substring(8);
                                // Go through the block one byte at a time
                                for (let i = 0; i < curData.length && !endFound; i += 2) {
                                    let hexChar: string = curData.substring(i, i + 2);
                                    if (hexChar === '00') {
                                        // The end of the file has been found
                                        endFound = true;
                                    } else {
                                        // Add the character code to the array
                                        outHexArr.push(parseInt(hexChar, 16));
                                    }
                                }
                                // Go to the next block if needed
                                if (!endFound) {
                                    let nextTsb: string = sessionStorage.getItem(curFileBlock).substring(2, 8);
                                    curFileBlock = `${nextTsb.charAt(1)}:${nextTsb.charAt(3)}:${nextTsb.charAt(5)}`
                                }
                            } else {
                                // Trying to read from an available block
                                out[0] = 4;
                            }
                        } else {
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
        public readFileRaw(fileName: string, numBytes: number): any[] {
            let out: any[] = [0];

            if (!this.isFormatted) {
                out[0] = 1;
            } else {
                let curFileBlock: string = this.getFirstDataBlockForFile(fileName);
                if (curFileBlock === '') {
                    // File is not found if the file block is an empty string
                    out[0] = 2;
                } else {
                    // Number of bytes read so far
                    let bytesRead: number = 0;
                    // The character codes that need to be printed
                    let outHexArr: number[] = [];

                    // Continue until the end of the file or an error
                    while (bytesRead < numBytes && out[0] === 0) {
                        // Make sure the block is valid
                        if (curFileBlock !== 'F:F:F') {
                            // Make sure the block is not available
                            if (sessionStorage.getItem(curFileBlock).charAt(1) === '1') { 
                                // Get the data in the current block
                                let curData: string = sessionStorage.getItem(curFileBlock).substring(8);
                                // Go through the block one byte at a time
                                for (let i = 0; i < curData.length && bytesRead < numBytes; i += 2) {
                                    let hexChar: string = curData.substring(i, i + 2);
                                    // Add the character code to the array
                                    outHexArr.push(parseInt(hexChar, 16));

                                    bytesRead++;
                                }
                                // Go to the next block if needed
                                if (bytesRead < numBytes) {
                                    let nextTsb: string = sessionStorage.getItem(curFileBlock).substring(2, 8);
                                    curFileBlock = `${nextTsb.charAt(1)}:${nextTsb.charAt(3)}:${nextTsb.charAt(5)}`
                                }
                            } else {
                                // Trying to read from an available block
                                out[0] = 3;
                            }
                        } else {
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
        public writeFile(fileName: string, contents: string, isRaw: boolean = false): number {
            let out: number = 0;

            // All files are using at least 2 blocks (1 for directory and 1 for data)
            let numBlocksUsed: number = 2;

            if (!this.isFormatted) {
                // Disk is not formatted
                out = 1;
            } else {
                let curFileBlock: string = this.getFirstDataBlockForFile(fileName);
                if (curFileBlock === '') {
                    // File was not found
                    out = 2;
                } else {
                    let contentsHex: string = '';
                    if (!isRaw) {
                        // Have to convert the string to hex codes
                        for (let i: number = 0; i < contents.length; i++) {
                            // Add the hex representation of each character to the file contents
                            contentsHex += contents.charCodeAt(i).toString(16).padStart(2, '0').toUpperCase();
                        }
                    } else {
                        // The data are already good to be directly written
                        contentsHex = contents;
                    }

                    // Add the EOF operator to the end of the contents hex string
                    contentsHex += '00';

                    // Flag to help determine the next block that is needed. Default to true so we use the blocks already in use before going to a new block
                    let isUsingNextTsb: boolean = true;

                    // Write until there is nothing left to write
                    let remainingContents: string = contentsHex;
                    while (remainingContents.length > 0 && out === 0) {
                        if (sessionStorage.getItem(curFileBlock).charAt(1) === '0') {
                            // The block should always be available
                            out = 4;
                        } else {
                            // Separate the first 60 "bytes" of data and the remaining data
                            let contentsToWrite: string = remainingContents.substring(0, (BLOCK_SIZE - 4) * 2).padEnd((BLOCK_SIZE - 4) * 2, '0');
                            remainingContents = remainingContents.substring((BLOCK_SIZE - 4) * 2);

                            // Write the contents to the file
                            sessionStorage.setItem(curFileBlock, sessionStorage.getItem(curFileBlock).substring(0, 8) + contentsToWrite);

                            if (sessionStorage.getItem(curFileBlock).substring(2, 8) === 'FFFFFF') {
                                isUsingNextTsb = false;
                            }

                            // Check to see if there is still more to write
                            if (remainingContents.length > 0) {
                                let newTsb: string = '';
                                if (isUsingNextTsb) {
                                    // Use the next block in the link because we know it is already reserved for the given file
                                    let nextTsbInfo: string = sessionStorage.getItem(curFileBlock).substring(2, 8);
                                    newTsb = `${nextTsbInfo.charAt(1)}:${nextTsbInfo.charAt(3)}:${nextTsbInfo.charAt(5)}`;
                                } else {
                                    // Otherwise, use the next available block
                                    newTsb = this.getFirstAvailableDataBlock();
                                }

                                // Check if the next block was found or not
                                if (newTsb === '') {
                                    // Remove the last byte to replace with an EOF operator
                                    sessionStorage.setItem(curFileBlock, sessionStorage.getItem(curFileBlock).substring(0, BLOCK_SIZE * 2 - 2) + '00');
                                    out = 3;
                                } else {
                                    // Update the current file block with the new link
                                    let updatedFileBlock: string = sessionStorage.getItem(curFileBlock).substring(0, 2) + '0' + newTsb.charAt(0) + '0' + newTsb.charAt(2) + '0' + newTsb.charAt(4) + sessionStorage.getItem(curFileBlock).substring(8);
                                    sessionStorage.setItem(curFileBlock, updatedFileBlock);

                                    // Set the status of the new block to be in use and as the end of the file
                                    sessionStorage.setItem(newTsb, '01' + sessionStorage.getItem(newTsb).substring(2, 8) + '0'.repeat((BLOCK_SIZE - 4) * 2));

                                    // Set the current TSB to the new TSB
                                    curFileBlock = newTsb;

                                    if (!isUsingNextTsb) {
                                        // We took a block from storage, so we have to make sure that file restoration does not get screwed up in case we took a deleted file's first block
                                        for (let s: number = 0; s < NUM_SECTORS; s++) {
                                            for (let b: number = 0; b < NUM_BLOCKS; b++) {
                                                if (s === 0 && b === 0) {
                                                    // 0:0:0 is MBR
                                                    continue;
                                                }
                                                let directoryEntry: string = sessionStorage.getItem(`0:${s}:${b}`);
                                                // Check to see if the directory entry is a deleted file
                                                if (directoryEntry.charAt(1) === '0' && directoryEntry.substring(8, 10) !== '00') {
                                                    let directoryFirstBlock: string = `${directoryEntry.charAt(3)}:${directoryEntry.charAt(5)}:${directoryEntry.charAt(7)}`;
                                                    if (directoryFirstBlock === curFileBlock) {
                                                        // Set the next block to nothing to prevent it from reaching anything now that the blocks are being used by other things
                                                        sessionStorage.setItem(`0:${s}:${b}`, '00FFFFFF' + directoryEntry.substring(8));
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                // Increment the number of blocks being used
                                numBlocksUsed++;
                            } else {
                                // Memory leak prevention. If writing to fewer blocks, we have to set the rest of the chain to be not in use anymore
                                if (isUsingNextTsb) {
                                    // Get the first tsb that is not being used
                                    let nextTsb: string = sessionStorage.getItem(curFileBlock).substring(2, 8);
                                    // Continue to the end of the chain
                                    while (nextTsb !== 'FFFFFF') {
                                        // Translate the 3 bytes to a key
                                        let nextKey: string = `${nextTsb.charAt(1)}:${nextTsb.charAt(3)}:${nextTsb.charAt(5)}`;
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
                    let fileDirTsb: string = this.getDirectoryBlockForFile(fileName);
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
        public deleteFile(fileName: string): number {
            let out: number = 0;

            if (!this.isFormatted) {
                // Disk is not formatted yet
                out = 1;
            } else {
                let directoryTsb: string = this.getDirectoryBlockForFile(fileName);
                if (directoryTsb === '') {
                    // The file does not exist, so cannot be deleted
                    out = 2;
                } else {
                    let directoryEntry: string = sessionStorage.getItem(directoryTsb);
                    if (directoryEntry.charAt(1) === '0') {
                        out = 3;
                    } else {
                        let curDataTsb: string = `${directoryEntry.charAt(3)}:${directoryEntry.charAt(5)}:${directoryEntry.charAt(7)}`;
                        // Mark the directory entry as available
                        sessionStorage.setItem(directoryTsb, '00' + directoryEntry.substring(2));

                        while (curDataTsb !== 'F:F:F' && out == 0) {
                            let dataEntry: string = sessionStorage.getItem(curDataTsb);
                            
                            if (dataEntry.charAt(1) === '0') {
                                out = 3;
                            } else {
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
        // 3: New file name already exists
        public renameFile(oldFileName: string, newFileName: string): number {
            let out: number = 0;

            if (!this.isFormatted) {
                // Disk is not formatted
                out = 1
            } else {
                let directoryTsb: string = this.getDirectoryBlockForFile(oldFileName);
                let newDirectoryTsb: string = this.getDirectoryBlockForFile(newFileName);

                if (directoryTsb === '') {
                    // The file to rename doesn't exist
                    out = 2;
                } else if (newDirectoryTsb !== '') {
                    // We are using a single level file system, so no dupes for names allowed
                    out = 3;
                } else {
                    let newNameHex: string = '';
                    for (let i: number = 0; i < newFileName.length; i++) {
                        // Add the byte of character data to the new name hex
                        newNameHex += newFileName.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0');
                    }
                    // Fill the rest of the file name with 0s
                    newNameHex = newNameHex.padEnd(MAX_FILE_NAME_LENGTH * 2, '0');

                    let metadata: string = sessionStorage.getItem(directoryTsb).substring(8 + MAX_FILE_NAME_LENGTH * 2);

                    // Set the new name to the directory entry
                    sessionStorage.setItem(directoryTsb, sessionStorage.getItem(directoryTsb).substring(0, 8) + newNameHex + metadata);

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
        public copyFile(curFileName: string, newFileName: string): number {
            let out: number = 0;

            if (!this.isFormatted) {
                out = 1;
            } else {
                let curDirectoryTsb: string = this.getDirectoryBlockForFile(curFileName);
                if (curDirectoryTsb === '') {
                    out = 2;
                } else {
                    // Try to create the new file and handle error codes from the file creation
                    let createNewFileOutput: number = this.createFile(newFileName);
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
                        let curData: any[] = this.readFile(curFileName);
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
                            let rawDataString: string = curData[1].map((e: number) => e.toString(16).toUpperCase().padStart(2, '0')).join('');

                            // Write the raw data to the new file
                            let writeOutput: number = this.writeFile(newFileName, rawDataString, true);
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

        public getFileList(): string[][] {
            let fileList: string[][] = [];

            if (this.isFormatted) {
                for (let s: number = 0; s < NUM_SECTORS; s++) {
                    for (let b: number = 0; b < NUM_BLOCKS; b++) {
                        if (s === 0 && b === 0) {
                            // Skip 0:0:0 (Master boot record)
                            continue;
                        }

                        // Get the directory entry
                        let directoryEntry: string = sessionStorage.getItem(`0:${s}:${b}`);

                        // Make sure the directory entry is in use
                        if (directoryEntry.charAt(1) === '1') {
                            // The hex representation of the name
                            let fileNameHex: string = directoryEntry.substring(8);
                            // The real representation of the file name
                            let fileName: string = '';
                            let endFound: boolean = false;

                            // Every 2 characters is a byte = real character
                            for (let i: number = 0; i < fileNameHex.length && !endFound; i += 2) {
                                let charCode: number = parseInt(fileNameHex.substring(i, i + 2), 16);
                                if (charCode === 0) {
                                    endFound = true;
                                } else {
                                    fileName += String.fromCharCode(charCode);
                                }
                            }

                            // Grab the file metadata
                            let fileMetaData = directoryEntry.substring((BLOCK_SIZE - 5) * 2);
                            // Get the date the file was created
                            let dateCreated: string = '';
                            dateCreated += parseInt(fileMetaData.substring(0, 2), 16);
                            dateCreated += '/';
                            dateCreated += parseInt(fileMetaData.substring(2, 4), 16);
                            dateCreated += '/';
                            dateCreated += parseInt(fileMetaData.substring(4, 8), 16);
                            
                            // Get the size in bytes
                            let size: string = (parseInt(fileMetaData.substring(fileMetaData.length - 2), 16) * BLOCK_SIZE) + ' bytes';

                            // Create the file entry
                            let fileEntry: string[] = [fileName, dateCreated, size];
                            fileList.push(fileEntry);
                        }
                    }
                }
            } else {
                // Set the list to something that marks it as the disk not being formatted
                fileList = null;
            }

            return fileList;
        }

        // Possible outputs for each file
        // 0: File completely restored
        // 1: Disk not formatted
        // 2: File partially restored
        // 3: File unable to be restored (first data block is gone)
        public restoreFiles(): any[][] {
            let out: any[][] = [];

            if (!this.isFormatted) {
                // Push a 1 for saying the disk is not formatted
                out.push([1]);
            } else {
                // Go through the entire directory track
                for (let s: number = 0; s < NUM_SECTORS; s++) {
                    for (let b: number = 0; b < NUM_BLOCKS; b++) {
                        if (s === 0 && b === 0) {
                            // 0:0:0 is the MBR
                            continue;
                        }
                        // Only need to check the available blocks
                        if (sessionStorage.getItem(`0:${s}:${b}`).charAt(1) === '0') {
                            // Get the name of the file
                            let fileNameHex: string = sessionStorage.getItem(`0:${s}:${b}`).substring(8).substring(0, MAX_FILE_NAME_LENGTH * 2);
    
                            // Make sure a name is there and it is not a swap file
                            if (fileNameHex.substring(0, 2) !== '00' && fileNameHex.substring(0, 2) !== '7E') {
                                let fileName: string = '';
                                for (let i: number = 0; i < MAX_FILE_NAME_LENGTH * 2; i += 2) {
                                    let charToAdd: string = fileNameHex.substring(i, i + 2);
                                    // We have reached the end of the file name
                                    if (charToAdd === '00') {
                                        break;
                                    }
                                    // Add the character to the file name
                                    fileName += String.fromCharCode(parseInt(charToAdd, 16));
                                }
                                // Mark the directory block as is use
                                sessionStorage.setItem(`0:${s}:${b}`, '01' + sessionStorage.getItem(`0:${s}:${b}`).substring(2));
                                let restoreOut: number = this.restoreFile(fileName);
                                // If nothing was restored, then mark the directory block as available
                                if (restoreOut === 3) {
                                    sessionStorage.setItem(`0:${s}:${b}`, '00' + sessionStorage.getItem(`0:${s}:${b}`).substring(2));

                                }
                                // Store the output and the filename for use by the OS
                                out.push([restoreOut, fileName]);
                            }
                        }

                    }
                }
                this.updateTable();
            }

            return out;
        }

        // Possible outputs for each file: 
        // 0: File completely restored
        // 1: Disk is not formatted
        // 2: File partially restored
        // 3: File unable to be restored (first data block is gone)
        private restoreFile(fileName: string): number {
            let out: number = 0;

            if (!this.isFormatted) {
                out = 1;
            } else {
                // Start with the first data block of the file
                let curDataBlock: string = this.getFirstDataBlockForFile(fileName);
                // Keep a trailing pointer in case the file is not able to be fully restored
                let prevDataBlock: string = '';

                let endFound: boolean = false;

                if (curDataBlock === 'F:F:F') {
                    // If the directory entry points to nothing, then the file has already been written over, so cannot restore
                    endFound = true;
                    out = 3;
                }

                while (!endFound) {
                    // If the block is in use, the data for the file is gone
                    if (sessionStorage.getItem(curDataBlock).charAt(1) === '1') {
                        // Do not forget to break out of the loop with this variable
                        endFound = true;
                        if (prevDataBlock === '') {
                            // Nothing of the file was able to be restored
                            out = 3;
                        } else {
                            out = 2;
                            // The last block is the end of the file, plus the last byte gets removed for EOF marker
                            let newEnd: string = '01FFFFFF' + sessionStorage.getItem(prevDataBlock).substring(8, BLOCK_SIZE * 2 - 2) + '00';
                            sessionStorage.setItem(prevDataBlock, newEnd);
                        }
                    } else {
                        // Set the block to be in use
                        sessionStorage.setItem(curDataBlock, '01' + sessionStorage.getItem(curDataBlock).substring(2));

                        // Get the next tsb for the file
                        let nextTsb: string = sessionStorage.getItem(curDataBlock).substring(2, 8);
                        if (nextTsb === 'FFFFFF') {
                            // We have found the end of the file (fully restored)
                            endFound = true;
                        } else {
                            // Update the trailing pointer
                            prevDataBlock = curDataBlock;
                            // Move on to the next block in the file
                            curDataBlock = `${nextTsb.charAt(1)}:${nextTsb.charAt(3)}:${nextTsb.charAt(5)}`;
                        }
                    }
                }
            }

            return out;
        }

        private getDirectoryBlockForFile(fileName: string): string {
            let out: string = '';

            for (let s: number = 0; s < NUM_SECTORS && out === ''; s++) {
                for (let b: number = 0; b < NUM_BLOCKS && out === ''; b++) {
                    if (s === 0 && b === 0) {
                        // Skip the MBR
                        continue;
                    }
                    let directoryTsb: string = `0:${s}:${b}`;
                    let directoryEntry: string = sessionStorage.getItem(directoryTsb);

                    // Make sure the directory entry is in use first
                    if (directoryEntry.charAt(1) === '1') {
                        // The hex representation of the name
                        let fileNameHex: string = directoryEntry.substring(8);
                        // The real representation of the file name
                        let fileNameStr: string = '';
                        let endFound: boolean = false;
    
                        // Every 2 characters is a byte = real character
                        for (let i: number = 0; i < fileNameHex.length && !endFound; i += 2) {
                            let charCode: number = parseInt(fileNameHex.substring(i, i + 2), 16);
                            if (charCode === 0) {
                                endFound = true;
                            } else {
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

        private getFirstDataBlockForFile(fileName: string): string {
            let outTsb: string = '';

            // Get the directory location in storage
            let directoryTsb: string = this.getDirectoryBlockForFile(fileName);
            // Make sure the file exists before getting the data block
            if (directoryTsb !== '') {
                let directoryEntry: string = sessionStorage.getItem(directoryTsb);
                // Establish the key of the first block of the data because we found the file in the directory
                outTsb = `${directoryEntry.charAt(3)}:${directoryEntry.charAt(5)}:${directoryEntry.charAt(7)}`;
            }
            
            return outTsb;
        }

        public getFirstAvailableDirectoryBlock(): string {
            let dirTsb: string = '';

            for (let s: number = 0; s < NUM_SECTORS && dirTsb === ''; s++) {
                for (let b: number = 0; b < NUM_BLOCKS && dirTsb === ''; b++) {
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

        public getFirstAvailableDataBlock(): string {
            // The TSB to return (initialized to nothing)
            let dataTsb: string = '';

            // Go through each data block
            for (let t: number = 1; t < NUM_TRACKS && dataTsb === ''; t++) {
                for (let s: number = 0; s < NUM_SECTORS && dataTsb === ''; s++) {
                    for (let b: number = 0; b < NUM_BLOCKS && dataTsb === ''; b++) {
                        // Find the first data block that is not in use
                        if (sessionStorage.getItem(`${t}:${s}:${b}`).charAt(1) === '0') {
                            dataTsb = `${t}:${s}:${b}`;
                        }
                    }
                }
            }
            return dataTsb;
        }

        public getAvailableDataBlocks(numBlocks: number): string[] {
            // Start off with knowing about no open data blocks
            let availableBlocks: string[] = [];

            for (let t: number = 1; t < NUM_TRACKS && availableBlocks.length < numBlocks; t++) {
                for (let s: number = 0; s < NUM_SECTORS && availableBlocks.length < numBlocks; s++) {
                    for (let b: number = 0; b < NUM_BLOCKS && availableBlocks.length < numBlocks; b++) {
                        // Find the next data block that is not in use and store it
                        if (sessionStorage.getItem(`${t}:${s}:${b}`).charAt(1) === '0') {
                            availableBlocks.push(`${t}:${s}:${b}`);
                        }
                    }
                }
            }

            return availableBlocks;
        }

        private updateTable(): void {
            if (this.isFormatted) {
                for (let t: number = 0; t < NUM_TRACKS; t++) {
                    for (let s: number = 0; s < NUM_SECTORS; s++) {
                        for (let b: number = 0; b < NUM_BLOCKS; b++) {
                            // Get the HTML element and the data from storage
                            let tableRow: HTMLTableRowElement = document.querySelector(`#t${t}s${s}b${b}`);
                            let storage: string = sessionStorage.getItem(`${t}:${s}:${b}`);
                            
                            // Iterate through each of the cells of the row, excluding the first column
                            for (let i: number = 1; i < tableRow.cells.length; i++) {
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
            } else {
                // Add the header to the table here because the table has not been populated yet
                document.querySelector('#diskTable').innerHTML = '<tr> <th>T:S:B</th> <th>In Use</th> <th>Next T:S:B</th> <th>Data</th> </tr>'

                // We need to create a new row in the table for each block in memory
                for (let t: number = 0; t < NUM_TRACKS; t++) {
                    for (let s: number = 0; s < NUM_SECTORS; s++) {
                        for (let b: number = 0; b < NUM_BLOCKS; b++) {
                            // Create the row element with the appropriate id
                            let newRow: HTMLTableRowElement = document.createElement('tr');
                            newRow.id = `t${t}s${s}b${b}`;

                            // Create the tsb element and add it to the row
                            let tsbElem: HTMLTableCellElement = document.createElement('td');
                            tsbElem.innerHTML = `${t}:${s}:${b}`;
                            newRow.appendChild(tsbElem);

                            // Get the current data stored in the block (should be all 0s)
                            let storage: string = sessionStorage.getItem(`${t}:${s}:${b}`);

                            // Get the in use byte (only need the second digit because 1 or 0) and add the element
                            let inUseElem: HTMLTableCellElement = document.createElement('td');
                            inUseElem.innerHTML = storage.charAt(1);
                            newRow.appendChild(inUseElem);

                            // Get the next 3 bytes for the next tsb and add the element
                            let nextTsbElem: HTMLTableCellElement = document.createElement('td');

                            // 3 bytes is 6 characters, but only need the second digit of each byte because everything only needs 1 digit
                            nextTsbElem.innerHTML = storage.charAt(3) + ':' + storage.charAt(5) + ':' + storage.charAt(7);
                            newRow.appendChild(nextTsbElem);

                            // Get the rest of the data and add the element
                            let dataElem: HTMLTableCellElement = document.createElement('td');
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
}