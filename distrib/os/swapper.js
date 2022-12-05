var TSOS;
(function (TSOS) {
    class Swapper {
        swap(pcb) {
            // Check for an available segment in memory
            if (!_MemoryManager.hasAvailableSegment()) {
                // Roll out the most recently run process
                this.rollOut(_PCBReadyQueue.getTail());
            }
            // Roll in the given process
            this.rollIn(pcb);
        }
        rollOut(pcb) {
            // Create the swap file for the process
            if (pcb.status === 'Ready') {
                let fileCreationStatus = _Kernel.createSwapFileForSegment(pcb.swapFile, pcb.segment);
                if (fileCreationStatus !== 0) {
                    // BSOD if any error
                    _Kernel.krnTrapError('Error from creating a swap file.');
                }
                else {
                    _Kernel.krnTrace(`Rolled out PID ${pcb.pid} to disk.`);
                }
            }
            // Free it up in the pcb
            _MemoryManager.deallocateProcess(pcb, pcb.status === 'Ready');
            // Update the table
            pcb.updateTableEntry();
        }
        rollIn(pcb) {
            // Read the swap file from the disk
            let swapRead = _krnDiskSystemDeviceDriver.readFileRaw(pcb.swapFile, 0x100);
            _krnDiskSystemDeviceDriver.deleteFile(pcb.swapFile);
            if (swapRead[0] === 0) {
                let newSegment = _MemoryManager.allocateProgram(swapRead[1]);
                pcb.segment = newSegment;
                _Kernel.krnTrace(`Rolled in PID ${pcb.pid} to segment ${newSegment}.`);
            }
            else {
                // Nothing bad should ever happen from reading, but do a BSOD in case
                _Kernel.krnTrapError('Error from reading a swap file.');
            }
            pcb.updateTableEntry();
        }
    }
    TSOS.Swapper = Swapper;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=swapper.js.map