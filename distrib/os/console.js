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
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.buffer);
                    // ... and reset our buffer.
                    this.buffer = "";
                }
                else if (chr === String.fromCharCode(8)) { // Backspace
                    // Only do something if there is text out in the command
                    if (this.buffer.length > 0) {
                        // get the width of the character to delete
                        let charWidth = _DrawingContext.measureText(this.currentFont, this.currentFontSize, this.buffer.charAt(this.buffer.length - 1));
                        // Calculate the height to clear by
                        let yDelta = _DefaultFontSize +
                            _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                            _FontHeightMargin;
                        // Draw a clear rect over the character and a little more to make sure it is all clear
                        // We start at the y position - the font size because we only need to measure from the baseline-up and do not
                        // want to cut off from the previous line. But the height of the box can be tall because noting is below and we
                        // need to clear the entire letter.
                        _DrawingContext.clearRect(this.currentXPosition - charWidth, this.currentYPosition - this.currentFontSize, charWidth, yDelta);
                        // Remove it from the x position and the buffer
                        this.currentXPosition -= charWidth;
                        this.buffer = this.buffer.substring(0, this.buffer.length - 1);
                    }
                }
                else if (chr === String.fromCharCode(9)) {
                    // Get all the commands that the user has potentially started to type
                    let completions = _OsShell.commandList.filter((cmd) => {
                        return cmd.command.startsWith(this.buffer);
                    });
                    // Logic for the autocomplete
                    if (completions.length === 1) {
                        // Get the string that the user is still yet to type
                        let remainingCmd = completions[0].command.substring(this.buffer.length);
                        // Type out the rest of the command and put it in the buffer
                        _StdOut.putText(remainingCmd);
                        this.buffer += remainingCmd;
                    }
                    else if (completions.length > 1) {
                        // Add logic
                    }
                }
                else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.buffer += chr;
                }
                // TODO: Add a case for Ctrl-C that would allow the user to break the current program.
            }
        }
        putText(text) {
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
        advanceLine() {
            this.currentXPosition = 0;
            /*
             * Font size measures from the baseline to the highest point in the font.
             * Font descent measures from the baseline to the lowest point in the font.
             * Font height margin is extra spacing between the lines.
             */
            // yDelta represents the total height of the line because that is how much the y postiton
            // changes on each line advance
            let yDelta = _DefaultFontSize +
                _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                _FontHeightMargin;
            if (this.currentYPosition + yDelta > _Canvas.height) {
                // Solution inspired by https://www.w3schools.com/tags/canvas_getimagedata.asp
                // Since yDelta is the height of a line, we are able to grab starting at yDelta (the top of the second line)
                // all the way down to the bottom of the canvas
                let imgData = _DrawingContext.getImageData(0, yDelta, _Canvas.width, _Canvas.height - yDelta);
                // Clear the screen and paste the image at the top
                this.clearScreen();
                _DrawingContext.putImageData(imgData, 0, 0);
                // The current y position doesn't get changed because we moved the text up to make room for a new line
                // and the y position is currently at the lowest possible point for a complete line
            }
            else {
                // Only increment the yPosition if we have room to do so
                this.currentYPosition += yDelta;
            }
        }
    }
    TSOS.Console = Console;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=console.js.map