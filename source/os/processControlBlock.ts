module TSOS {
    export class ProcessControlBlock {
        // Public variable to keep track of the allocated ids
        public static CurrentPID: number = 0;

        // The process id of the process
        public pid: number;

        // The priority of the process
        public priority: number;

        // The location of the program
        public location: string;

        // The segment in memory the process is stored in
        public seg: number;

        // Smallest physical address allowed by the program
        public baseReg: number;

        // First physical address not allowed by the program
        public limitReg: number;

        // The most recent program counter of the running process
        public programCounter: number;

        // The most recent instruction register of the running process
        public instructionRegister: number;

        // The most recent accumulator of the running process
        public acc: number;

        // The most recent X register of the running process
        public xReg: number;

        // The most recent Y register of the running process
        public yReg: number;

        // The most recent Z flag of the running process
        public zFlag: number;

        // The status of the process
        public status: string;

        // The printed output to keep track of
        public output: string;

        // The total time from submission to termination
        public turnaroundTime: number;

        // The time spent in the ready state
        public waitTime: number;

        // The name of the swap file
        public swapFile: string;

        constructor(segment: number, priority: number = 8) {
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

            // Turnaround time and wait time are both 0
            this.turnaroundTime = 0;
            this.waitTime = 0;

            // The name of the swap file will be ~<pid>. Since all PIDs are unique, there will be no issue with duplicate swap file names
            this.swapFile = `~${this.pid}`;
        }

        // Function to handle the table row entry for the PCB
        public createTableEntry(): void {
            // Create the row for the pcb info to be placed in
            let newRow: HTMLTableRowElement = document.createElement('tr');
            newRow.id = `pid${this.pid}`;

            // Create the pid element
            let pidElem: HTMLTableCellElement = document.createElement('td');
            pidElem.innerHTML = this.pid.toString();
            newRow.appendChild(pidElem);

            // Create the priority element
            let priorityElem: HTMLTableCellElement = document.createElement('td');
            priorityElem.innerHTML = this.priority.toString();
            newRow.appendChild(priorityElem);

            // Create the location element
            let locationElem: HTMLTableCellElement = document.createElement('td');
            locationElem.innerHTML = this.location;
            newRow.appendChild(locationElem);

            // Create the segment element
            let segmentElem: HTMLTableCellElement = document.createElement('td');
            segmentElem.innerHTML = (this.seg === -1 || this.seg === 3) ? 'N/A' : this.seg.toString();
            newRow.appendChild(segmentElem);

            // Create the base register element
            let baseElem: HTMLTableCellElement = document.createElement('td');
            baseElem.innerHTML = (this.baseReg !== -1) ? Utils.getHexString(this.baseReg, 3, false) : 'N/A';
            newRow.appendChild(baseElem);

            // Create the limit register element
            let limitElem: HTMLTableCellElement = document.createElement('td');
            limitElem.innerHTML = (this.limitReg !== -1) ? Utils.getHexString(this.limitReg, 3, false) : 'N/A';
            newRow.appendChild(limitElem);

            // Create the PC element
            let pcElem: HTMLTableCellElement = document.createElement('td');
            pcElem.innerHTML = Utils.getHexString(this.programCounter, 2, false);
            newRow.appendChild(pcElem);

            // Create the IR element
            let irElem: HTMLTableCellElement = document.createElement('td');
            irElem.innerHTML = Utils.getHexString(this.instructionRegister, 2, false);
            newRow.appendChild(irElem);

            // Create the Acc element
            let accElem: HTMLTableCellElement = document.createElement('td');
            accElem.innerHTML = Utils.getHexString(this.acc, 2, false);
            newRow.appendChild(accElem);

            // Create the X Reg element
            let xRegElem: HTMLTableCellElement = document.createElement('td');
            xRegElem.innerHTML = Utils.getHexString(this.xReg, 2, false);
            newRow.appendChild(xRegElem);

            // Create the Y Reg element
            let yRegElem: HTMLTableCellElement = document.createElement('td');
            yRegElem.innerHTML = Utils.getHexString(this.yReg, 2, false);
            newRow.appendChild(yRegElem);

            // Create the Z flag element
            let zFlagElem: HTMLTableCellElement = document.createElement('td');
            zFlagElem.innerHTML = this.zFlag.toString();
            newRow.appendChild(zFlagElem);

            // Create the Status element
            let statusElem: HTMLTableCellElement = document.createElement('td');
            statusElem.innerHTML = this.status;
            newRow.appendChild(statusElem);

            // Add the row to the table
            let pcbTable: HTMLTableElement = document.querySelector('#pcbTable');
            pcbTable.appendChild(newRow);
        }

        // Function to update the information for the PCB based on the CPU status
        public updateCpuInfo(pc: number, ir: number, acc: number, xReg: number, yReg: number, zFlag: number): void {
            this.programCounter = pc;
            this.instructionRegister = ir;
            this.acc = acc;
            this.xReg = xReg;
            this.yReg = yReg;
            this.zFlag = zFlag;
        }

        // Function to update the table entry for the PCB
        public updateTableEntry(): void {
            // Get the table row
            let tableEntry: HTMLTableRowElement = document.querySelector(`#pid${this.pid}`);

            // Update the location
            tableEntry.cells[2].innerHTML = this.location;

            // Update the segment and the base/limit registers
            tableEntry.cells[3].innerHTML = (this.seg === -1 || this.seg === 3) ? 'N/A' : this.seg.toString();
            tableEntry.cells[4].innerHTML = (this.baseReg !== -1) ? Utils.getHexString(this.baseReg, 3, false) : 'N/A';
            tableEntry.cells[5].innerHTML = (this.limitReg !== -1) ? Utils.getHexString(this.limitReg, 3, false) : 'N/A';

            // Update each of the CPU fields
            tableEntry.cells[6].innerHTML = Utils.getHexString(this.programCounter, 2, false);
            tableEntry.cells[7].innerHTML = Utils.getHexString(this.instructionRegister, 2, false);
            tableEntry.cells[8].innerHTML = Utils.getHexString(this.acc, 2, false);
            tableEntry.cells[8].innerHTML = Utils.getHexString(this.xReg, 2, false);
            tableEntry.cells[10].innerHTML = Utils.getHexString(this.yReg, 2, false);
            tableEntry.cells[11].innerHTML = this.zFlag.toString();

            // Update the status
            tableEntry.cells[12].innerHTML = this.status;
        }

        // Getter for the segment for consistency for naming
        get segment() {
            return this.seg;
        }

        // Setter for the segment that also updates the base, limit, and location
        set segment(newSegment: number) {
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
            case 3:
                // Program is on the disk
                [this.baseReg, this.limitReg] = [-1, -1];
                this.location = 'DISK';
                break;
            case -1:
                // Program has been deallocated
                [this.baseReg, this.limitReg] = [-1, -1];
                this.location = 'N/A';
                break;
            }
        }
    }
}