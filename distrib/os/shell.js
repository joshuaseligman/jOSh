/* ------------
   Shell.ts

   The OS Shell - The "command line interface" (CLI) for the console.

    Note: While fun and learning are the primary goals of all enrichment center activities,
          serious injuries may occur when trying to write your own Operating System.
   ------------ */
// TODO: Write a base class / prototype for system services and let Shell inherit from it.
var TSOS;
(function (TSOS) {
    class Shell {
        constructor() {
            // Properties
            this.promptStr = ">";
            this.commandList = [];
            this.curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
            this.apologies = "[sorry]";
        }
        init() {
            var sc;
            //
            // Load the command list.
            // ver
            sc = new TSOS.ShellCommand(this.shellVer, "ver", "- Displays the current version data.");
            this.commandList[this.commandList.length] = sc;
            // help
            sc = new TSOS.ShellCommand(this.shellHelp, "help", "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;
            // shutdown
            sc = new TSOS.ShellCommand(this.shellShutdown, "shutdown", "- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
            this.commandList[this.commandList.length] = sc;
            // cls
            sc = new TSOS.ShellCommand(this.shellCls, "cls", "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;
            // man <topic>
            sc = new TSOS.ShellCommand(this.shellMan, "man", "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;
            // trace <on | off>
            sc = new TSOS.ShellCommand(this.shellTrace, "trace", "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;
            // rot13 <string>
            sc = new TSOS.ShellCommand(this.shellRot13, "rot13", "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;
            // prompt <string>
            sc = new TSOS.ShellCommand(this.shellPrompt, "prompt", "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;
            // date
            sc = new TSOS.ShellCommand(this.shellDate, "date", "- Displays the current date and time.");
            this.commandList[this.commandList.length] = sc;
            // whereami
            sc = new TSOS.ShellCommand(this.shellWhereAmI, "whereami", "- Displays your current location.");
            this.commandList[this.commandList.length] = sc;
            // seeya
            sc = new TSOS.ShellCommand(this.shellSeeYa, "seeya", "- Watch a baseball get crushed. No questions asked.");
            this.commandList[this.commandList.length] = sc;
            // name
            sc = new TSOS.ShellCommand(this.shellName, "name", "- Learn a name. You'll be happy you did.");
            this.commandList[this.commandList.length] = sc;
            // status
            sc = new TSOS.ShellCommand(this.shellStatus, "status", "<string> - Updates the status in the status bar.");
            this.commandList[this.commandList.length] = sc;
            // testbsod
            sc = new TSOS.ShellCommand(this.shellTestBSOD, "testbsod", "- Tests the blue screen of death when the kernel traps an OS error.");
            this.commandList[this.commandList.length] = sc;
            // load
            sc = new TSOS.ShellCommand(this.shellLoad, "load", "- Loads the user program into memory.");
            this.commandList[this.commandList.length] = sc;
            // ps  - list the running processes and their IDs
            // kill <id> - kills the specified process id.
            // Display the initial prompt.
            this.putPrompt();
        }
        putPrompt() {
            _StdOut.putText(this.promptStr);
        }
        handleInput(buffer) {
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
            var index = 0;
            var found = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                }
                else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args); // Note that args is always supplied, though it might be empty.
            }
            else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + TSOS.Utils.rot13(cmd) + "]") >= 0) { // Check for curses.
                    this.execute(this.shellCurse);
                }
                else if (this.apologies.indexOf("[" + cmd + "]") >= 0) { // Check for apologies.
                    this.execute(this.shellApology);
                }
                else { // It's just a bad command. {
                    this.execute(this.shellInvalidCommand);
                }
            }
        }
        // Note: args is an optional parameter, ergo the ? which allows TypeScript to understand that.
        execute(fn, args) {
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
        parseInput(buffer) {
            var retVal = new TSOS.UserCommand();
            // 1. Remove leading and trailing spaces.
            buffer = TSOS.Utils.trim(buffer);
            // Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");
            // Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift().toLowerCase(); // Yes, you can do that to an array in JavaScript. See the Queue class.
            // Remove any left-over spaces.
            cmd = TSOS.Utils.trim(cmd);
            // Record it in the return value.
            retVal.command = cmd;
            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = TSOS.Utils.trim(tempList[i]);
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
        shellInvalidCommand() {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Unbelievable. You, [subject name here],");
                _StdOut.advanceLine();
                _StdOut.putText("must be the pride of [subject hometown here].");
            }
            else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        }
        shellCurse() {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        }
        shellApology() {
            if (_SarcasticMode) {
                _StdOut.putText("I think we can put our differences behind us.");
                _StdOut.advanceLine();
                _StdOut.putText("For science . . . You monster.");
                _SarcasticMode = false;
            }
            else {
                _StdOut.putText("For what?");
            }
        }
        // Although args is unused in some of these functions, it is always provided in the 
        // actual parameter list when this function is called, so I feel like we need it.
        shellVer(args) {
            _StdOut.putText(APP_NAME + " version " + APP_VERSION);
        }
        shellHelp(args) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        }
        shellShutdown(args) {
            _StdOut.putText("Shutting down...");
            // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed. If possible. Not a high priority. (Damn OCD!)
        }
        shellCls(args) {
            _StdOut.clearScreen();
            _StdOut.resetXY();
        }
        shellMan(args) {
            if (args.length > 0) {
                // Get the command that was requested by the argument for the man command
                let requestedCommand = _OsShell.commandList.find(cmd => cmd.command === args[0].toLowerCase());
                if (requestedCommand !== undefined) {
                    let hasArgument = requestedCommand.description.includes(' - ');
                    if (hasArgument) {
                        // Situation for commands with 1 argument
                        // Split the description to separate the needed argument with the actual description
                        let splitDescription = requestedCommand.description.split(' - ');
                        // Print out the actual description
                        _StdOut.putText(splitDescription[1]);
                        _StdOut.advanceLine();
                        // Print out the command with the argument requirement
                        _StdOut.putText(`Usage: ${requestedCommand.command} ${splitDescription[0]}`);
                    }
                    else {
                        // Commands with 0 arguments
                        // Get the description after the "- "
                        _StdOut.putText(requestedCommand.description.substring(2));
                        _StdOut.advanceLine();
                        // Add the usage for the user's reference
                        _StdOut.putText(`Usage: ${requestedCommand.command}`);
                    }
                }
                else {
                    // The command in the man argument is not valid
                    _StdOut.putText("No manual entry for " + args[0].toLowerCase() + ".");
                }
            }
            else {
                // Failed to provide a command to get the manual for
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
        }
        shellTrace(args) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting.toLowerCase()) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, doofus.");
                        }
                        else {
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
            }
            else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        }
        shellRot13(args) {
            if (args.length > 0) {
                let strInput = args.join(' ').toLowerCase();
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(strInput + " = '" + TSOS.Utils.rot13(strInput) + "'");
            }
            else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        }
        shellPrompt(args) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            }
            else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        }
        shellDate(args) {
            // Output the current date and time
            _StdOut.putText(`Current date: ${TSOS.Utils.getDate()}`);
        }
        shellWhereAmI(args) {
            // Prints the user's location
            _StdOut.putText('You are currently trapped in a simulation called the Matrix. Take the red pill to discover the truth of your current location.');
        }
        shellSeeYa(args) {
            _StdOut.putText("SEE YA!!!");
            // The area with the gif overlaps the rest of the page, so we need to make the content visible
            let seeYaArea = document.querySelector('#seeYaArea');
            seeYaArea.style.display = 'flex';
            // Remove the focus so no input during this time
            _Canvas.blur();
            // Wait 10 seconds (the length of the gif) to make the webpage back to how it was
            setTimeout(() => {
                seeYaArea.style.display = 'none';
                _Canvas.focus();
            }, 10000);
        }
        shellName(args) {
            // The name
            _StdOut.putText('The name\'s Bond... James Bond.');
        }
        shellStatus(args) {
            if (args.length > 0) {
                let newStatus = args.join(' ');
                // Update the status and let the user know that it was done
                document.querySelector('#status').innerHTML = newStatus;
                _StdOut.putText(`Status updated to ${newStatus}`);
            }
            else {
                // Missing the argument for the function
                _StdOut.putText('Usage: status <string>  Please supply a string.');
            }
        }
        shellTestBSOD(args) {
            // Tell the kernel to trap the error
            _Kernel.krnTrapError('Test BSOD');
        }
        shellLoad(args) {
            // Get the input area
            let progInput = document.querySelector('#taProgramInput');
            // We want to work with the program without any whitespace and only deal with the
            // characters within the box.
            let program = progInput.value.replace(/\s/g, '');
            if (program.length === 0) {
                _Kernel.krnTrace('Invalid program. Empty program input.');
                _StdOut.putText('Invalid program. The program input is empty.');
                return;
            }
            // We want to make sure all digits are either 0-9 or A-F (case insensitive)
            // Great website for writing and testing regular expressions: https://regex101.com/
            let hexRegex = /^[0-9A-F]*$/i;
            // Test the hex regular expression on the program
            if (hexRegex.test(program)) {
                // We need to make sure that we have complete bytes, so the number of characters in the program
                // must be even because 2 hex digits = 1 byte of data for memory
                if (program.length % 2 !== 0) {
                    _Kernel.krnTrace('Invalid program. Odd number of characters.');
                    _StdOut.putText('Invalid program. Must have an even number of characters.');
                    return;
                }
                else if (program.length > 512) {
                    _Kernel.krnTrace('Invalid program. Program larger than 256 bytes.');
                    _StdOut.putText('Invalid program. Must be no longer than 256 bytes.');
                    return;
                }
                // Format the input text box for cleanliness by inserting a space between
                // every 2 characters
                for (let i = program.length - 2; i >= 2; i -= 2) {
                    program = program.slice(0, i) + ' ' + program.slice(i);
                }
                // Update the value of the input box
                progInput.value = program.toUpperCase();
                console.log(progInput.value);
                let progStrArr = progInput.value.split(' ');
                let progArr = [];
                for (let byte = 0; byte < progStrArr.length; byte++) {
                    progArr.push(parseInt(progStrArr[byte], 16));
                }
                let section = _MemoryManager.allocateProgram(progArr);
                if (section == -1) {
                    _Kernel.krnTrace('No space for the program.');
                    _StdOut.putText('Failed to load program. No available space.');
                }
                else {
                    let newPCB = new TSOS.ProcessControlBlock(0);
                    _PCBHistory.push(newPCB);
                    // Let the user know the program is valid
                    _Kernel.krnTrace(`Created PID ${newPCB.pid}`);
                    _StdOut.putText(`Process ID: ${newPCB.pid}`);
                }
            }
            else {
                // Invalid program from bad characters
                _Kernel.krnTrace('Invalid program. Invalid characters present.');
                _StdOut.putText('Invalid program. Only hex digits (0-9, A-F) and whitespace allowed.');
            }
        }
    }
    TSOS.Shell = Shell;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=shell.js.map