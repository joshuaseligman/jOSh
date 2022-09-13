var TSOS;
(function (TSOS) {
    class MemoryManager {
        // Places the program into memory and returns the segment the program was placed in
        allocateProgram(program) {
            // We currently only want to run 1 program
            if (_PCBQueue.getSize() < 1) {
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