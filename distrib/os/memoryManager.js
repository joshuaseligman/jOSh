var TSOS;
(function (TSOS) {
    class MemoryManager {
        // Places the program into memory and returns the segment the program was placed in
        allocateProgram(program) {
            // Get the PCBs for programs allocated in memory
            let allocatedPrograms = _PCBHistory.filter(pcb => pcb.segment !== -1 && pcb.segment !== 4);
            // We can immediately flash the program if fewer than 3 programs have been allocated so far
            if (allocatedPrograms.length <= 3) {
                // Determine the open segment
                let segmentAvailability = [true, true, true];
                for (let i = 0; i < allocatedPrograms.length; i++) {
                    segmentAvailability[allocatedPrograms[i].segment] = false;
                }
                for (let j = 0; j < segmentAvailability.length; j++) {
                    if (segmentAvailability[j]) {
                        // Flash the data to the open segment
                        _MemoryAccessor.flashProgram(program, _BaseLimitPairs[j][0]);
                        return j;
                    }
                }
            }
            for (const allcatedProg of allocatedPrograms) {
                // Check to see if there is a terminated program still allocated in memory
                if (allcatedProg.status === 'Terminated') {
                    // Replace the program in memory
                    _MemoryAccessor.flashProgram(program, allcatedProg.baseReg);
                    let savedSegment = allcatedProg.segment;
                    // Update the segment allocated to the program because it is done and no longer in memory
                    allcatedProg.segment = -1;
                    allcatedProg.updateTableEntry();
                    // Return the segment the program was placed in memory (only 0 for now)
                    return savedSegment;
                }
            }
            // Unable to place the program in memory
            return -1;
        }
        deallocateProcess(pcb, toDisk) {
            // Update the segment and the base/limit pairs and location
            pcb.segment = (toDisk) ? 4 : -1;
            pcb.updateTableEntry();
        }
        deallocateAll() {
            // Get the PCBs for programs allocated in memory
            let allocatedPrograms = _PCBHistory.filter(pcb => pcb.segment !== -1);
            for (const prog of allocatedPrograms) {
                // Clear the segment the program was stored in
                _MemoryAccessor.clearMemory(prog.baseReg, prog.limitReg);
                // Update the segment to be deallocated
                prog.segment = -1;
                // Make sure the status is terminated
                prog.status = 'Terminated';
                prog.updateTableEntry();
                // Notify the user of what's happened
                _Kernel.krnTrace(`Process ${prog.pid} deallocated from memory.`);
                _StdOut.putText(`Process ${prog.pid} deallocated from memory.`);
                _StdOut.advanceLine();
            }
        }
    }
    TSOS.MemoryManager = MemoryManager;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memoryManager.js.map