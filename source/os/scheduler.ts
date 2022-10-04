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

        public handleCpuSchedule(): void {
            this.numCycles++;

            if (this.numCycles >= this.curQuantum) {
                // Only call the dispatcher if we have multiple programs in memory
                if (_PCBReadyQueue.getSize() > 1) {
                    // Create a software interrupt to do a context switch
                    _KernelInterruptQueue.enqueue(new Interrupt(CALL_DISPATCHER_IRQ, []));
                }

                // Reset the number of cycles because this will not be called again until the dispatcher is done
                this.numCycles = 0;
            }
        }

        // Setter for the quantum
        public setQuantum(newQuantum: number): void {
            this.curQuantum = newQuantum;
        }
    }
}