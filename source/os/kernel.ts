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
            _Console = new Console();             // The command line interface / console I/O device.
            _Console.init();

            // Initialize standard input and output to the _Console.
            _StdIn  = _Console;
            _StdOut = _Console;

            // Initialize the scheduler and dispatcher
            _Scheduler = new Scheduler();
            _Dispatcher = new Dispatcher();

            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.
            _krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);

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
                // Process the first interrupt on the interrupt queue.
                // TODO (maybe): Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);

                // The process was interrupted, so we have to update its status
                let currentPCB: ProcessControlBlock = _PCBReadyQueue.getHead();
                if (currentPCB !== undefined) {
                    currentPCB.status = 'Ready';
                    currentPCB.updateTableEntry();
                }

            } else if (_CPU.isExecuting) { // If there are no interrupts then run one CPU cycle if there is anything being processed.
                // Get the button for requesting the step
                let stepBtn: HTMLButtonElement = document.querySelector('#stepBtn');

                // We can execute a CPU cycle if the step button is disabled (single step off)
                // or if the button is enabled and the user just clicked it (_NextStepRequested)
                if (stepBtn.disabled || (!stepBtn.disabled && _NextStepRequested)) {
                    _CPU.cycle();

                    // Get the running program and update its value in the PCB table
                    let currentPCB: ProcessControlBlock = _PCBReadyQueue.getHead();
                    currentPCB.status = 'Running';
                    currentPCB.updateCpuInfo(_CPU.PC, _CPU.IR, _CPU.Acc, _CPU.Xreg, _CPU.Yreg, _CPU.Zflag);
                    currentPCB.updateTableEntry();

                    // Tell the scheduler that another CPU cycle happened so it can determine next steps
                    _Scheduler.handleCpuSchedule();

                    // Set the flag to false so the user can click again
                    // If the button is disabled, it still will be false
                    _NextStepRequested = false;
                }
            } else {                       // If there are no interrupts and there is nothing being executed then just be idle.
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
                case PROG_BREAK_IRQ:
                    // Set the CPU to not execute anymore
                    _CPU.isExecuting = false;
                    
                    // Get the finished program and set it to terminated
                    let finishedProgram: ProcessControlBlock = _PCBReadyQueue.dequeue();
                    if (finishedProgram !== undefined) {
                        finishedProgram.status = 'Terminated';
    
                        // Get final CPU values and save them in the table
                        finishedProgram.updateCpuInfo(_CPU.PC, _CPU.IR, _CPU.Acc, _CPU.Xreg, _CPU.Yreg, _CPU.Zflag);
                        finishedProgram.updateTableEntry();
    
                        // Reset the CPU
                        _CPU.init();
    
                        // Trace the terminated program
                        let outputStr: string = `Process ${finishedProgram.pid} terminated with status code 0.`;
                        this.krnTrace(outputStr);

                        // Reset the area for the output to be printed
                        _Console.resetCmdArea();

                        // Print out the status and all
                        _Console.advanceLine();
                        _Console.putText(outputStr);
                        _Console.advanceLine();
                        _Console.putText(`Program output: ${finishedProgram.output}`);

                        // Reset again in case of word wrap
                        _Console.resetCmdArea();

                        // Set up for the new command
                        _Console.advanceLine();
                        _OsShell.putPrompt();
                    }
                    break;
                case MEM_EXCEPTION_IRQ:
                    // Set the CPU to not execute anymore
                    _CPU.isExecuting = false;

                    // Get the finished program and set it to terminated
                    let exitedProgram: ProcessControlBlock = _PCBReadyQueue.dequeue();
                    exitedProgram.status = 'Terminated';

                    // Get final CPU values and save them in the table
                    exitedProgram.updateCpuInfo(_CPU.PC, _CPU.IR, _CPU.Acc, _CPU.Xreg, _CPU.Yreg, _CPU.Zflag);
                    exitedProgram.updateTableEntry();

                    // Reset the CPU
                    _CPU.init();
                    
                    // Trace the error
                    let outputStr: string = `Process ${exitedProgram.pid} terminated with status code 1. Memory out of bounds exception. Requested Addr: ${Utils.getHexString(params[0], 4, true)}; Segment: ${params[1]}`;
                    this.krnTrace(outputStr);
                    
                    // Reset the area for the output to be printed
                    _Console.resetCmdArea();

                    // Print out the status and all
                    _Console.advanceLine();
                    _Console.putText(outputStr);
                    _Console.advanceLine();
                    _Console.putText(`Program output: ${exitedProgram.output}`);

                    // Reset again in case of word wrap
                    _Console.resetCmdArea();

                    // Set up for the new command
                    _Console.advanceLine();
                    _OsShell.putPrompt();
                    break;

                    case INVALID_OPCODE_IRQ:
                        // Set the CPU to not execute anymore
                        _CPU.isExecuting = false;
    
                        // Get the finished program and set it to terminated
                        let prog: ProcessControlBlock = _PCBReadyQueue.dequeue();
                        prog.status = 'Terminated';
    
                        // Get final CPU values and save them in the table
                        prog.updateCpuInfo(_CPU.PC, _CPU.IR, _CPU.Acc, _CPU.Xreg, _CPU.Yreg, _CPU.Zflag);
                        prog.updateTableEntry();
    
                        // Reset the CPU
                        _CPU.init();
                        
                        // Trace the error
                        let errStr: string = `Process ${prog.pid} terminated with status code 1. Invalid opcode. Requested Opcode: ${Utils.getHexString(params[0], 2, false)}`;
                        this.krnTrace(errStr);
                        
                        // Reset the area for the output to be printed
                        _Console.resetCmdArea();
    
                        // Print out the status and all
                        _Console.advanceLine();
                        _Console.putText(errStr);
                        _Console.advanceLine();
                        _Console.putText(`Program output: ${prog.output}`);
    
                        // Reset again in case of word wrap
                        _Console.resetCmdArea();
    
                        // Set up for the new command
                        _Console.advanceLine();
                        _OsShell.putPrompt();
                        break;    

                case SYSCALL_PRINT_INT_IRQ:
                    // Print the integer to the screen
                    let printedOutput: string = params[0].toString();
                    _Console.putText(printedOutput);

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
                        _Console.putText(printedChar);

                        // Add the character to the program's output
                        runningProg.output += printedChar;

                        // Increment i and get the next character
                        i++;
                        charVal = _MemoryAccessor.callRead(params[0] + i);
                    }
                    break;
                
                case CALL_DISPATCHER_IRQ:
                    _Dispatcher.contextSwitch();
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
            _Console.bsod();
            this.krnShutdown();
        }
    }
}
