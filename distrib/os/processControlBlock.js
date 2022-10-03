var TSOS;
(function (TSOS) {
    class ProcessControlBlock {
        constructor(segment) {
            // Set the process id te the current id and increment the current id for future use
            this.pid = ProcessControlBlock.CurrentPID;
            ProcessControlBlock.CurrentPID++;
            // All CPU variables start at 0 because that is what is 
            this.programCounter = 0;
            this.instructionRegister = 0;
            this.acc = 0;
            this.xReg = 0;
            this.yReg = 0;
            this.zFlag = 0;
            // Set the segment to wherever the program was stored
            this.segment = segment;
            // Assign the base and limit registers accordingly
            [this.baseReg, this.limitReg] = _BaseLimitPairs[this.segment];
            // Set the status to '' for now
            this.status = 'Resident';
            // Output starts off as empty
            this.output = '';
            // Add the PCB to the table
            this.createTableEntry();
        }
        // Function to handle the table row entry for the PCB
        createTableEntry() {
            // Create the row for the pcb info to be placed in
            let newRow = document.createElement('tr');
            newRow.id = `pid${this.pid}`;
            // Create the pid element
            let pidElem = document.createElement('td');
            pidElem.innerHTML = this.pid.toString();
            newRow.appendChild(pidElem);
            // Create the segment element
            let segmentElem = document.createElement('td');
            segmentElem.innerHTML = this.segment.toString();
            newRow.appendChild(segmentElem);
            // Create the PC element
            let pcElem = document.createElement('td');
            pcElem.innerHTML = TSOS.Utils.getHexString(this.programCounter, 2, false);
            newRow.appendChild(pcElem);
            // Create the IR element
            let irElem = document.createElement('td');
            irElem.innerHTML = TSOS.Utils.getHexString(this.instructionRegister, 2, false);
            newRow.appendChild(irElem);
            // Create the Acc element
            let accElem = document.createElement('td');
            accElem.innerHTML = TSOS.Utils.getHexString(this.acc, 2, false);
            newRow.appendChild(accElem);
            // Create the X Reg element
            let xRegElem = document.createElement('td');
            xRegElem.innerHTML = TSOS.Utils.getHexString(this.xReg, 2, false);
            newRow.appendChild(xRegElem);
            // Create the Y Reg element
            let yRegElem = document.createElement('td');
            yRegElem.innerHTML = TSOS.Utils.getHexString(this.yReg, 2, false);
            newRow.appendChild(yRegElem);
            // Create the Z flag element
            let zFlagElem = document.createElement('td');
            zFlagElem.innerHTML = this.zFlag.toString();
            newRow.appendChild(zFlagElem);
            // Create the Status element
            let statusElem = document.createElement('td');
            statusElem.innerHTML = this.status;
            newRow.appendChild(statusElem);
            // Add the row to the table
            let pcbTable = document.querySelector('#pcbTable');
            pcbTable.appendChild(newRow);
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
            // Update the segment
            if (this.segment === -1) {
                tableEntry.cells[1].innerHTML = 'N/A';
            }
            else {
                tableEntry.cells[1].innerHTML = this.segment.toString();
            }
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
    ProcessControlBlock.CurrentPID = 0;
    TSOS.ProcessControlBlock = ProcessControlBlock;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=processControlBlock.js.map