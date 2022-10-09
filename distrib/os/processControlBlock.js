var TSOS;
(function (TSOS) {
    class ProcessControlBlock {
        constructor(segment, priority = 8) {
            // Set the process id te the current id and increment the current id for future use
            this.pid = ProcessControlBlock.CurrentPID;
            ProcessControlBlock.CurrentPID++;
            // Set the priority
            this.priority = priority;
            // All CPU variables start at 0 because that is what is 
            this.programCounter = 0;
            this.instructionRegister = 0;
            this.acc = 0;
            this.xReg = 0;
            this.yReg = 0;
            this.zFlag = 0;
            // Set the segment to wherever the program was stored, which will set the location and the base/limit registers too
            this.segment = segment;
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
            // Create the priority element
            let priorityElem = document.createElement('td');
            priorityElem.innerHTML = this.priority.toString();
            newRow.appendChild(priorityElem);
            // Create the location element
            let locationElem = document.createElement('td');
            locationElem.innerHTML = this.location;
            newRow.appendChild(locationElem);
            // Create the segment element
            let segmentElem = document.createElement('td');
            segmentElem.innerHTML = this.seg.toString();
            newRow.appendChild(segmentElem);
            // Create the base register element
            let baseElem = document.createElement('td');
            baseElem.innerHTML = (this.baseReg !== -1) ? TSOS.Utils.getHexString(this.baseReg, 3, false) : 'N/A';
            newRow.appendChild(baseElem);
            // Create the limit register element
            let limitElem = document.createElement('td');
            limitElem.innerHTML = (this.limitReg !== -1) ? TSOS.Utils.getHexString(this.limitReg, 3, false) : 'N/A';
            newRow.appendChild(limitElem);
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
            // Update the location
            tableEntry.cells[2].innerHTML = this.location;
            // Update the segment and the base/limit registers
            tableEntry.cells[3].innerHTML = (this.segment === -1) ? 'N/A' : this.segment.toString();
            tableEntry.cells[4].innerHTML = (this.baseReg !== -1) ? TSOS.Utils.getHexString(this.baseReg, 3, false) : 'N/A';
            tableEntry.cells[5].innerHTML = (this.limitReg !== -1) ? TSOS.Utils.getHexString(this.limitReg, 3, false) : 'N/A';
            // Update each of the CPU fields
            tableEntry.cells[6].innerHTML = TSOS.Utils.getHexString(this.programCounter, 2, false);
            tableEntry.cells[7].innerHTML = TSOS.Utils.getHexString(this.instructionRegister, 2, false);
            tableEntry.cells[8].innerHTML = TSOS.Utils.getHexString(this.acc, 2, false);
            tableEntry.cells[8].innerHTML = TSOS.Utils.getHexString(this.xReg, 2, false);
            tableEntry.cells[10].innerHTML = TSOS.Utils.getHexString(this.yReg, 2, false);
            tableEntry.cells[11].innerHTML = this.zFlag.toString();
            // Update the status
            tableEntry.cells[12].innerHTML = this.status;
        }
        // Getter for the segment for consistency for naming
        get segment() {
            return this.seg;
        }
        // Setter for the segment that also updates the base, limit, and location
        set segment(newSegment) {
            // Update the segment
            this.seg = newSegment;
            switch (this.seg) {
                case 0:
                case 1:
                case 2:
                    // Program is in memory
                    [this.baseReg, this.limitReg] = _BaseLimitPairs[this.seg];
                    this.location = 'MEMORY';
                    break;
                case -1:
                    // Program has been deallocated
                    [this.baseReg, this.limitReg] = [-1, -1];
                    this.location = 'N/A';
                    break;
            }
        }
    }
    // Public variable to keep track of the allocated ids
    ProcessControlBlock.CurrentPID = 0;
    TSOS.ProcessControlBlock = ProcessControlBlock;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=processControlBlock.js.map