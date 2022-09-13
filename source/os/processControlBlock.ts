module TSOS {
    export class ProcessControlBlock {
        // Public variable to keep track of the allocated ids
        public static currentPID = 0;

        // The process id of the process
        public pid: number;

        // The segment in memory the process is stored in
        public segment: number;

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

        constructor(segment: number) {
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
}