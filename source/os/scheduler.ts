module TSOS {
    export class Scheduler {

        // The current quantum being used
        private curQuantum: number;

        // The number of CPU cycles used for the current program in round robin
        private numCycles: number;

        constructor() {
            // Current quantum starts with the default
            this.curQuantum = DEFAULT_QUANTUM;

            // The number of cycles starts at 0 because nothing is running yet
            this.numCycles = 0;
        }

        // Setter for the quantum
        public setQuantum(newQuantum: number) {
            this.curQuantum = newQuantum;
        }
    }
}