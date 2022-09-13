var TSOS;
(function (TSOS) {
    class MemoryManager {
        // Places the program into memory and returns the segment the program was placed in
        allocateProgram(program) {
            // We currently only want to be able to allocate 1 program in memory if there is not an 
            // allocated or running program in segment 0
            if (_PCBHistory.filter(pcb => pcb.segment !== -1 && pcb.status !== 'Terminated').length < 1) {
                // Place the program into section 0 in memory
                _MemoryAccessor.flashProgram(program, 0);
                return 0;
            }
            // Unable to place the program in memory
            return -1;
        }
    }
    TSOS.MemoryManager = MemoryManager;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memoryManager.js.map