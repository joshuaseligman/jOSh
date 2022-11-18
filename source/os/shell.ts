/* ------------
   Shell.ts

   The OS Shell - The "command line interface" (CLI) for the console.

    Note: While fun and learning are the primary goals of all enrichment center activities,
          serious injuries may occur when trying to write your own Operating System.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

module TSOS {
    export class Shell {
        // Properties
        public promptStr = ">";
        public commandList = [];
        public curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
        public apologies = "[sorry]";

        constructor() {
        }

        public init() {
            var sc: ShellCommand;
            //
            // Load the command list.

            // ver
            sc = new ShellCommand(this.shellVer,
                                  "ver",
                                  "- Displays the current version data.");
            this.commandList[this.commandList.length] = sc;

            // help
            sc = new ShellCommand(this.shellHelp,
                                  "help",
                                  "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;

            // shutdown
            sc = new ShellCommand(this.shellShutdown,
                                  "shutdown",
                                  "- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
            this.commandList[this.commandList.length] = sc;

            // cls
            sc = new ShellCommand(this.shellCls,
                                  "cls",
                                  "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;

            // man <topic>
            sc = new ShellCommand(this.shellMan,
                                  "man",
                                  "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;

            // trace <on | off>
            sc = new ShellCommand(this.shellTrace,
                                  "trace",
                                  "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;

            // rot13 <string>
            sc = new ShellCommand(this.shellRot13,
                                  "rot13",
                                  "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;

            // prompt <string>
            sc = new ShellCommand(this.shellPrompt,
                                  "prompt",
                                  "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;

            // date
            sc = new ShellCommand(this.shellDate,
                "date",
                "- Displays the current date and time.");
            this.commandList[this.commandList.length] = sc;

            // whereami
            sc = new ShellCommand(this.shellWhereAmI,
                "whereami",
                "- Displays your current location.");
            this.commandList[this.commandList.length] = sc;

            // seeya
            sc = new ShellCommand(this.shellSeeYa,
                "seeya",
                "- Watch a baseball get crushed. No questions asked.");
            this.commandList[this.commandList.length] = sc;

            // name
            sc = new ShellCommand(this.shellName,
                "name",
                "- Learn a name. You'll be happy you did.");
            this.commandList[this.commandList.length] = sc;

            // status
            sc = new ShellCommand(this.shellStatus,
                "status",
                "<string> - Updates the status in the status bar.");
            this.commandList[this.commandList.length] = sc;

            // testbsod
            sc = new ShellCommand(this.shellTestBSOD,
                "testbsod",
                "- Tests the blue screen of death when the kernel traps an OS error.");
            this.commandList[this.commandList.length] = sc;

            // load
            sc = new ShellCommand(this.shellLoad,
                "load",
                "[<priority>]- Loads the user program into memory with the given priority (8 is default)");
            this.commandList[this.commandList.length] = sc;

            // run
            sc = new ShellCommand(this.shellRun,
                "run",
                "<pid> - Runs the given process ID.");
            this.commandList[this.commandList.length] = sc;

            //clearmem
            sc = new ShellCommand(this.shellClearMem,
                "clearmem",
                "- Clears all memory partitions");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellRunAll,
                "runall",
                "- Execute all programs at once");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellPs,
                "ps",
                "- Display the PID and state of all processes");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellKill,
                "kill",
                "<pid> - Kill one process");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellKillAll,
                "killall",
                "- Kill all processes");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellQuantum,
                "quantum",
                "<int> - Sets the Round Robin quantum (measured in cpu cycles)");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellFormat,
                "format",
                "[-quick] - Performs a low-level format of the disk for use (-quick performs a quick format instead)");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellCreate,
                "create",
                "<filename> - Creates a file of the given name");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellReadFile,
                "read",
                "<filename> - Reads a file");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellWriteFile,
                "write",
                "<filename> \"<contents>\" - Writes the contents between the quotation marks to a given file");
            this.commandList[this.commandList.length] = sc;
            
            sc = new ShellCommand(this.shellDeleteFile,
                "delete",
                "<filename> - Deletes a file from the disk");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellListFiles,
                "ls",
                "[-a] - Lists the files on the disk (-a includes hidden files)");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellRenameFile,
                "rename",
                "<curFileName> <newFileName> - Changes the name of a file");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellCopyFile,
                "copy",
                "<curFileName> <newFileName> - Makes a copy of an existing file");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellGetSchedule,
                "getschedule",
                "- Returns the CPU scheduling algorithm being used");
            this.commandList[this.commandList.length] = sc;

            sc = new ShellCommand(this.shellSetSchedule,
                "setschedule",
                "<rr|fcfs|priority> - Sets the CPU scheduling algorithm to the one provided");
            this.commandList[this.commandList.length] = sc;

            // ps  - list the running processes and their IDs
            // kill <id> - kills the specified process id.

            // Display the initial prompt.
            this.putPrompt();
        }

        public putPrompt() {
            _StdOut.putText(this.promptStr);
        }

        public handleInput(buffer) {
            _Kernel.krnTrace("Shell Command~" + buffer);
            //
            // Parse the input...
            //
            var userCommand = this.parseInput(buffer);
            // ... and assign the command and args to local variables.
            var cmd = userCommand.command;
            var args = userCommand.args;
            //
            // Determine the command and execute it.
            //
            // TypeScript/JavaScript may not support associative arrays in all browsers so we have to iterate over the
            // command list in attempt to find a match. 
            // TODO: Is there a better way? Probably. Someone work it out and tell me in class.
            var index: number = 0;
            var found: boolean = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                } else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args);  // Note that args is always supplied, though it might be empty.
            } else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + Utils.rot13(cmd) + "]") >= 0) {     // Check for curses.
                    this.execute(this.shellCurse);
                } else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {        // Check for apologies.
                    this.execute(this.shellApology);
                } else { // It's just a bad command. {
                    this.execute(this.shellInvalidCommand);
                }
            }
        }

        // Note: args is an optional parameter, ergo the ? which allows TypeScript to understand that.
        public execute(fn, args?) {
            // We just got a command, so advance the line...
            _StdOut.advanceLine();
            // ... call the command function passing in the args with some über-cool functional programming ...
            fn(args);
            // Check to see if we need to advance the line again
            if (_StdOut.currentXPosition > 0) {
                _StdOut.advanceLine();
            }
            // ... and finally write the prompt again.
            if (fn !== this.shellTestBSOD) {
                this.putPrompt();
            }
        }

        public parseInput(buffer: string): UserCommand {
            var retVal = new UserCommand();

            // 1. Remove leading and trailing spaces.
            buffer = Utils.trim(buffer);

            // Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");

            // Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift().toLowerCase();  // Yes, you can do that to an array in JavaScript. See the Queue class.
            // Remove any left-over spaces.
            cmd = Utils.trim(cmd);
            // Record it in the return value.
            retVal.command = cmd;

            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        }

        //
        // Shell Command Functions. Kinda not part of Shell() class exactly, but
        // called from here, so kept here to avoid violating the law of least astonishment.
        //
        public shellInvalidCommand() {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Unbelievable. You, [subject name here],");
                _StdOut.advanceLine();
                _StdOut.putText("must be the pride of [subject hometown here].");
            } else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        }

        public shellCurse() {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        }

        public shellApology() {
           if (_SarcasticMode) {
              _StdOut.putText("I think we can put our differences behind us.");
              _StdOut.advanceLine();
              _StdOut.putText("For science . . . You monster.");
              _SarcasticMode = false;
           } else {
              _StdOut.putText("For what?");
           }
        }

        // Although args is unused in some of these functions, it is always provided in the 
        // actual parameter list when this function is called, so I feel like we need it.

        public shellVer(args: string[]) {
            _StdOut.putText(APP_NAME + " version " + APP_VERSION);
        }

        public shellHelp(args: string[]) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        }

        public shellShutdown(args: string[]) {
             _StdOut.putText("Shutting down...");
             // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed. If possible. Not a high priority. (Damn OCD!)
        }

        public shellCls(args: string[]) {         
            _StdOut.clearScreen();     
            _StdOut.resetXY();
        }

        public shellMan(args: string[]) {
            if (args.length > 0) {
                // Get the command that was requested by the argument for the man command
                let requestedCommand: ShellCommand = _OsShell.commandList.find(cmd => cmd.command === args[0].toLowerCase());
                if (requestedCommand !== undefined) {
                    let hasArgument: boolean = requestedCommand.description.includes(' - ');
                    if (hasArgument) {
                        // Situation for commands with 1 argument
                        // Split the description to separate the needed argument with the actual description
                        let splitDescription: string[] = requestedCommand.description.split(' - ');
                        // Print out the actual description
                        _StdOut.putText(splitDescription[1]);
                        _StdOut.advanceLine();
                        // Print out the command with the argument requirement
                        _StdOut.putText(`Usage: ${requestedCommand.command} ${splitDescription[0]}`);
                    } else {
                        // Commands with 0 arguments
                        // Get the description after the "- "
                        _StdOut.putText(requestedCommand.description.substring(2));
                        _StdOut.advanceLine();
                        // Add the usage for the user's reference
                        _StdOut.putText(`Usage: ${requestedCommand.command}`);
                    }
                } else {
                    // The command in the man argument is not valid
                    _StdOut.putText("No manual entry for " + args[0].toLowerCase() + ".");
                }
            } else {
                // Failed to provide a command to get the manual for
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
        }

        public shellTrace(args: string[]) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting.toLowerCase()) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, doofus.");
                        } else {
                            _Trace = true;
                            _StdOut.putText("Trace ON");
                        }
                        break;
                    case "off":
                        _Trace = false;
                        _StdOut.putText("Trace OFF");
                        break;
                    default:
                        _StdOut.putText("Invalid arguement.  Usage: trace <on | off>.");
                }
            } else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        }

        public shellRot13(args: string[]) {
            if (args.length > 0) {
                let strInput: string = args.join(' ').toLowerCase();
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(strInput + " = '" + Utils.rot13(strInput) +"'");
            } else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        }

        public shellPrompt(args: string[]) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        }

        public shellDate(args: string[]) {
            // Output the current date and time
            _StdOut.putText(`Current date: ${Utils.getDate()}`);
        }

        public shellWhereAmI(args: string[]) {
            // Prints the user's location
            _StdOut.putText('You are currently trapped in a simulation called the Matrix. Take the red pill to discover the truth of your current location.');
        }

        public shellSeeYa(args: string[]) {
            _StdOut.putText("SEE YA!!!");

            // The area with the gif overlaps the rest of the page, so we need to make the content visible
            let seeYaArea: HTMLDivElement = document.querySelector('#seeYaArea');
            seeYaArea.style.display = 'flex';
            
            // Remove the focus so no input during this time
            _Canvas.blur();

            // Wait 10 seconds (the length of the gif) to make the webpage back to how it was
            setTimeout(() => {
                seeYaArea.style.display = 'none';
                _Canvas.focus();
            }, 10000);
        }

        public shellName(args: string[]) {
            // The name
            _StdOut.putText('The name\'s Bond... James Bond.');
        }

        public shellStatus(args: string[]) {
            if (args.length > 0) {
                let newStatus: string = args.join(' ');
                // Update the status and let the user know that it was done
                (<HTMLSpanElement> document.querySelector('#status')).innerHTML = newStatus;
                _StdOut.putText(`Status updated to ${newStatus}`);
            } else {
                // Missing the argument for the function
                _StdOut.putText('Usage: status <string>  Please supply a string.')
            }
        }

        public shellTestBSOD(args: string[]) {
            // Tell the kernel to trap the error
            _Kernel.krnTrapError('Test BSOD');
        }

        public shellLoad(args: string[]) {
            // Get the input area
            let progInput: HTMLTextAreaElement = document.querySelector('#taProgramInput');

            // We want to work with the program without any whitespace and only deal with the
            // characters within the box.
            let program: string = progInput.value.replace(/\s/g, '');

            if (program.length === 0) {
                _Kernel.krnTrace('Invalid program. Empty program input.');
                _StdOut.putText('Invalid program. The program input is empty.');
                return;
            }

            // We want to make sure all digits are either 0-9 or A-F (case insensitive)
            // Great website for writing and testing regular expressions: https://regex101.com/
            let hexRegex: RegExp = /^[0-9A-F]*$/i

            // Test the hex regular expression on the program
            if (hexRegex.test(program)) {
                // We need to make sure that we have complete bytes, so the number of characters in the program
                // must be even because 2 hex digits = 1 byte of data for memory
                if (program.length % 2 !== 0) {
                    _Kernel.krnTrace('Invalid program. Odd number of characters.');
                    _StdOut.putText('Invalid program. Must have an even number of characters.');
                    return;
                } else if (program.length > 512) {
                    _Kernel.krnTrace('Invalid program. Program larger than 256 bytes.');
                    _StdOut.putText('Invalid program. Must be no longer than 256 bytes.');
                    return;
                }
                
                // Format the input text box for cleanliness by inserting a space between
                // every 2 characters
                for (let i: number = program.length - 2; i >= 2; i -= 2) {
                    program = program.slice(0, i) + ' ' + program.slice(i);
                }
                // Update the value of the input box
                progInput.value = program.toUpperCase();

                let progStrArr: string[] = progInput.value.split(' ');
                let progArr: number[] = [];
                for (let byte: number = 0; byte < progStrArr.length; byte++) {
                    progArr[byte] = parseInt(progStrArr[byte], 16);
                }

                // 8 is default priority value
                let priority: number = 8;
                if (args.length > 0) {
                    priority = parseInt(args[0]);
                }

                if (isNaN(priority) || priority < 0) {
                    // Make sure we have a valid input
                    _StdOut.putText('Invalid priority. Priority must be a integer value greater than or equal to 0.')
                } else {
                    // Call the kernel process to create a process
                    _Kernel.krnCreateProcess(progArr, priority);
                }
            } else {
                // Invalid program from bad characters
                _Kernel.krnTrace('Invalid program. Invalid characters present.');
                _StdOut.putText('Invalid program. Only hex digits (0-9, A-F) and whitespace allowed.');
            }
        }

        public shellRun(args: string[]) {
            if (args.length > 0) {
                // Get the integer process id that was requested
                let requestedID: number = parseInt(args[0]);

                // Process IDs start at 0 and go up to the current id (exclusive)
                if (Number.isNaN(requestedID) || requestedID < 0 || requestedID >= ProcessControlBlock.CurrentPID) {
                    _Kernel.krnTrace(`Run request failed. Invalid PID: ${requestedID}`)
                    _StdOut.putText(`Failed to run process. Invalid PID: ${requestedID}`);
                    return;
                }

                // We have a valid PID, so we can find the element safely in the history array
                let newPCB: ProcessControlBlock = _PCBHistory.find((pcb: ProcessControlBlock) => pcb.pid === requestedID);
                switch (newPCB.status) {
                // The process is loaded but has not been called to run
                case 'Resident':
                    _PCBReadyQueue.enqueue(newPCB);
                    newPCB.status = 'Ready';
                    newPCB.updateTableEntry();

                    _Kernel.krnTrace(`Started execution of process ${requestedID}.`);
                    _StdOut.putText(`Started execution of process ${requestedID}.`);
                    break;
                // The process is currently running
                case 'Running':
                case 'Ready':
                    _StdOut.putText(`Process ${requestedID} is already running.`);
                    break;
                // The process has already executed
                case 'Terminated':
                    _StdOut.putText(`Process ${requestedID} is terminated.`);
                    break;
                }
            } else {
                // Missing the argument for the function
                _StdOut.putText('Usage: run <pid>  Please supply a prcess id.');
            }
        }
        
        public shellRunAll(args: string[]) {
            // Get all the resident processes so we can add them to the ready queue
            let residentProcesses: ProcessControlBlock[] = _PCBHistory.filter((pcb) => pcb.status === 'Resident');
            for (const resident of residentProcesses) {
                _OsShell.shellRun([resident.pid.toString()]);
                _StdOut.advanceLine();
            }
        }

        public shellClearMem(args: string[]) {
            _Kernel.krnClearMemory();
        }
        
        public shellPs(args: string[]) {
            // Iterate through all made PCBs and display their PID and status
            for (const process of _PCBHistory) {
                _StdOut.putText(`PID: ${process.pid}; Status: ${process.status}`);
                _StdOut.advanceLine();
            }
        }

        public shellKill(args: string[]) {
            if (args.length > 0) {
                // Get the integer process id that was requested
                let requestedID: number = parseInt(args[0]);

                // Process IDs start at 0 and go up to the current id (exclusive)
                if (Number.isNaN(requestedID) || requestedID < 0 || requestedID >= ProcessControlBlock.CurrentPID) {
                    _Kernel.krnTrace(`Kill request failed. Invalid PID: ${requestedID}`)
                    _StdOut.putText(`Failed to kill process. Invalid PID: ${requestedID}`);
                    return;
                }

                // We have a valid PID, so we can find the element safely in the history array
                let killPCB: ProcessControlBlock = _PCBHistory.find((pcb: ProcessControlBlock) => pcb.pid === requestedID);
                switch (killPCB.status) {
                // The process is loaded but has not been called to run
                case 'Resident':
                    _Kernel.krnTrace(`Process ${requestedID} is not running.`);
                    break;
                // The process is currently running
                case 'Running':
                case 'Ready':
                    _Kernel.krnTrace(`Requesting kill process ${killPCB.pid}`);
                    _Kernel.krnTerminateProcess(killPCB, 0, '', false);
                    break;
                // The process has already executed
                case 'Terminated':
                    _StdOut.putText(`Process ${requestedID} is already terminated.`);
                    break;
                }
            } else {
                // Missing the argument for the function
                _StdOut.putText('Usage: kill <pid>  Please supply a prcess id.');
            }
        }

        public shellKillAll(args: string[]) {
            // Get all the running processes so we can kill them
            let runningProcesses: ProcessControlBlock[] = _PCBHistory.filter((pcb) => pcb.status === 'Running' || pcb.status === 'Ready');
            if (runningProcesses.length === 0) {
                _StdOut.putText('There are no running programs.');
            } else {
                for (const resident of runningProcesses) {
                    _OsShell.shellKill([resident.pid.toString()]);
                }
            }
        }

        public shellQuantum(args: string[]) {
            if (args.length > 0) {
                // Convert the input to an integer. Floating point values are taken care of
                let newQuantum: number = parseInt(args[0]);
                // Check to make sure we have a valid quantum
                if (newQuantum > 0) {
                    // Set the quantum and log it
                    _Scheduler.setQuantum(newQuantum);
                    _StdOut.putText(`Quantum set to ${newQuantum}`);
                    _Kernel.krnTrace(`Quantum set to ${newQuantum}`);
                } else {
                    // Print out an error message for an invalid quantum value
                    _StdOut.putText('Invalid quantum value. Quantum must be positive.');
                }
            } else {
                // Print out an error message for a missing quantum value
                _StdOut.putText('Usage: quantum <int>  Please supply a quantum value.');
            }
        }

        public shellFormat(args: string[]) {
            // Assume low level format
            let quick: boolean = false;

            // The flag changes it to want to do a quick format
            if (args.length > 0 && args[0] === '-quick') {
                quick = true;
            }

            // Call the kernel to format the disk
            _Kernel.krnFormatDisk(quick);
        }

        public shellCreate(args: string[]) {
            if (args.length > 0) {
                if (args[0].charAt(0) === '~') {
                    // ~ will be used for swap files, so reserve the character
                    _StdOut.putText('Invalid file name. File names may not start with \'~\'.');
                } else if (args[0].length > MAX_FILE_NAME_LENGTH) {
                    _StdOut.putText(`Invalid file name. File names cannot be longer than ${MAX_FILE_NAME_LENGTH} characters.`);
                } else {
                    // Call the kernel to create the file of the given name
                    _Kernel.krnCreateFile(args[0]);
                }
            } else {
                _StdOut.putText('Usage: create <filename>  Please supply a file name.');
            }
        }

        public shellWriteFile(args: string[]) {
            if (args.length === 0) {
                _StdOut.putText('Usage: write <filename> "<contents>"  Please supply the name of the file and the contents to write.');
            } else if (args.length === 1) {
                _StdOut.putText('Usage: write <filename> "<contents>"  Please supply the contents to write.');
            } else {
                // Remove the file name from the arguments array
                let fileName: string = args.shift();
                // Generate the contents string
                let contents: string = args.join(' ');

                if (contents.charAt(0) !== '"' || contents.charAt(contents.length - 1) !== '"') {
                    _StdOut.putText('Usage: write <filename> "<contents>"  Please surround the contents with quotation marks.');
                } else {
                    if (args[0].charAt(0) === '~') {
                        // Prevent the user from touching the swap files
                        _StdOut.putText('Cannot write to a swap file.');
                    } else {
                        // Remove the quotation marks from the contents string
                        contents = contents.substring(1, contents.length - 1);
                        // Call the kernel to write the contents to the file
                        _Kernel.krnWriteFile(fileName, contents);
                    }
                }
            }
        }

        public shellListFiles(args: string[]) {
            // Include hidden files if the flag is given
            if (args.length > 0 && args[0] === '-a') {
                _Kernel.krnListFiles(true);
            } else {
                _Kernel.krnListFiles(false);
            }
        }

        public shellReadFile(args: string[]) {
            if (args.length > 0) {
                if (args[0].charAt(0) === '~') {
                    // Swap files are inaccessible
                    _StdOut.putText('Cannot read from a swap file.');
                } else {
                    // Call the kernel routine to read the file
                    _Kernel.krnReadFile(args[0]);
                }
            } else {
                _StdOut.putText('Usage: read <filename>  Please provide the name of the file.');
            }
        }

        public shellDeleteFile(args: string[]) {
            if (args.length > 0) {
                if (args[0].charAt(0) === '~') {
                    // Swap files cannot be deleted by the user
                    _StdOut.putText('Cannot delete a swap file.');
                } else {
                    _Kernel.krnDeleteFile(args[0]);
                }
            } else {
                _StdOut.putText('Usage: delete <filename>  Please provide the name of the file.');
            }
        }

        public shellRenameFile(args: string[]) {
            // Check to make sure we have the right number of arguments
            if (args.length === 0) {
                _StdOut.putText('Usage: rename <curFileName> <newFileName>  Please provide the file to rename and its new name.');
            } else if (args.length === 1) {
                _StdOut.putText('Usage: rename <curFileName> <newFileName>  Please provide a new name for the file.');
            } else {
                if (args[0].charAt(0) === '~' || args[1].charAt(0) === '~') {
                    // ~ will be used for swap files, so reserve the character
                    _StdOut.putText('Invalid file name. File names may not start with \'~\'.');
                } else if (args[0].length > MAX_FILE_NAME_LENGTH || args[1].length > MAX_FILE_NAME_LENGTH) {
                    _StdOut.putText(`Invalid file name. File names cannot be longer than ${MAX_FILE_NAME_LENGTH} characters.`);
                } else {
                    // Call the kernel routine to rename the file
                    _Kernel.krnRenameFile(args[0], args[1]);
                }
            }
        }

        public shellCopyFile(args: string[]) {
            // Check to make sure we have the right number of arguments
            if (args.length === 0) {
                _StdOut.putText('Usage: copy <curFileName> <newFileName>  Please provide the file to copy and the name of the destination file.');
            } else if (args.length === 1) {
                _StdOut.putText('Usage: copy <curFileName> <newFileName>  Please provide the name of the destination file.');
            } else {
                if (args[0] === args[1]) {
                    // Make sure there are 2 unique names
                    _StdOut.putText('Invalid file name. Must provide 2 unique file names');
                } else if (args[0].charAt(0) === '~' || args[1].charAt(0) === '~') {
                    // ~ will be used for swap files, so reserve the character
                    _StdOut.putText('Invalid file name. File names may not start with \'~\'.');
                } else if (args[0].length > MAX_FILE_NAME_LENGTH || args[1].length > MAX_FILE_NAME_LENGTH) {
                    // The directory block has 60 bytes, but needs a byte (00) for the end of the file name, so 59 characters is max
                    _StdOut.putText(`Invalid file name. File names cannot be longer than ${MAX_FILE_NAME_LENGTH} characters.`);
                } else {
                    // Call the kernel routine to copy the file
                    _Kernel.krnCopyFile(args[0], args[1]);
                }
            }
        }

        public shellGetSchedule(args: string[]) {
            let algo: SchedulingAlgo = _Scheduler.getCurAlgo();
            
            _StdOut.putText("The scheduler is using ");
            switch (algo) {
                case SchedulingAlgo.ROUND_ROBIN:
                    _StdOut.putText("round robin scheduling.");
                    break;
                case SchedulingAlgo.FCFS:
                    _StdOut.putText("first come, first serve scheduling.");
                    break;
                case SchedulingAlgo.PRIORITY:
                    _StdOut.putText("priority scheduling.");
                    break;
            }        
        }

        public shellSetSchedule(args: string[]) {
            if (args.length > 0) {
                switch (args[0]) {
                    case 'rr':
                        _Scheduler.setCurAlgo(SchedulingAlgo.ROUND_ROBIN);
                        _StdOut.putText('Scheduling algorithm updated to round robin.');
                        break;
                    case 'fcfs':
                        _Scheduler.setCurAlgo(SchedulingAlgo.FCFS);
                        _StdOut.putText('Scheduling algorithm updated to first come, first serve.');
                        break;
                    case 'priority':
                        _Scheduler.setCurAlgo(SchedulingAlgo.PRIORITY);
                        _StdOut.putText('Scheduling algorithm updated to priority.');
                        break;
                    default:
                        _StdOut.putText("Invalid scheduling algorithm. Must be rr, fcfs, or priority.");
                        break;
                }
            } else {
                _StdOut.putText('Usage: setschedule <rr|fcfs|priority>  Please provide the scheduling algorithm to use.');
            }
        }
    }
}
