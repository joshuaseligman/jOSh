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
        alert('Test: Create with a full disk\nThis test will format the disk, create a file and then write so much text to it that the disk fills up. Another file will then be requested to be created. \nExpected: The second file should not be created.')

        inputCommand('format')

        inputCommand('create test')
        inputCommand('write test "' + 'A'.repeat(64 * 3 * 60 - 1) + '"')
        inputCommand('create test1')
    }

    this.tests = {
        "iP4: Disk not formatted": this.diskNotFormatted,
        "iP4: Invalid file names": this.invalidFileNames,
        "iP4: Full directory": this.fullDirectory,
        "iP4: Create with full disk": this.createWithFullDisk,
        "iP4: Data leak": this.dataLeak,
        "iP4: Write to a full disk": this.partialWrite
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
        _KernelInputQueue.enqueue('c')
        _KernelInputQueue.enqueue('l')
        _KernelInputQueue.enqueue('s')
        TSOS.Kernel.prototype.krnInterruptHandler(KEYBOARD_IRQ, [13, false])

        // Then run the test
        this.tests[testName]();
    }
}