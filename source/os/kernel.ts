/* ------------
     Kernel.ts

     Routines for the Operating System, NOT the host.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    export class Kernel {
        //
        // OS Startup and Shutdown Routines
        //
        public krnBootstrap() {      // Page 8. {
            Control.hostLog("bootstrap", "host");  // Use hostLog because we ALWAYS want this, even if _Trace is off.

            // Initialize our global queues.
            _KernelInterruptQueue = new Queue();  // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array();         // Buffers... for the kernel.
            _KernelInputQueue = new Queue();      // Where device input lands before being processed out somewhere.

            _MemoryManager = new MemoryManager(); // The memory manager for allocating memory for processes
            _PCBReadyQueue = new Queue(); // The queue for the executing process control blocks

            // Initialize the console.
            _StdOut = new Console();             // The command line interface / console I/O device.
            _StdOut.init();

            // Initialize standard input and output to the _StdOut.
            _StdIn  = _StdOut;
            _StdOut = _StdOut;

            // Initialize the scheduler and dispatcher
            _Scheduler = new Scheduler();
            _Dispatcher = new Dispatcher();

            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.
            _krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
            this.krnTrace('Kbd device driver status: ' + _krnKeyboardDriver.status);

            this.krnTrace("Loading the disk system device driver.");
            _krnDiskSystemDeviceDriver = new DiskSystemDeviceDriver();
            _krnDiskSystemDeviceDriver.driverEntry();
            this.krnTrace('Ds device driver status: ' + _krnDiskSystemDeviceDriver.status);

            //
            // ... more?
            //

            // Enable the OS   (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace("Enabling the ");
            this.krnEnableInterrupts();

            // Launch the shell.
            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new Shell();
            _OsShell.init();

            // Finally, initiate student testing protocol.
            if (_GLaDOS) {
                _GLaDOS.afterStartup();
            }
        }

        public krnShutdown() {
            this.krnTrace("begin shutdown OS");
            // TODO: Check for running processes.  If there are some, alert and stop. Else...
            // ... Disable the 
            this.krnTrace("Disabling the ");
            this.krnDisableInterrupts();

            if (_CPU.isExecuting) {
                // Abruptly terminate the program
                let finishedProgram: ProcessControlBlock = _PCBReadyQueue.dequeue();
                finishedProgram.status = 'Terminated';

                // Get final CPU values and save them in the table
                finishedProgram.updateCpuInfo(_CPU.PC, _CPU.IR, _CPU.Acc, _CPU.Xreg, _CPU.Yreg, _CPU.Zflag);
                finishedProgram.updateTableEntry();

                // Clear the CPU
                _CPU.init();
            }

            // Stop everything from running
            this.krnTrace('Stopping the CPU and logging.');
            clearInterval(_hardwareClockID);

            //
            // Unload the Device Drivers?
            // More?
            //
            this.krnTrace("end shutdown OS");
        }


        public krnOnCPUClockPulse() {
            /* This gets called from the host hardware simulation every time there is a hardware clock pulse.
               This is NOT the same as a TIMER, which causes an interrupt and is handled like other 
               This, on the other hand, is the clock pulse from the hardware / VM / host that tells the kernel
               that it has to look for interrupts and process them if it finds any.                          
            */

            // Check for an interrupt, if there are any. Page 560
            if (_KernelInterruptQueue.getSize() > 0) {
                // The process was interrupted, so we have to update its status
                let currentPCB: ProcessControlBlock = _PCBReadyQueue.getHead();
                if (currentPCB !== undefined && currentPCB.status !== 'Terminated') {
                    currentPCB.status = 'Ready';
                    currentPCB.updateTableEntry();
                }

                // Process the first interrupt on the interrupt queue.
                // TODO (maybe): Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            } else if (!_CPU.isExecuting && _PCBReadyQueue.getSize() > 0) {
                // No processes are running, so we need to schedule the first one
                _Scheduler.scheduleFirstProcess();
                this.krnTrace('Scheduling first process');
            } else if (_CPU.isExecuting) { // If there are no interrupts then run one CPU cycle if there is anything being processed.
                    // Get the button for requesting the step
                    let stepBtn: HTMLButtonElement = document.querySelector('#stepBtn');
    
                    // We can execute a CPU cycle if the step button is disabled (single step off)
                    // or if the button is enabled and the user just clicked it (_NextStepRequested)
                    if (stepBtn.disabled || (!stepBtn.disabled && _NextStepRequested)) {
                        // Determine if the time is up for the process and if the cpu should run another cycle
                        if (_Scheduler.handleCpuSchedule()) {
                            _CPU.cycle();
        
                            // Get the running program and update its value in the PCB table
                            let currentPCB: ProcessControlBlock = _PCBReadyQueue.getHead();
                            currentPCB.status = 'Running';
                            currentPCB.updateCpuInfo(_CPU.PC, _CPU.IR, _CPU.Acc, _CPU.Xreg, _CPU.Yreg, _CPU.Zflag);
                            currentPCB.updateTableEntry();

                            // Iterate through all of the running and ready processes
                            for (const process of _PCBReadyQueue.q) {
                                // Turnaround time increases
                                process.turnaroundTime++;
                                // Increment the wait time if they are not currently executing
                                if (process.status === 'Ready') {
                                    process.waitTime++;
                                }
                            }
                        }
    
                        // Set the flag to false so the user can click again
                        // If the button is disabled, it still will be false
                        _NextStepRequested = false;
                    }
            } else {
                // If there are no interrupts and there is nothing being executed then just be idle.
                this.krnTrace("Idle");
            }
        }


        //
        // Interrupt Handling
        //
        public krnEnableInterrupts() {
            // Keyboard
            Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        }

        public krnDisableInterrupts() {
            // Keyboard
            Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        }

        public krnInterruptHandler(irq, params) {
            // This is the Interrupt Handler Routine.  See pages 8 and 560.
            // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on. Page 766.
            this.krnTrace("Handling IRQ~" + irq);

            // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
            // TODO: Consider using an Interrupt Vector in the future.
            // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.
            //       Maybe the hardware simulation will grow to support/require that in the future.
            switch (irq) {
                case TIMER_IRQ:
                    this.krnTimerISR();               // Kernel built-in routine for timers (not the clock).
                    break;
                case KEYBOARD_IRQ:
                    _krnKeyboardDriver.isr(params);   // Kernel mode device driver
                    _StdIn.handleInput();
                    break;
                case PROG_BREAK_SINGLE_IRQ: 
                    // Terminate the running program
                    this.krnTerminateProcess(_PCBReadyQueue.getHead(), 0, '');                    
                    break;

                case PROG_BREAK_ALL_IRQ:
                    _StdOut.advanceLine();
                    if (_PCBReadyQueue.getSize() === 0) {
                        _StdOut.putText('No programs are running.');
                        _StdOut.advanceLine();
                    } else {
                        this.krnTerminateProcess(_PCBReadyQueue.getHead(), 0, 'User halt.', false);
                        while (_PCBReadyQueue.getSize() > 1) {
                            this.krnTerminateProcess(_PCBReadyQueue.q[1], 0, 'User halt.', false);
                        }
                    }
                    _OsShell.putPrompt();
                    break;

                case MEM_EXCEPTION_IRQ:                
                    // Trace the error
                    let outputStr: string = ` Memory out of bounds exception. Requested Addr: ${Utils.getHexString(params[0], 4, true)}; Segment: ${params[1]}`;
                    this.krnTerminateProcess(_PCBReadyQueue.getHead(), 1, outputStr);
                    break;

                case INVALID_OPCODE_IRQ:                    
                    // Generate the error message and call the kill process command
                    let errStr: string = `Invalid opcode. Requested Opcode: ${Utils.getHexString(params[0], 2, false)}`;
                    this.krnTerminateProcess(_PCBReadyQueue.getHead(), 1, errStr);
                    break;    

                case SYSCALL_PRINT_INT_IRQ:
                    // Print the integer to the screen
                    let printedOutput: string = params[0].toString();
                    _StdOut.putText(printedOutput);

                    // Add it to the buffered output for the program
                    let curProgram: ProcessControlBlock = _PCBReadyQueue.getHead();
                    curProgram.output += printedOutput;

                    break;

                case SYSCALL_PRINT_STR_IRQ:
                    // Get the current program to add to the output buffer
                    let runningProg: ProcessControlBlock = _PCBReadyQueue.getHead();

                    // Get the first character from memory
                    // Will return -1 if there is an error and will check for error bounds
                    let charVal: number = _MemoryAccessor.callRead(params[0]);

                    // Increment variable to go untir 0x00 or error
                    let i: number = 0;
                    while (charVal !== -1 && charVal !== 0) {
                        // Print the character
                        let printedChar: string = String.fromCharCode(charVal);
                        _StdOut.putText(printedChar);

                        // Add the character to the program's output
                        runningProg.output += printedChar;

                        // Increment i and get the next character
                        i++;
                        charVal = _MemoryAccessor.callRead(params[0] + i);
                    }
                    break;
                
                case CALL_DISPATCHER_IRQ:
                    _Dispatcher.contextSwitch(params[0]);
                    this.krnTrace('Called dispatcher')
                    break;

                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        }

        public krnTimerISR() {
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
            // Or do it elsewhere in the Kernel. We don't really need this.
        }

        //
        // System Calls... that generate software interrupts via tha Application Programming Interface library routines.
        //
        // Some ideas:
        // - ReadConsole
        // - WriteConsole
        // - CreateProcess
        // - ExitProcess
        // - WaitForProcessToExit
        // - CreateFile
        // - OpenFile
        // - ReadFile
        // - WriteFile
        // - CloseFile

        public krnClearMemory(): void {
            if (_CPU.isExecuting) {
                _StdOut.putText('Cannot clear memory when the CPU is executing.');
            } else {
                _MemoryManager.deallocateAll();
                _StdOut.putText('All memory cleared.');
            }
        }

        public krnCreateProcess(prog: number[]) {
            // Try to load a process into memory
            let segment: number = _MemoryManager.allocateProgram(prog);

            // Create the PCB
            let pcbCreated: boolean = true;
            let newPCB: ProcessControlBlock = new ProcessControlBlock(segment);

            if (newPCB.segment === -1) {
                // Try to create a swap file if no room in memory
                let swapFileOutput: number = this.createSwapFile(newPCB.swapFile, prog);
                if (swapFileOutput === 0) {
                    // A segment of 3 is being used to represent the disk
                    newPCB.segment = 3;

                    // The swap file was made, so the PCB can be recorded
                    newPCB.createTableEntry();
                    _PCBHistory.push(newPCB);
                } else {
                    switch (swapFileOutput) {
                        case 1:
                            _StdOut.putText('Could not load process to disk. Disk is not formatted.');
                            break;    
                        case 3:
                            _StdOut.putText('Could not load process to disk. Not enough directory space.');
                            break;
                        case 4:
                        case 6:
                            _StdOut.putText('Could not load process to disk. Not enough data space.');
                            break;
                        case 2:
                        case 5:
                        case 7:
                            this.krnTrapError('Error creating swap file.');
                            break;
                    }
                    // Swap file was not created, so backtrack a little
                    ProcessControlBlock.CurrentPID--;
                    pcbCreated = false;
                }
            } else {
                // Can add the pcb because it is already in memory
                _PCBHistory.push(newPCB);
                newPCB.createTableEntry();
            }

            if (pcbCreated) {
                // Let the user know the program is valid
                this.krnTrace(`Created PID ${newPCB.pid}`);
                _StdOut.putText(`Process ID: ${newPCB.pid}`);
            } else {
                this.krnTrace('Failed to load program.');
                _StdOut.advanceLine();
                _StdOut.putText('Program was not loaded.');
            }
        }

        public krnTerminateProcess(requestedProcess: ProcessControlBlock, status: number, msg: string, putPrompt: boolean = true): void {
            requestedProcess.status = 'Terminated';

            if (_PCBReadyQueue.getHead() === requestedProcess) {
                // Get final CPU values and save them in the table if the program is running
                requestedProcess.updateCpuInfo(_CPU.PC, _CPU.IR, _CPU.Acc, _CPU.Xreg, _CPU.Yreg, _CPU.Zflag);
                _Scheduler.handleCpuSchedule();
            } else {
                // Otherwise we can just remove the process from the ready queue and the dispatcher will not be affected
                _PCBReadyQueue.remove(requestedProcess);
            }

            if (requestedProcess.segment === 3) {
                _krnDiskSystemDeviceDriver.deleteFile(requestedProcess.swapFile);
                requestedProcess.segment = -1;
            }

            // Update the table entry with the terminated status and the updated cpu values
            requestedProcess.updateTableEntry();
            
            // Trace the error
            let errStr: string = `Process ${requestedProcess.pid} terminated with status code ${status}. ${msg}`;
            this.krnTrace(errStr);
            
            // Reset the area for the output to be printed
            _StdOut.resetCmdArea();

            // Print out the status and all
            if (putPrompt) {
                _StdOut.advanceLine();
            }
            _StdOut.putText(errStr);
            _StdOut.advanceLine();
            _StdOut.putText(`Program output: ${requestedProcess.output}`);

            _StdOut.advanceLine();

            _StdOut.putText(`Turnaround time: ${requestedProcess.turnaroundTime} CPU cycles`);
            _StdOut.advanceLine();
            _StdOut.putText(`Wait time: ${requestedProcess.waitTime} CPU cycles`);

            // Reset again in case of word wrap
            _StdOut.resetCmdArea();

            // Set up for the new command
            _StdOut.advanceLine();
            if (putPrompt) {
                _OsShell.putPrompt();
            }
        }

        public krnSwap(pcb: ProcessControlBlock): void {
            // Check for an available segment in memory
            if (!_MemoryManager.hasAvailableSegment()) {
                // Roll out the most recently run process
                this.krnRollOut(_PCBReadyQueue.getTail());
            }
            // Roll in the given process
            this.krnRollIn(pcb);
        }

        public krnRollOut(pcb: ProcessControlBlock): void {
            // Create the swap file for the process
            if (pcb.status === 'Ready') {
                let fileCreationStatus: number = this.createSwapFileForSegment(pcb.swapFile, pcb.segment);
                if (fileCreationStatus !== 0) {
                    // BSOD if any error
                    this.krnTrapError('Error from creating a swap file.');
                }
            }
            
            // Free it up in the pcb
            _MemoryManager.deallocateProcess(pcb, pcb.status === 'Ready');

            // Update the table
            pcb.updateTableEntry();
        }

        public krnRollIn(pcb: ProcessControlBlock): void {
            // Read the swap file from the disk
            let swapRead: any[] = _krnDiskSystemDeviceDriver.readFileRaw(pcb.swapFile, 0x100);
            _krnDiskSystemDeviceDriver.deleteFile(pcb.swapFile);
            if (swapRead[0] === 0) {
                let newSegment: number = _MemoryManager.allocateProgram(swapRead[1]);
                pcb.segment = newSegment;
            } else {
                // Nothing bad should ever happen from reading, but do a BSOD in case
                this.krnTrapError('Error from reading a swap file.');
            }
            pcb.updateTableEntry();
        }

        public krnFormatDisk(quick: boolean): void {
            // Get the files on the disk
            let files: string[] = _krnDiskSystemDeviceDriver.getFileList();
            // Check if there is a swap file
            if (files !== null && files.find(file => file.charAt(0) === '~')) {
                // Cannot format if there are swap files on the disk
                _StdOut.putText('Disk cannot be formatted. Swap files found on the disk.');
            } else {
                // Otherwise can format the disk
                _krnDiskSystemDeviceDriver.formatDisk(quick);
                _StdOut.putText('Successfully formatted the disk.');
            }
        }

        public createSwapFileForSegment(swapFileName: string, segment: number): number {
            // Get the program from memory
            let program: number[] = _MemoryAccessor.memoryDump(_BaseLimitPairs[segment][0], _BaseLimitPairs[segment][1]);

            // Create the swap file and return the error status
            return this.createSwapFile(swapFileName, program);
        }

        // Possible outputs:
        // 0: Successful
        // 1: Disk not formatted
        // 2: File already exists
        // 3: No directory room
        // 4: No data room
        // 5: File does not exist
        // 6: Partial write
        // 7: Internal error
        public createSwapFile(swapFileName: string, program: number[]): number {
            let out: number = 0;

            // Call the dsDD to create a file on the disk if possible
            let createFileOutput: number = _krnDiskSystemDeviceDriver.createFileWithInitialSize(swapFileName, program.length);
            switch (createFileOutput) {
                case 1:
                    // Disk is not formatted, so cannot work with swap files
                    out = 1;
                    break;
                case 2:
                    // File already exists (should never come up)
                    out = 2;
                    break;
                case 3:
                    // No directory room
                    out = 3;
                    break;
                case 4:
                    // No data room
                    out = 4;
                    break;
            }

            if (out === 0) {
                // Convert the binary into a hex string of length 256 bytes
                let programStr: string = program.map((e: number) => e.toString(16).toUpperCase().padStart(2, '0')).join('').padEnd(0x100 * 2, '0');

                // Write the data to the swap file
                let writeOutput: number = _krnDiskSystemDeviceDriver.writeFile(swapFileName, programStr, true);
                switch (writeOutput) {
                    case 1:
                        // Disk not formatted should never be reached
                        out = 1;
                        break;
                    case 2:
                        // File not found should also never be reached
                        out = 5;
                        break;
                    case 3:
                        // Partial write should never be reached because we allocated the space ahead of time to make sure there is enough room
                        out = 6;
                        break;
                    case 4:
                        // Internal error should never be reached if everything is implemented correctly
                        out = 7;
                        break;
                }
                if (out === 1) {
                    // If something went wrong, make sure that the file gets deleted because it will not be used
                    // Do not care about output, just get it done
                    _krnDiskSystemDeviceDriver.deleteFile(swapFileName);
                }
            }

            return out;
        }

        public krnCreateFile(fileName: string): void {
            // Call the dsDD to create a file on the disk if possible
            let createFileOutput: number = _krnDiskSystemDeviceDriver.createFile(fileName);

            // Print out a response accordingly
            switch (createFileOutput) {
                case 0:
                    _StdOut.putText('Successfully created file: ' + fileName);
                    break;
                case 1:
                    _StdOut.putText('Failed to create the file. The disk is not formatted.');
                    break;
                case 2:
                    _StdOut.putText('Failed to create the file. ' + fileName + ' already exists.');
                    break;
                case 3:
                    _StdOut.putText('Failed to create the file. There is no room in the directory.');
                    break;
                case 4:
                    _StdOut.putText('Failed to create the file. There are no available data blocks on the disk.');
                    break;
            }
        }

        public krnWriteFile(fileName: string, contents: string): void {
            // Call the dsDD to write contents to a file on the disk if possible
            let writeFileOutput: number = _krnDiskSystemDeviceDriver.writeFile(fileName, contents);

            // Print out a response accordingly
            switch (writeFileOutput) {
                case 0:
                    _StdOut.putText('Successfully wrote to file: ' + fileName);
                    break;
                case 1:
                    _StdOut.putText('Failed to write to the file. The disk is not formatted.');
                    break;
                case 2:
                    _StdOut.putText('Failed to write to the file. ' + fileName + ' does not exist.');
                    break;
                case 3:
                    _StdOut.putText('Performed a partial write to file: ' + fileName + '. Not enough available data blocks on the disk.');
                    break;
                case 4:
                    _StdOut.putText("Internal file system error. Please reformat the disk.");
                    break;
            }
        }

        public krnListFiles(includeHiddenFiles: boolean): void {
            // Get the file list from the dsDD
            let fileList: string[] = _krnDiskSystemDeviceDriver.getFileList();
            if (fileList === null) {
                _StdOut.putText('Cannot list files. The disk is not formatted.');
            } else if (fileList.length === 0) {
                _StdOut.putText('There are no files to list.')
            } else {
                // Print out each file name
                for (let i: number = 0; i < fileList.length; i++) {
                    // List the file if hidden files is on or if the file doesn't start with a . or a ~
                    if (includeHiddenFiles || !(fileList[i].charAt(0) === '.' || fileList[i].charAt(0) === '~')) {
                        _StdOut.putText('  ' + fileList[i]);
                        _StdOut.advanceLine();
                    }
                }
            }
        }

        public krnReadFile(fileName: string): void {
            // Read the file and get the results
            let fileReadOutput: any[] = _krnDiskSystemDeviceDriver.readFile(fileName);

            switch (fileReadOutput[0]) {
                case 0:
                    // File read was successful so print the contents
                    for (let i: number = 0; i < fileReadOutput[1].length; i++) {
                        _StdOut.putText(String.fromCharCode(fileReadOutput[1][i]));
                    }
                    _StdOut.advanceLine();
                    break;
                case 1:
                    _StdOut.putText('Failed to read from the file. The disk is not formatted.');
                    break;
                case 2:
                    _StdOut.putText('Failed to read from the file. ' + fileName + ' does not exist.');
                    break;
                case 3:
                    _StdOut.putText("Internal file system error. Please reformat the disk.");
                    break;
            }
        }

        public krnDeleteFile(fileName: string): void {
            let fileDeleteOutput: number = _krnDiskSystemDeviceDriver.deleteFile(fileName);

            switch (fileDeleteOutput) {
                case 0:
                    _StdOut.putText('Successfully deleted file: ' + fileName);
                    break;
                case 1:
                    _StdOut.putText('Failed to delete the file. The disk is not formatted.');
                    break;
                case 2:
                    _StdOut.putText('Failed to delete the file. ' + fileName + ' does not exist.');
                    break;
                case 3:
                    _StdOut.putText("Internal file system error. Please reformat the disk.");
                    break;
            }
        }

        public krnRenameFile(oldFileName: string, newFileName: string): void {
            let renameOutput: number = _krnDiskSystemDeviceDriver.renameFile(oldFileName, newFileName);

            switch (renameOutput) {
                case 0:
                    _StdOut.putText('Successfully renamed ' + oldFileName + ' to ' + newFileName + '.');
                    break;
                case 1:
                    _StdOut.putText('Failed to rename the file. The disk is not formatted.');
                    break;
                case 2:
                    _StdOut.putText('Failed to rename the file. ' + oldFileName + ' does not exist.');
                    break;
            }
        }

        public krnCopyFile(curFileName: string, newFileName: string): void {
            // Copy the file
            let copyOutput: number = _krnDiskSystemDeviceDriver.copyFile(curFileName, newFileName);

            // Handle the output codes
            switch (copyOutput) {
                case 0:
                    _StdOut.putText('Successfully copied ' + curFileName + ' to ' + newFileName + '.');
                    break;
                case 1:
                    _StdOut.putText('Failed to copy the file. The disk is not formatted.');
                    break;
                case 2:
                    _StdOut.putText('Failed to copy the file. ' + curFileName + ' does not exist.');
                    break;
                case 3:
                    _StdOut.putText('Failed to copy the file. ' + newFileName + ' already exists.');
                    break;
                case 4:
                    _StdOut.putText('Failed to copy the file. There is no room in the directory for the new file.');
                    break;
                case 5:
                    _StdOut.putText('Failed to copy the file. There are no available data blocks on the disk for the new file.');
                    break;    
                case 6:
                    _StdOut.putText("Internal file system error when reading " + curFileName  + ". Please reformat the disk.");
                    break;
                case 7:
                    _StdOut.putText('Performed a partial copy of ' + curFileName + ' to ' + newFileName + '. Not enough available data blocks on the disk.');
                    break;
                case 8:
                    _StdOut.putText("Internal file system error when writing to " + newFileName + ". Please reformat the disk.");
                    break;
            }
        }

        //
        // OS Utility Routines
        //
        public krnTrace(msg: string) {
             // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
             if (_Trace) {
                if (msg === "Idle") {
                    // We can't log every idle clock pulse because it would quickly lag the browser quickly.
                    if (_OSclock % 10 == 0) {
                        // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                        // idea of the tick rate and adjust this line accordingly.
                        Control.hostLog(msg, "OS");
                    }
                } else {
                    Control.hostLog(msg, "OS");
                }
             }
        }

        public krnTrapError(msg) {
            Control.hostLog("OS ERROR - TRAP: " + msg);
            _StdOut.bsod();
            this.krnShutdown();
        }
    }
}
