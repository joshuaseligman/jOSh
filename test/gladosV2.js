function GladosV2() {

    function inputCommand(cmd) {
        // Enters in each character to the keyboard buffer
        for (let i = 0; i < cmd.length; i++) {
            _KernelInputQueue.enqueue(cmd.charAt(i));
        }
        // "Hits" the enter key
        TSOS.Kernel.prototype.krnInterruptHandler(KEYBOARD_IRQ, [13, false])
    }

    this.diskNotFormatted = function() {
        alert('Test: Disk not formatted\nThis will try to run basic disk commands assuming the disk has not been formatted yet.\nExpected: Error messages saying the disk has not been formatted.')

        inputCommand('create test')
       
        inputCommand('write test "jOSh"')

        inputCommand('delete test')

        inputCommand('ls')
    };

    this.invalidFileNames = function() {
        alert('Test: Invalid file names\nThis will format the disk and then try to create files with various names. First 2 are valid. 3rd is too long of a name. 4th uses the prefix of a swap file. 5th file already exists.\nExpected: First 2 are valid and creates the files. Last 3 are invalid file names.')

        inputCommand('format')

        // This is a valid file name
        inputCommand('create test')

        // The exact max file name length
        inputCommand('create ' + 'A'.repeat(55))

        // One letter longer than the max file length name (should be rejected)
        inputCommand('create ' + 'A'.repeat(56))

        // Swap file beginning of file (should be rejected)
        inputCommand('create ~test')

        inputCommand('create test')
    }

    this.fullDirectory = function() {
        alert('Test: Full directory\nThis test will format the disk, then attempt to create 64 files.\nExpected: First 63 files should be made and the 64th should not be made due to a full directory.')

        inputCommand('format')

        for (let i = 1; i <= 64; i++) {
            inputCommand(`create test${i}`)
        }
    }

    this.dataLeak = function() {
        alert('Test: Data leak\nThis test will format the disk, create a file, and then write data that should take up 3 data blocks. After waiting for a few seconds, the file will be written to again but with very little text.\nExpected: The 2 additional data blocks that were used for the first write but not for the second should be marked as available.')

        inputCommand('format')

        inputCommand('create test')

        let command = 'write test "This string is exactly 120 characters, which should take up 3 blocks. 2 with data and 1 with all 0s because we need EOF."';
        inputCommand(command)

        setTimeout(() => {
            inputCommand('write test "hello world"')
        }, 4000)
    }

    this.partialWrite = function() {
        alert('Test: Write to a full disk\nThis test will format the disk, create 63 files and attempt to write 4 blocks of data to each file. The first and last files created will then be read.\nExpected: The earlier files will get the entire text and the rest will only get some because the disk will fill up.')

        inputCommand('format')

        // Create the files
        for (let i = 0; i < 63; i++) {
            inputCommand(`create test${i}`)
        }

        // Write to the files
        for (let i = 0; i < 63; i++) {
            let stringToWrite = `write test${i} "This string is exactly 180 characters, which should take up 4 blocks. 3 with data and 1 with 0s because we need EOF to mark the end of the file. There should be a partial write now"`
            inputCommand(stringToWrite)
        }

        inputCommand('read test0')
        inputCommand('read test62')
    }

    this.createWithFullDisk = function() {
        alert('Test: Create with a full disk\nThis test will format the disk, create a file and then write so much text to it that the disk fills up. Another file will then be requested to be created.\nExpected: The second file should not be created.')

        inputCommand('format')

        inputCommand('create test')
        inputCommand('write test "' + 'A'.repeat(64 * 3 * 60 - 1) + '"')
        inputCommand('create test1')
    }

    this.deleteTest = function() {
        alert('Test: Delete a file\nThis test will format the disk, create a file, and then write some text to the file. The ls command will be used to make sure the file exists and the file will be read from. The delete command will then be run on the file, followed by an ls, read, and write attempt on the file. Lastly, the deleted file will be deleted again.\nExpected: "hello world" should be initially read and then should be rejected on reading and writing to a deleted file. The second delete should cause an error because the file does not exist.')

        inputCommand('format')
        
        inputCommand('create test')
        inputCommand('write test "hello world"')

        inputCommand('ls')
        inputCommand('read test')

        inputCommand('delete test')

        inputCommand('ls')
        inputCommand('read test')
        inputCommand('write test "jOSh"')
        inputCommand('delete test')
    }

    this.copyFullDirectory = function() {
        alert('Test: Copy to a full directory\nThis test will format the disk and create 63 files. "hello world" will be written to a file and then the file will tried to get copied.\nExpected: Copy fails because no directory room for the new file.')

        inputCommand('format')
        for (let i = 0; i < 63; i++) {
            inputCommand(`create test${i}`)
        }
        inputCommand('write test0 "hello world"')
        inputCommand('copy test0 myCopy')
    }

    this.copyWithFullDisk = function() {
        alert('Test: Copy to a full disk\nThis test will format the disk and create a file. Enough text will be written to the file that the disk becomes full and then the file will be copied.\nExpected: Copy fails because no space on the disk for the new file.')

        inputCommand('format')

        inputCommand('create test')
        inputCommand('write test "' + 'A'.repeat(64 * 3 * 60 - 1) + '"')
        inputCommand('copy test test1')
    }

    this.partialCopy = function() {
        alert('Test: Partial copy\nThis test will format the disk and create a file. Enough text will be written to the file that the disk almost be full and then the file will be copied. The new file will then be read from.\nExpected: Copy partially fails and the new file will only have 1 block worth of data')

        inputCommand('format')

        inputCommand('create test')
        inputCommand('write test "' + 'A'.repeat(64 * 3 * 60 - 61) + '"')
        inputCommand('copy test test1')
        inputCommand('read test1')
    }

    this.run4Programs = function() {
        alert('Test: Run 4 programs\nThis test will format the disk and load 4 programs. Execution of all programs will start with the runall command.\nExpected: The last process loaded goes to the disk initially. Swapping allows for each program to be in memory when being executed. Output: a0b0c0d0abcd1111a2b2c2d2adoneb3c3d3bcd444b5c5d5bdonec6d6cd77c8d8cdoned9d10d11ddone')


        // From glados-ip4.js
        let code1 = "A9 00 8D 7B 00 A9 00 8D 7B 00 A9 00 8D 7C 00 A9 00 8D 7C 00 A9 01 8D 7A 00 A2 00 EC 7A 00 D0 39 A0 7D A2 02 FF AC 7B 00 A2 01 FF AD 7B 00 8D 7A 00 A9 01 6D 7A 00 8D 7B 00 A9 03 AE 7B 00 8D 7A 00 A9 00 EC 7A 00 D0 02 A9 01 8D 7A 00 A2 01 EC 7A 00 D0 05 A9 01 8D 7C 00 A9 00 AE 7C 00 8D 7A 00 A9 00 EC 7A 00 D0 02 A9 01 8D 7A 00 A2 00 EC 7A 00 D0 AC A0 7F A2 02 FF 00 00 00 00 61 00 61 64 6F 6E 65 00";

        let  code2 = "A9 00 8D 7B 00 A9 00 8D 7B 00 A9 00 8D 7C 00 A9 00 8D 7C 00 A9 01 8D 7A 00 A2 00 EC 7A 00 D0 39 A0 7D A2 02 FF AC 7B 00 A2 01 FF AD 7B 00 8D 7A 00 A9 01 6D 7A 00 8D 7B 00 A9 06 AE 7B 00 8D 7A 00 A9 00 EC 7A 00 D0 02 A9 01 8D 7A 00 A2 01 EC 7A 00 D0 05 A9 01 8D 7C 00 A9 00 AE 7C 00 8D 7A 00 A9 00 EC 7A 00 D0 02 A9 01 8D 7A 00 A2 00 EC 7A 00 D0 AC A0 7F A2 02 FF 00 00 00 00 62 00 62 64 6F 6E 65 00";

        let code3 = "A9 00 8D 7B 00 A9 00 8D 7B 00 A9 00 8D 7C 00 A9 00 8D 7C 00 A9 01 8D 7A 00 A2 00 EC 7A 00 D0 39 A0 7D A2 02 FF AC 7B 00 A2 01 FF AD 7B 00 8D 7A 00 A9 01 6D 7A 00 8D 7B 00 A9 09 AE 7B 00 8D 7A 00 A9 00 EC 7A 00 D0 02 A9 01 8D 7A 00 A2 01 EC 7A 00 D0 05 A9 01 8D 7C 00 A9 00 AE 7C 00 8D 7A 00 A9 00 EC 7A 00 D0 02 A9 01 8D 7A 00 A2 00 EC 7A 00 D0 AC A0 7F A2 02 FF 00 00 00 00 63 00 63 64 6F 6E 65 00";

        let code4 = "A9 00 8D 7B 00 A9 00 8D 7B 00 A9 00 8D 7C 00 A9 00 8D 7C 00 A9 01 8D 7A 00 A2 00 EC 7A 00 D0 39 A0 7D A2 02 FF AC 7B 00 A2 01 FF AD 7B 00 8D 7A 00 A9 01 6D 7A 00 8D 7B 00 A9 0C AE 7B 00 8D 7A 00 A9 00 EC 7A 00 D0 02 A9 01 8D 7A 00 A2 01 EC 7A 00 D0 05 A9 01 8D 7C 00 A9 00 AE 7C 00 8D 7A 00 A9 00 EC 7A 00 D0 02 A9 01 8D 7A 00 A2 00 EC 7A 00 D0 AC A0 7F A2 02 FF 00 00 00 00 64 00 64 64 6F 6E 65 00";

        inputCommand('format')

		setTimeout(() => {
            document.getElementById("taProgramInput").value = code1;
			inputCommand('load')
        }, 1000);

		setTimeout(() => {
            document.getElementById("taProgramInput").value = code2;
			inputCommand('load')
        }, 2000);

        setTimeout(() => {
            document.getElementById("taProgramInput").value = code3;
			inputCommand('load')
        }, 3000);

        setTimeout(() => {
            document.getElementById("taProgramInput").value = code4;
			inputCommand('load')
        }, 4000);

        setTimeout(() => {
			inputCommand('runall')
        }, 5000);
    }

    this.tests = {
        "iP4: Disk not formatted": this.diskNotFormatted,
        "iP4: Invalid file names": this.invalidFileNames,
        "iP4: Full directory": this.fullDirectory,
        "iP4: Create with full disk": this.createWithFullDisk,
        "iP4: Data leak": this.dataLeak,
        "iP4: Write to a full disk": this.partialWrite,
        "iP4: Reading and writing to a deleted file": this.deleteTest,
        "iP4: Copying with a full directory": this.copyFullDirectory,
        "iP4: Copying with a full disk": this.copyWithFullDisk,
        "iP4: Partial copy": this.partialCopy,
        "iP4: Run 4 programs": this.run4Programs
    };

    this.init = function() {
        const testArea = document.querySelector('#testOptions');
        testArea.innerHTML = '';
        for (testName in this.tests) {
            let newTest = document.createElement('option');
            newTest.value = testName;
            newTest.innerHTML = testName;
            testArea.appendChild(newTest);
        }
    };

    this.runTest = function(testName) {
        // Clear the screen first
        inputCommand('cls')

        // Then run the test
        this.tests[testName]();
    }
}