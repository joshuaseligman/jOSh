var TSOS;
(function (TSOS) {
    class ProcessControlBlock {
        constructor(segment) {
            // Set the process id te the current id and increment the current id for future use
            this._pid = ProcessControlBlock.currentPID;
            ProcessControlBlock.currentPID++;
            // All CPU variables start at 0 because that is what is 
            this._programCounter = 0;
            this._instructionRegister = 0;
            this._acc = 0;
            this._xReg = 0;
            this._yReg = 0;
            this._zFlag = 0;
            // Set the segment to wherever the program was stored
            this._segment = segment;
            // Set the status to '' for now
            this._status = '';
        }
    }
    // Public variable to keep track of the allocated ids
    ProcessControlBlock.currentPID = 0;
    TSOS.ProcessControlBlock = ProcessControlBlock;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=processControlBlock.js.map