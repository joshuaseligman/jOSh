module TSOS {
    export class ProcessControlBlock {
        // Public variable to keep track of the allocated ids
        public static CurrentPID: number = 0;

        // Pairs for easily determining the base and limit registers
        public static BaseLimitPairs: number[][] = [[0x0000, 0x0100], [0x0100, 0x0200], [0x0200, 0x0300]];

        // The process id of the process
        public pid: number;

        // The segment in memory the process is stored in
        public segment: number;

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

        constructor(segment: number) {
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
            [this.baseReg, this.limitReg] = ProcessControlBlock.BaseLimitPairs[this.segment];

            // Set the status to '' for now
            this.status = 'Resident';

            // Output starts off as empty
            this.output = '';

            // Add the PCB to the table
            this.createTableEntry();
        }

        // Function to handle the table row entry for the PCB
        private createTableEntry(): void {
            // Create the row for the pcb info to be placed in
            let newRow: HTMLTableRowElement = document.createElement('tr');
            newRow.id = `pid${this.pid}`;

            // Create the pid element
            let pidElem: HTMLTableCellElement = document.createElement('td');
            pidElem.innerHTML = this.pid.toString();
            newRow.appendChild(pidElem);

            // Create the segment element
            let segmentElem: HTMLTableCellElement = document.createElement('td');
            segmentElem.innerHTML = this.segment.toString();
            newRow.appendChild(segmentElem);

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

            // Update the segment
            if (this.segment === -1) {
                tableEntry.cells[1].innerHTML = 'N/A'
            } else {
                tableEntry.cells[1].innerHTML = this.segment.toString();
            }

            // Update each of the CPU fields
            tableEntry.cells[2].innerHTML = Utils.getHexString(this.programCounter, 2, false);
            tableEntry.cells[3].innerHTML = Utils.getHexString(this.instructionRegister, 2, false);
            tableEntry.cells[4].innerHTML = Utils.getHexString(this.acc, 2, false);
            tableEntry.cells[5].innerHTML = Utils.getHexString(this.xReg, 2, false);
            tableEntry.cells[6].innerHTML = Utils.getHexString(this.yReg, 2, false);
            tableEntry.cells[7].innerHTML = this.zFlag.toString();

            // Update the status
            tableEntry.cells[8].innerHTML = this.status;
        }
    }
}