var TSOS;
(function (TSOS) {
    class Scheduler {
        constructor() {
            // Current quantum starts with the default
            this.curQuantum = DEFAULT_QUANTUM;
            // The number of cycles starts at 0 because nothing is running yet
            this.numCycles = 0;
        }
        // Setter for the quantum
        setQuantum(newQuantum) {
            this.curQuantum = newQuantum;
        }
    }
    TSOS.Scheduler = Scheduler;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=scheduler.js.map