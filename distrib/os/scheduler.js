var TSOS;
(function (TSOS) {
    class Scheduler {
        constructor() {
            // Current quantum starts with the default
            this.curQuantum = DEFAULT_QUANTUM;
            // The number of cycles starts at 0 because nothing is running yet
            this.numCycles = 0;
            this.curAlgo = SchedulingAlgo.ROUND_ROBIN;
        }
        // Calls the dispatcher to schedule the firste process
        scheduleFirstProcess() {
            _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CALL_DISPATCHER_IRQ, [true]));
            this.numCycles = 0;
            // Update the html
            document.querySelector('#currentQuantumVal').innerHTML = this.numCycles.toString();
        }
        handleCpuSchedule() {
            // Variable for determining if the cpu cycle should execute
            let output = true;
            this.numCycles++;
            if (_PCBReadyQueue.getSize() > 0 && _PCBReadyQueue.getHead().status === 'Terminated') {
                // Create a software interrupt to do a context switch
                _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CALL_DISPATCHER_IRQ, []));
                // Reset the number of cpu cycles for the current running program
                this.numCycles = 0;
                // Prevent the cpu from doing another cycle
                output = false;
            }
            else if (this.numCycles > this.curQuantum) {
                // Only call the dispatcher if we have multiple programs in memory
                if (_PCBReadyQueue.getSize() > 1) {
                    // Create a software interrupt to do a context switch
                    _KernelInterruptQueue.enqueue(new TSOS.Interrupt(CALL_DISPATCHER_IRQ, []));
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
        setQuantum(newQuantum) {
            this.curQuantum = newQuantum;
            // Update the HTML to reflect the new quantum
            document.querySelector('#quantumVal').innerHTML = newQuantum.toString();
        }
        getCurAlgo() {
            return this.curAlgo;
        }
        setCurAlgo(newAlgo) {
            this.curAlgo = newAlgo;
            if (newAlgo === SchedulingAlgo.ROUND_ROBIN) {
                // Set the quantum back to default when switching to round robin
                this.setQuantum(DEFAULT_QUANTUM);
            }
            else if (newAlgo === SchedulingAlgo.FCFS) {
                // FCFS is RR with a super large quantum value
                this.setQuantum(Number.MAX_VALUE);
            }
        }
    }
    TSOS.Scheduler = Scheduler;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=scheduler.js.map