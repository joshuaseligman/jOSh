module TSOS {
    export class ProcessControlBlock {
        // Public variable to keep track of the allocated ids
        public static currentPID = 0;

        // The process id of the process
        public _pid: number;

        // The segment in memory the process is stored in
        public _segment: number;

        // The most recent program counter of the running process
        public _programCounter: number;

        // The most recent instruction register of the running process
        public _instructionRegister: number;

        // The most recent accumulator of the running process
        public _acc: number;

        // The most recent X register of the running process
        public _xReg: number;

        // The most recent Y register of the running process
        public _yReg: number;

        // The most recent Z flag of the running process
        public _zFlag: number;

        // The status of the process
        public _status: string;

        constructor(segment: number) {
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
}