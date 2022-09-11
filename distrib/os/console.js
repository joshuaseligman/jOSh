/* ------------
     Console.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */
var TSOS;
(function (TSOS) {
    class Console {
        constructor(currentFont = _DefaultFontFamily, currentFontSize = _DefaultFontSize, currentXPosition = 0, currentYPosition = _DefaultFontSize, buffer = "") {
            this.currentFont = currentFont;
            this.currentFontSize = currentFontSize;
            this.currentXPosition = currentXPosition;
            this.currentYPosition = currentYPosition;
            this.buffer = buffer;
            // Initialize variables needed for the multiple completion options
            // Completions is null because we don't want it to point to anything and use null to check to see if
            // and completions exist. Next, the completion index becomes -1 and will increment when needed.
            // Last width keeps track of the width of the completed part of the command and is initially 0 to prevent
            // anything from getting cleared. Lastly, the original buffer is the buffer when the completion is triggered
            // and starts as an empty string for initialization purposes.
            this.completions = null;
            this.completionIndex = -1;
            this.lastWidth = 0;
            this.originalBuffer = '';
            // Command history is an empty array that will be added to throughout the time running the os and the index starts
            // at -1 and will be incremented when needed.
            this.commandHistory = [];
            this.historyIndex = -1;
            // Stack that will be used to save the x position at the end of the line when word wrapping
            this.commandXStack = new TSOS.Stack();
        }
        init() {
            this.clearScreen();
            this.resetXY();
        }
        clearScreen() {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        }
        resetXY() {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        }
        handleInput() {
            while (_KernelInputQueue.getSize() > 0) {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) { // the Enter key
                    this.resetTabCompletion();
                    this.historyIndex = -1;
                    // Clear the stack in case it was used
                    this.commandXStack.clear();
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.buffer);
                    // Only add to history if there is content
                    if (this.buffer !== '') {
                        // Get rid of all \n occurrences to only keep the text
                        this.buffer = this.buffer.replace(/\n/g, '');
                        // Add the command to the command history
                        this.commandHistory.unshift(this.buffer);
                    }
                    // The stack was probably used, with the output, so it should be cleared
                    this.commandXStack.clear();
                    // ... and reset our buffer.
                    this.buffer = "";
                }
                else if (chr === String.fromCharCode(8)) { // Backspace
                    this.resetTabCompletion();
                    this.historyIndex = -1;
                    // Call the function to handle the backspaces
                    this.handleBackspace();
                }
                else if (chr === String.fromCharCode(9)) { // tab
                    this.historyIndex = -1;
                    if (this.completions === null) {
                        if (this.buffer === '') {
                            return;
                        }
                        // Get all the commands that the user has potentially started to type
                        let possibleCompletions = _OsShell.commandList.filter((cmd) => {
                            return cmd.command.startsWith(this.buffer);
                        });
                        // Logic for the autocomplete
                        if (possibleCompletions.length === 1) {
                            // Get the string that the user is still yet to type
                            let remainingCmd = possibleCompletions[0].command.substring(this.buffer.length);
                            // Type out the rest of the command and put it in the buffer
                            this.putText(remainingCmd);
                            this.buffer += remainingCmd;
                        }
                        else if (possibleCompletions.length > 1) {
                            // First tab for multiple commands
                            this.completions = possibleCompletions;
                            this.originalBuffer = this.buffer;
                            // Save x and y for future use
                            let origX = this.currentXPosition;
                            let origY = this.currentYPosition;
                            // Go to the next line to write out the commands
                            // Fix the origY variable if needed to match where the actual command is
                            let hadToScroll = this.advanceLine();
                            if (hadToScroll) {
                                origY -= this.getLineHeight();
                            }
                            // Write out each possible command
                            for (let i = 0; i < this.completions.length; i++) {
                                // Write the command and leave some space if needed
                                this.putText(this.completions[i].command);
                                if (i !== this.completions.length - 1) {
                                    this.putText('  ');
                                }
                            }
                            // Reset the position to where we were
                            this.currentXPosition = origX;
                            this.currentYPosition = origY;
                        }
                    }
                    else {
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
                        let remainingCmd = this.completions[this.completionIndex].command.substring(this.originalBuffer.length);
                        this.lastWidth = _DrawingContext.measureText(this.currentFont, this.currentFontSize, remainingCmd);
                        // Type out the rest of the command and put it in the buffer
                        this.putText(remainingCmd);
                        this.buffer = this.completions[this.completionIndex].command;
                    }
                }
                else if (chr === 'up' || chr === 'down') {
                    this.resetTabCompletion();
                    // Go through history if possible
                    if ((this.commandHistory.length > 0) &&
                        (chr === 'up' && this.historyIndex < this.commandHistory.length - 1) ||
                        (chr === 'down' && this.historyIndex >= 0)) {
                        // Backspace to clear whatever text is there. This will also take care of word wrap
                        while (this.handleBackspace())
                            ;
                        // Go back if the up arrow and move ahead if down arrow
                        this.historyIndex += (chr === 'up') ? 1 : -1;
                        // Edge case for the logic to make sure we stay within the confines of the command history array
                        // while also providing a clear buffer when returning from the history array
                        if (chr === 'down' && this.historyIndex === -1) {
                            this.buffer = '';
                            return;
                        }
                        // Update the screen and buffer
                        this.putText(this.commandHistory[this.historyIndex], true);
                    }
                }
                else {
                    this.resetTabCompletion();
                    this.historyIndex = -1;
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.buffer += chr;
                }
                // TODO: Add a case for Ctrl-C that would allow the user to break the current program.
            }
        }
        putText(text, addToBuffer = false) {
            /*  My first inclination here was to write two functions: putChar() and putString().
                Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
                between the two. (Although TypeScript would. But we're compiling to JavaScipt anyway.)
                So rather than be like PHP and write two (or more) functions that
                do the same thing, thereby encouraging confusion and decreasing readability, I
                decided to write one function and use the term "text" to connote string or char.
            */
            if (text !== "") {
                // To implement word wrap, we need to check each character individually to see if they
                // can be printed on the current line. if not, we need to advance the line
                for (let i = 0; i < text.length; i++) {
                    // Get the width of the character
                    let charOffset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text.charAt(i));
                    // Go to the next line if needed
                    if (this.currentXPosition + charOffset > _Canvas.width) {
                        // Save where we are in case of a backspace
                        this.commandXStack.push(this.currentXPosition);
                        // \n is going to be used to represent where the word wraps
                        this.buffer += '\n';
                        this.advanceLine();
                        // The x position gets fixed in this.advanceLine(), so no need to do it here
                    }
                    // Draw the character at the current X and Y coordinates.
                    _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text.charAt(i));
                    // Move the current X position.
                    this.currentXPosition = this.currentXPosition + charOffset;
                    // If the buffer is being dynamically worked on as the text is printed, we want to add the character to the buffer here
                    if (addToBuffer) {
                        this.buffer += text.charAt(i);
                    }
                }
            }
        }
        advanceLine() {
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
            }
            else {
                // Only increment the yPosition if we have room to do so
                this.currentYPosition += this.getLineHeight();
                // Return false because we did not scroll
                return false;
            }
        }
        resetTabCompletion() {
            // Reset everything only if there is something to reset
            if (this.completions !== null) {
                // Reset the variables
                this.completions = null;
                this.completionIndex = -1;
                this.lastWidth = 0;
                this.originalBuffer = '';
                // Clear the area where we drew the options
                _DrawingContext.clearRect(0, this.currentYPosition + this.getLineHeight() - _DefaultFontSize, _Canvas.width, this.getLineHeight());
            }
        }
        getLineHeight() {
            /*
            * Font size measures from the baseline to the highest point in the font.
            * Font descent measures from the baseline to the lowest point in the font.
            * Font height margin is extra spacing between the lines.
            */
            return _DefaultFontSize +
                _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                _FontHeightMargin;
        }
        bsod() {
            // Draw the bsod
            _DrawingContext.fillStyle = 'blue';
            _DrawingContext.fillRect(0, 0, _Canvas.width, _Canvas.height);
            // This is the only thing that will be displayed, so we can increase the font size
            this.currentFontSize = 18;
            // Create the message and get some of the important info
            let msg = 'A fatal error occurred... shutting down.';
            let msgWidth = _DrawingContext.measureText(this.currentFont, this.currentFontSize, msg);
            // We want to center the text being displayed
            this.currentXPosition = (_Canvas.width - msgWidth) / 2;
            this.currentYPosition = _Canvas.height / 2;
            // Draw the text in white
            _DrawingContext.strokeStyle = 'white';
            this.putText(msg);
        }
        handleBackspace() {
            // Only do something if there is text out in the command
            if (this.buffer.length > 0) {
                // get the width of the character to delete
                let charWidth = _DrawingContext.measureText(this.currentFont, this.currentFontSize, this.buffer.charAt(this.buffer.length - 1));
                // Draw a clear rect over the character and a little more to make sure it is all clear
                // We start at the y position - the font size because we only need to measure from the baseline-up and do not
                // want to cut off from the previous line. But the height of the box can be tall because noting is below and we
                // need to clear the entire letter.
                _DrawingContext.clearRect(this.currentXPosition - charWidth, this.currentYPosition - this.currentFontSize - _FontHeightMargin, charWidth, this.getLineHeight() + _FontHeightMargin);
                // Remove it from the x position and the buffer
                this.currentXPosition -= charWidth;
                this.buffer = this.buffer.substring(0, this.buffer.length - 1);
                // The \n character in the buffer is being used to represent where the word wraps
                if (this.buffer.charAt(this.buffer.length - 1) === '\n') {
                    // Get the x position of the end of the previous line
                    this.currentXPosition = this.commandXStack.pop();
                    // Move the y position back up a line
                    this.currentYPosition -= this.getLineHeight();
                    // Remove the \n from the buffer
                    this.buffer = this.buffer.substring(0, this.buffer.length - 1);
                }
                // Return true because there was a character to backspace
                return true;
            }
            else {
                // Return false because the buffer is empty
                return false;
            }
        }
    }
    TSOS.Console = Console;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=console.js.map