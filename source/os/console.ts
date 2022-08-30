/* ------------
     Console.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */

module TSOS {

    export class Console {

        // Initialize variables needed for the multiple completion options
        private completions: ShellCommand[] = null;
        private completionIndex: number = -1;
        private lastWidth: number = 0;

        private commandHistory: string[] = [];
        private historyIndex = 0;

        constructor(public currentFont = _DefaultFontFamily,
                    public currentFontSize = _DefaultFontSize,
                    public currentXPosition = 0,
                    public currentYPosition = _DefaultFontSize,
                    public buffer = "") {
        }

        public init(): void {
            this.clearScreen();
            this.resetXY();
        }

        public clearScreen(): void {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        }

        public resetXY(): void {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        }

        public handleInput(): void {
            while (_KernelInputQueue.getSize() > 0) {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) { // the Enter key
                    this.resetTabCompletion();
                    this.historyIndex = 0;

                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.buffer);

                    // Only add to history if there is content
                    if (this.buffer !== '') {
                        // Add the command to the command history
                        this.commandHistory.unshift(this.buffer);
                    }

                    // ... and reset our buffer.
                    this.buffer = "";

                } else if (chr === String.fromCharCode(8)) { // Backspace
                    this.resetTabCompletion();
                    this.historyIndex = 0;

                    // Only do something if there is text out in the command
                    if (this.buffer.length > 0) {

                        // get the width of the character to delete
                        let charWidth: number = _DrawingContext.measureText(this.currentFont, this.currentFontSize, this.buffer.charAt(this.buffer.length - 1));

                        // Draw a clear rect over the character and a little more to make sure it is all clear
                        // We start at the y position - the font size because we only need to measure from the baseline-up and do not
                        // want to cut off from the previous line. But the height of the box can be tall because noting is below and we
                        // need to clear the entire letter.
                        _DrawingContext.clearRect(this.currentXPosition - charWidth, this.currentYPosition - this.currentFontSize, charWidth, this.getLineHeight());

                        // Remove it from the x position and the buffer
                        this.currentXPosition -= charWidth;
                        this.buffer = this.buffer.substring(0, this.buffer.length - 1);

                    }
                } else if (chr === String.fromCharCode(9)) {
                    this.historyIndex = 0;

                    if (this.completions === null) {
                        if (this.buffer === '') { return; }
                        // Get all the commands that the user has potentially started to type
                        let possibleCompletions: ShellCommand[] = _OsShell.commandList.filter((cmd: ShellCommand): boolean => {
                            return cmd.command.startsWith(this.buffer);
                        });
                        
                        // Logic for the autocomplete
                        if (possibleCompletions.length === 1) {
                            // Get the string that the user is still yet to type
                            let remainingCmd: string = possibleCompletions[0].command.substring(this.buffer.length)
    
                            // Type out the rest of the command and put it in the buffer
                            this.putText(remainingCmd);
                            this.buffer += remainingCmd;
                        } else if (possibleCompletions.length > 1) {
                            // First tab for multiple commands
                            this.completions = possibleCompletions;
                            
                            // Save x and y for future use
                            let origX: number = this.currentXPosition;
                            let origY: number = this.currentYPosition;

                            // Go to the next line to write out the commands
                            // Fix the origY variable if needed to match where the actual command is
                            let hadToScroll: boolean = this.advanceLine();
                            if (hadToScroll) {
                                origY -= this.getLineHeight();
                            }

                            // Write out each possible command
                            for (let i: number = 0; i < this.completions.length; i++) {
                                // Write the command and leave some space if needed
                                this.putText(this.completions[i].command)
                                if (i !== this.completions.length - 1) {
                                    this.putText('  ');
                                }
                            }

                            // Reset the position to where we were
                            this.currentXPosition = origX;
                            this.currentYPosition = origY;
                        }
                    } else {
                        // Draw a clear rect over the last filled part and a little more to make sure it is all clear
                        // We start at the y position - the font size because we only need to measure from the baseline-up and do not
                        // want to cut off from the previous line. But the height of the box can be tall because noting is below and we
                        // need to clear the entire letter.
                        _DrawingContext.clearRect(this.currentXPosition - this.lastWidth, this.currentYPosition - this.currentFontSize, this.lastWidth, this.getLineHeight());

                        // Increment the index that we are going to use
                        this.completionIndex++;
                        if (this.completionIndex >= this.completions.length) {
                            this.completionIndex = 0;
                        }

                        // Put the x cursor back where it was
                        this.currentXPosition -= this.lastWidth;

                        // Get the string that the user is still yet to type
                        let remainingCmd: string = this.completions[this.completionIndex].command.substring(this.buffer.length);
                        this.lastWidth = _DrawingContext.measureText(this.currentFont, this.currentFontSize, remainingCmd);

                        // Type out the rest of the command and put it in the buffer
                        this.putText(remainingCmd);
                        this.buffer = this.completions[this.completionIndex].command;
                    }
                } else if (chr === 'up' || chr === 'down') {
                    this.resetTabCompletion();

                    // Go through history if possible
                    if ((this.commandHistory.length > 0) &&
                        (chr === 'up' && this.historyIndex < this.commandHistory.length) ||
                        (chr === 'down' && this.historyIndex >= -1)) {
                        // Calculate the starting x position
                        let newX: number = this.currentXPosition - _DrawingContext.measureText(this.currentFont, this.currentFontSize, this.buffer);
                        // Clear the area from what was already there and set the new x position
                        _DrawingContext.clearRect(newX, this.currentYPosition - this.currentFontSize, _Canvas.width, this.getLineHeight());
                        this.currentXPosition = newX;

                        // Edge cases for the logic to make sure we stay within the confines of the command history array
                        if (chr === 'down' && this.historyIndex === this.commandHistory.length) {
                            this.historyIndex -= 2;
                        } else if (chr === 'down' && this.historyIndex === -1) {
                            this.buffer = '';
                            return;
                        } else if (chr === 'up' && this.historyIndex < 0) {
                            this.historyIndex = 0;
                        }

                        // Update the screen, buffer, and history index
                        this.putText(this.commandHistory[this.historyIndex]);
                        this.buffer = this.commandHistory[this.historyIndex];

                        // Go back if the up arrow and move ahead if down arrow
                        this.historyIndex += (chr === 'up') ? 1 : -1;
                    }
                } else {
                    this.resetTabCompletion();
                    this.historyIndex = 0;

                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.buffer += chr;
                }
                // TODO: Add a case for Ctrl-C that would allow the user to break the current program.
            }
        }

        public putText(text): void {
            /*  My first inclination here was to write two functions: putChar() and putString().
                Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
                between the two. (Although TypeScript would. But we're compiling to JavaScipt anyway.)
                So rather than be like PHP and write two (or more) functions that
                do the same thing, thereby encouraging confusion and decreasing readability, I
                decided to write one function and use the term "text" to connote string or char.
            */
            if (text !== "") {
                // Draw the text at the current X and Y coordinates.
                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                // Move the current X position.
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                this.currentXPosition = this.currentXPosition + offset;
            }
         }

        public advanceLine(): boolean {
            this.currentXPosition = 0;

            if (this.currentYPosition + this.getLineHeight() > _Canvas.height) {
                // Solution inspired by https://www.w3schools.com/tags/canvas_getimagedata.asp
                // Since this.getLineHeight() is the height of a line, we are able to grab starting at this.getLineHeight() (the top of the second line)
                // all the way down to the bottom of the canvas
                let imgData = _DrawingContext.getImageData(0, this.getLineHeight(), _Canvas.width, _Canvas.height - this.getLineHeight());

                // Clear the screen and paste the image at the top
                this.clearScreen();
                _DrawingContext.putImageData(imgData, 0, 0);

                // The current y position doesn't get changed because we moved the text up to make room for a new line
                // and the y position is currently at the lowest possible point for a complete line

                // Return true because we scrolled
                return true;
            } else {
                // Only increment the yPosition if we have room to do so
                this.currentYPosition += this.getLineHeight();

                // Return false because we did not scroll
                return false;
            }
        }

        public resetTabCompletion(): void {
            // Reset everything only if there is something to reset
            if (this.completions !== null) {
                // Reset the variables
                this.completions = null;
                this.completionIndex = -1;
                this.lastWidth = 0;
    
                // Clear the area where we drew the options
                _DrawingContext.clearRect(0, this.currentYPosition + this.getLineHeight() - _DefaultFontSize, _Canvas.width, this.getLineHeight());
            }
        }

        public getLineHeight(): number {
             /*
             * Font size measures from the baseline to the highest point in the font.
             * Font descent measures from the baseline to the lowest point in the font.
             * Font height margin is extra spacing between the lines.
             */
            return _DefaultFontSize + 
                   _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                   _FontHeightMargin;
        }
    }
 }
