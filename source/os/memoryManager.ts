module TSOS {
    export class MemoryManager {

        // Places the program into memory and returns the segment the program was placed in
        public allocateProgram(program: number[]): number {
            // Get the PCBs for programs allocated in memory
            let allocatedPrograms: TSOS.ProcessControlBlock[] = _PCBHistory.filter(pcb => pcb.segment !== -1);

            // We can immediately flash the program if nothing has been allocated yet
            // And only use segment 0 for now
            if (allocatedPrograms.length === 0) {
                _MemoryAccessor.flashProgram(program, 0);
                return 0;
            }
            
            for (const allcatedProg of allocatedPrograms) {
                if (allcatedProg.status === 'Terminated') {
                    // Replace the program in memory
                    let loadedSegment: number = allcatedProg.segment;
                    _MemoryAccessor.flashProgram(program, loadedSegment);

                    // Update the segment allocated to the program because it is done and no longer in memory
                    allcatedProg.segment = -1;
                    allcatedProg.updateTableEntry();

                    // Return the segment the program was placed in memory (only 0 for now)
                    return loadedSegment;
                }
            }

            // Unable to place the program in memory
            return -1;
        }
    }
}