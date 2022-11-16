var TSOS;
(function (TSOS) {
    class Dispatcher {
        // Function to perform a context switch
        contextSwitch(firstProcess) {
            if (firstProcess) {
                // Set the first process to running to get the ball rolling
                let headProcess = _PCBReadyQueue.getHead();
                headProcess.status = 'Running';
                headProcess.updateTableEntry();
                // Update the CPU to be able to run the new program
                _CPU.isExecuting = true;
                _CPU.setCpuStatus(headProcess.programCounter, headProcess.instructionRegister, headProcess.acc, headProcess.xReg, headProcess.yReg, headProcess.zFlag);
            }
            else {
                // Get the process that has been preempted and move it to the back of the queue
                let preemptedProcess = _PCBReadyQueue.dequeue();
                if (preemptedProcess.status !== 'Terminated') {
                    // If there is another program, we need to roll this one out of memory
                    preemptedProcess.status = 'Ready';
                    preemptedProcess.updateTableEntry();
                    _PCBReadyQueue.enqueue(preemptedProcess);
                }
                // Set the next process to be running and update the cpu accordingly
                if (_PCBReadyQueue.getSize() > 0) {
                    let newProcess = _PCBReadyQueue.getHead();
                    if (newProcess.segment === 4) {
                        _Kernel.krnRollOut(preemptedProcess);
                        _Kernel.krnRollIn(newProcess);
                    }
                    newProcess.status = 'Running';
                    newProcess.updateTableEntry();
                    _CPU.isExecuting = true;
                    _CPU.setCpuStatus(newProcess.programCounter, newProcess.instructionRegister, newProcess.acc, newProcess.xReg, newProcess.yReg, newProcess.zFlag);
                }
                else {
                    _CPU.init();
                    _CPU.isExecuting = false;
                }
            }
        }
    }
    TSOS.Dispatcher = Dispatcher;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=dispatcher.js.map