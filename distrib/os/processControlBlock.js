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
            this.status = 'Resident';
            // Output starts off as empty
            this.output = '';
        }
        // Function to update the information for the PCB based on the CPU status
        updateCpuInfo(pc, ir, acc, xReg, yReg, zFlag) {
            this.programCounter = pc;
            this.instructionRegister = ir;
            this.acc = acc;
            this.xReg = xReg;
            this.yReg = yReg;
            this.zFlag = zFlag;
        }
        // Function to update the table entry for the PCB
        updateTableEntry() {
            // Get the table row
            let tableEntry = document.querySelector(`#pid${this.pid}`);
            // Update each of the CPU fields
            tableEntry.cells[2].innerHTML = TSOS.Utils.getHexString(this.programCounter, 2, false);
            tableEntry.cells[3].innerHTML = TSOS.Utils.getHexString(this.instructionRegister, 2, false);
            tableEntry.cells[4].innerHTML = TSOS.Utils.getHexString(this.acc, 2, false);
            tableEntry.cells[5].innerHTML = TSOS.Utils.getHexString(this.xReg, 2, false);
            tableEntry.cells[6].innerHTML = TSOS.Utils.getHexString(this.yReg, 2, false);
            tableEntry.cells[7].innerHTML = this.zFlag.toString();
            // Update the status
            tableEntry.cells[8].innerHTML = this.status;
        }
    }
    // Public variable to keep track of the allocated ids
    ProcessControlBlock.currentPID = 0;
    TSOS.ProcessControlBlock = ProcessControlBlock;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=processControlBlock.js.map