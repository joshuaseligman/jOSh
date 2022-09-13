var TSOS;
(function (TSOS) {
    class ProcessControlBlock {
        constructor(segment) {
            // Set the process id te the current id and increment the current id for future use
            this.pid = ProcessControlBlock.currentPID;
            ProcessControlBlock.currentPID++;
            // All CPU variables start at 0 because that is what is 
            this.programCounter = 0;
            this.instructionRegister = 0;
            this.acc = 0;
            this.xReg = 0;
            this.yReg = 0;
            this.zFlag = 0;
            // Set the segment to wherever the program was stored
            this.segment = segment;
            // Set the status to '' for now
            this.status = '';
        }
    }
    // Public variable to keep track of the allocated ids
    ProcessControlBlock.currentPID = 0;
    TSOS.ProcessControlBlock = ProcessControlBlock;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=processControlBlock.js.map