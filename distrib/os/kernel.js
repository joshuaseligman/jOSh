/* ------------
     Kernel.ts

     Routines for the Operating System, NOT the host.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */
var TSOS;
(function (TSOS) {
    class Kernel {
        //
        // OS Startup and Shutdown Routines
        //
        krnBootstrap() {
            TSOS.Control.hostLog("bootstrap", "host"); // Use hostLog because we ALWAYS want this, even if _Trace is off.
            // Initialize our global queues.
            _KernelInterruptQueue = new TSOS.Queue(); // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array(); // Buffers... for the kernel.
            _KernelInputQueue = new TSOS.Queue(); // Where device input lands before being processed out somewhere.
            _MemoryManager = new TSOS.MemoryManager(); // The memory manager for allocating memory for processes
            _PCBReadyQueue = new TSOS.Queue(); // The queue for the executing process control blocks
            // Initialize the console.
            _StdOut = new TSOS.Console(); // The command line interface / console I/O device.
            _StdOut.init();
            // Initialize standard input and output to the _StdOut.
            _StdIn = _StdOut;
            _StdOut = _StdOut;
            // Initialize the scheduler and dispatcher
            _Scheduler = new TSOS.Scheduler();
            _Dispatcher = new TSOS.Dispatcher();
            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new TSOS.DeviceDriverKeyboard(); // Construct it.
            _krnKeyboardDriver.driverEntry(); // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);
            //
            // ... more?
            //
            // Enable the OS   (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace("Enabling the ");
            this.krnEnableInterrupts();
            // Launch the shell.
            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new TSOS.Shell();
            _OsShell.init();
            // Finally, initiate student testing protocol.
            if (_GLaDOS) {
                _GLaDOS.afterStartup();
            }
        }
        krnShutdown() {
            this.krnTrace("begin shutdown OS");
            // TODO: Check for running processes.  If there are some, alert and stop. Else...
            // ... Disable the 
            this.krnTrace("Disabling the ");
            this.krnDisableInterrupts();
            if (_CPU.isExecuting) {
                // Abruptly terminate the program
                let finishedProgram = _PCBReadyQueue.dequeue();
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
        krnOnCPUClockPulse() {
            /* This gets called from the host hardware simulation every time there is a hardware clock pulse.
               This is NOT the same as a TIMER, which causes an interrupt and is handled like other
               This, on the other hand, is the clock pulse from the hardware / VM / host that tells the kernel
               that it has to look for interrupts and process them if it finds any.
            */
            // Check for an interrupt, if there are any. Page 560
            if (_KernelInterruptQueue.getSize() > 0) {
                // The process was interrupted, so we have to update its status
                let currentPCB = _PCBReadyQueue.getHead();
                if (currentPCB !== undefined && currentPCB.status !== 'Terminated') {
                    currentPCB.status = 'Ready';
                    currentPCB.updateTableEntry();
                }
                // Process the first interrupt on the interrupt queue.
                // TODO (maybe): Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            }
            else if (!_CPU.isExecuting && _PCBReadyQueue.getSize() > 0) {
                // No processes are running, so we need to schedule the first one
                _Scheduler.scheduleFirstProcess();
                this.krnTrace('Scheduling first process');
            }
            else if (_CPU.isExecuting) { // If there are no interrupts then run one CPU cycle if there is anything being processed.
                // Get the button for requesting the step
                let stepBtn = document.querySelector('#stepBtn');
                // We can execute a CPU cycle if the step button is disabled (single step off)
                // or if the button is enabled and the user just clicked it (_NextStepRequested)
                if (stepBtn.disabled || (!stepBtn.disabled && _NextStepRequested)) {
                    // Determine if the time is up for the process and if the cpu should run another cycle
                    if (_Scheduler.handleCpuSchedule()) {
                        _CPU.cycle();
                        // Get the running program and update its value in the PCB table
                        let currentPCB = _PCBReadyQueue.getHead();
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
            }
            else {
                // If there are no interrupts and there is nothing being executed then just be idle.
                this.krnTrace("Idle");
            }
        }
        //
        // Interrupt Handling
        //
        krnEnableInterrupts() {
            // Keyboard
            TSOS.Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        }
        krnDisableInterrupts() {
            // Keyboard
            TSOS.Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        }
        krnInterruptHandler(irq, params) {
            // This is the Interrupt Handler Routine.  See pages 8 and 560.
            // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on. Page 766.
            this.krnTrace("Handling IRQ~" + irq);
            // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
            // TODO: Consider using an Interrupt Vector in the future.
            // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.
            //       Maybe the hardware simulation will grow to support/require that in the future.
            switch (irq) {
                case TIMER_IRQ:
                    this.krnTimerISR(); // Kernel built-in routine for timers (not the clock).
                    break;
                case KEYBOARD_IRQ:
                    _krnKeyboardDriver.isr(params); // Kernel mode device driver
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
                    }
                    else {
                        this.krnTerminateProcess(_PCBReadyQueue.getHead(), 0, 'User halt.', false);
                        while (_PCBReadyQueue.getSize() > 1) {
                            this.krnTerminateProcess(_PCBReadyQueue.q[1], 0, 'User halt.', false);
                        }
                    }
                    _OsShell.putPrompt();
                    break;
                case MEM_EXCEPTION_IRQ:
                    // Trace the error
                    let outputStr = ` Memory out of bounds exception. Requested Addr: ${TSOS.Utils.getHexString(params[0], 4, true)}; Segment: ${params[1]}`;
                    this.krnTerminateProcess(_PCBReadyQueue.getHead(), 1, outputStr);
                    break;
                case INVALID_OPCODE_IRQ:
                    // Generate the error message and call the kill process command
                    let errStr = `Invalid opcode. Requested Opcode: ${TSOS.Utils.getHexString(params[0], 2, false)}`;
                    this.krnTerminateProcess(_PCBReadyQueue.getHead(), 1, errStr);
                    break;
                case SYSCALL_PRINT_INT_IRQ:
                    // Print the integer to the screen
                    let printedOutput = params[0].toString();
                    _StdOut.putText(printedOutput);
                    // Add it to the buffered output for the program
                    let curProgram = _PCBReadyQueue.getHead();
                    curProgram.output += printedOutput;
                    break;
                case SYSCALL_PRINT_STR_IRQ:
                    // Get the current program to add to the output buffer
                    let runningProg = _PCBReadyQueue.getHead();
                    // Get the first character from memory
                    // Will return -1 if there is an error and will check for error bounds
                    let charVal = _MemoryAccessor.callRead(params[0]);
                    // Increment variable to go untir 0x00 or error
                    let i = 0;
                    while (charVal !== -1 && charVal !== 0) {
                        // Print the character
                        let printedChar = String.fromCharCode(charVal);
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
                    this.krnTrace('Called dispatcher');
                    break;
                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        }
        krnTimerISR() {
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
        krnCreateProcess(prog) {
            // Try to load a process into memory
            let segment = _MemoryManager.allocateProgram(prog);
            if (segment == -1) {
                // Trace and print the output for a failed load
                _Kernel.krnTrace('No space for the program.');
                _StdOut.putText('Failed to load program. No available space.');
            }
            else {
                // Create the PCB
                let newPCB = new TSOS.ProcessControlBlock(segment);
                _PCBHistory.push(newPCB);
                // Let the user know the program is valid
                _Kernel.krnTrace(`Created PID ${newPCB.pid}`);
                _StdOut.putText(`Process ID: ${newPCB.pid}`);
            }
        }
        krnTerminateProcess(requestedProcess, status, msg, putPrompt = true) {
            requestedProcess.status = 'Terminated';
            if (_PCBReadyQueue.getHead() === requestedProcess) {
                // Get final CPU values and save them in the table if the program is running
                requestedProcess.updateCpuInfo(_CPU.PC, _CPU.IR, _CPU.Acc, _CPU.Xreg, _CPU.Yreg, _CPU.Zflag);
                _Scheduler.handleCpuSchedule();
            }
            else {
                // Otherwise we can just remove the process from the ready queue and the dispatcher will not be affected
                _PCBReadyQueue.remove(requestedProcess);
            }
            // Update the table entry with the terminated status and the updated cpu values
            requestedProcess.updateTableEntry();
            // Trace the error
            let errStr = `Process ${requestedProcess.pid} terminated with status code ${status}. ${msg}`;
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
        //
        // OS Utility Routines
        //
        krnTrace(msg) {
            // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
            if (_Trace) {
                if (msg === "Idle") {
                    // We can't log every idle clock pulse because it would quickly lag the browser quickly.
                    if (_OSclock % 10 == 0) {
                        // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                        // idea of the tick rate and adjust this line accordingly.
                        TSOS.Control.hostLog(msg, "OS");
                    }
                }
                else {
                    TSOS.Control.hostLog(msg, "OS");
                }
            }
        }
        krnTrapError(msg) {
            TSOS.Control.hostLog("OS ERROR - TRAP: " + msg);
            _StdOut.bsod();
            this.krnShutdown();
        }
    }
    TSOS.Kernel = Kernel;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=kernel.js.map