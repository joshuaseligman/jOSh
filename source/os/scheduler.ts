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

        // Calls the dispatcher to schedule the firste process
        public scheduleFirstProcess(): void {
            _KernelInterruptQueue.enqueue(new Interrupt(CALL_DISPATCHER_IRQ, [true]));
            this.numCycles = 0;

            // Update the html
            document.querySelector('#currentQuantumVal').innerHTML = this.numCycles.toString();
        }

        public handleCpuSchedule(): boolean {
            // Variable for determining if the cpu cycle should execute
            let output: boolean = true;

            this.numCycles++;

            if (_PCBReadyQueue.getSize() > 0 && (_PCBReadyQueue.getHead() as ProcessControlBlock).status === 'Terminated') {
                // Create a software interrupt to do a context switch
                _KernelInterruptQueue.enqueue(new Interrupt(CALL_DISPATCHER_IRQ, []));

                // Reset the number of cpu cycles for the current running program
                this.numCycles = 0;

                // Prevent the cpu from doing another cycle
                output = false;
            } else if (this.numCycles > this.curQuantum) {
                // Only call the dispatcher if we have multiple programs in memory
                if (_PCBReadyQueue.getSize() > 1) {
                    // Create a software interrupt to do a context switch
                    _KernelInterruptQueue.enqueue(new Interrupt(CALL_DISPATCHER_IRQ, []));
                }

                // Prevent the cpu from doing another cycle
                output = false;

                // Reset the number of cycles because this will not be called again until the dispatcher is done
                this.numCycles = 0;
            }

            // Update the html
            document.querySelector('#currentQuantumVal').innerHTML = this.numCycles.toString();
            return output;
        }

        // Setter for the quantum
        public setQuantum(newQuantum: number): void {
            this.curQuantum = newQuantum;
        }
    }
}