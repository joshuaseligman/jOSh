function GladosV2() {

    this.diskNotFormatted = function() {
        alert('Test: Disk not formatted\nThis will try to run basic disk commands assuming the disk has not been formatted yet.\nExpected: Error messages saying the disk has not been formatted.')

        _KernelInputQueue.enqueue('c')
        _KernelInputQueue.enqueue('r')
        _KernelInputQueue.enqueue('e')
        _KernelInputQueue.enqueue('a')
        _KernelInputQueue.enqueue('t')
        _KernelInputQueue.enqueue('e')
        _KernelInputQueue.enqueue(' ')
        _KernelInputQueue.enqueue('t')
        _KernelInputQueue.enqueue('e')
        _KernelInputQueue.enqueue('s')
        _KernelInputQueue.enqueue('t')
        TSOS.Kernel.prototype.krnInterruptHandler(KEYBOARD_IRQ, [13, false])

        _KernelInputQueue.enqueue('w')
        _KernelInputQueue.enqueue('r')
        _KernelInputQueue.enqueue('i')
        _KernelInputQueue.enqueue('t')
        _KernelInputQueue.enqueue('e')
        _KernelInputQueue.enqueue(' ')
        _KernelInputQueue.enqueue('t')
        _KernelInputQueue.enqueue('e')
        _KernelInputQueue.enqueue('s')
        _KernelInputQueue.enqueue('t')
        _KernelInputQueue.enqueue(' ')
        _KernelInputQueue.enqueue('"')
        _KernelInputQueue.enqueue('j')
        _KernelInputQueue.enqueue('O')
        _KernelInputQueue.enqueue('S')
        _KernelInputQueue.enqueue('h')
        _KernelInputQueue.enqueue('"')
        TSOS.Kernel.prototype.krnInterruptHandler(KEYBOARD_IRQ, [13, false])

        _KernelInputQueue.enqueue('d')
        _KernelInputQueue.enqueue('e')
        _KernelInputQueue.enqueue('l')
        _KernelInputQueue.enqueue('e')
        _KernelInputQueue.enqueue('t')
        _KernelInputQueue.enqueue('e')
        _KernelInputQueue.enqueue(' ')
        _KernelInputQueue.enqueue('t')
        _KernelInputQueue.enqueue('e')
        _KernelInputQueue.enqueue('s')
        _KernelInputQueue.enqueue('t')
        TSOS.Kernel.prototype.krnInterruptHandler(KEYBOARD_IRQ, [13, false])

        // Test ls command
        _KernelInputQueue.enqueue('l')
        _KernelInputQueue.enqueue('s')
        TSOS.Kernel.prototype.krnInterruptHandler(KEYBOARD_IRQ, [13, false])
    };

    this.invalidFileNames = function() {
        alert('Test: Invalid file names\nThis will format the disk and then try to create files with various names. First 2 are valid. 3rd is too long of a name. 4th uses the prefix of a swap file. 5th file already exists.\nExpected: First 2 are valid and creates the files. Last 3 are invalid file names.')

        _KernelInputQueue.enqueue('f')
        _KernelInputQueue.enqueue('o')
        _KernelInputQueue.enqueue('r')
        _KernelInputQueue.enqueue('m')
        _KernelInputQueue.enqueue('a')
        _KernelInputQueue.enqueue('t')
        TSOS.Kernel.prototype.krnInterruptHandler(KEYBOARD_IRQ, [13, false])

        // This is a valid file name
        let testCommand = 'create test'
        for (let i = 0; i < testCommand.length; i++) {
            _KernelInputQueue.enqueue(testCommand.charAt(i));
        }
        TSOS.Kernel.prototype.krnInterruptHandler(KEYBOARD_IRQ, [13, false])

        // The exact max file name length
        testCommand = 'create ' + 'A'.repeat(55);
        for (let i = 0; i < testCommand.length; i++) {
            _KernelInputQueue.enqueue(testCommand.charAt(i));
        }
        TSOS.Kernel.prototype.krnInterruptHandler(KEYBOARD_IRQ, [13, false])

        // One letter longer than the max file length name (should be rejected)
        testCommand = 'create ' + 'A'.repeat(56);
        for (let i = 0; i < testCommand.length; i++) {
            _KernelInputQueue.enqueue(testCommand.charAt(i));
        }
        TSOS.Kernel.prototype.krnInterruptHandler(KEYBOARD_IRQ, [13, false])

        // Swap file beginning of file (should be rejected)
        testCommand = 'create ~test'
        for (let i = 0; i < testCommand.length; i++) {
            _KernelInputQueue.enqueue(testCommand.charAt(i));
        }
        TSOS.Kernel.prototype.krnInterruptHandler(KEYBOARD_IRQ, [13, false])

        testCommand = 'create test'
        for (let i = 0; i < testCommand.length; i++) {
            _KernelInputQueue.enqueue(testCommand.charAt(i));
        }
        TSOS.Kernel.prototype.krnInterruptHandler(KEYBOARD_IRQ, [13, false])
    }

    this.tests = {
        "iP4: Disk not formatted": this.diskNotFormatted,
        "iP4: Invalid file names": this.invalidFileNames,
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