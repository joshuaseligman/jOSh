var TSOS;
(function (TSOS) {
    class Dispatcher {
        // Function to perform a context switch
        contextSwitch(firstProcess, algo) {
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
                    let newProcess;
                    if (algo === SchedulingAlgo.ROUND_ROBIN) {
                        // Take next process if using RR
                        newProcess = _PCBReadyQueue.getHead();
                    }
                    else if (algo === SchedulingAlgo.FCFS) {
                        // Assume first is the lowest priority
                        let newProcessIndex = 0;
                        // Go through the rest of the PCBs
                        for (let i = 1; i < _PCBReadyQueue.getSize(); i++) {
                            // Lower pid was made earlier, so use that one next
                            if (_PCBReadyQueue.q[i].pid < _PCBReadyQueue.q[newProcessIndex].pid) {
                                newProcessIndex = i;
                            }
                        }
                        // Remove the process from the array and place it at the start
                        newProcess = _PCBReadyQueue.q.splice(newProcessIndex, 1)[0];
                        _PCBReadyQueue.q.unshift(newProcess);
                    }
                    else if (algo === SchedulingAlgo.PRIORITY) {
                        // Assume first is the lowest priority
                        let newProcessIndex = 0;
                        // Go through the rest of the PCBs
                        for (let i = 1; i < _PCBReadyQueue.getSize(); i++) {
                            // If the new PCB has a lower priority, use it next
                            if (_PCBReadyQueue.q[i].priority < _PCBReadyQueue.q[newProcessIndex].priority) {
                                newProcessIndex = i;
                            }
                            else if (_PCBReadyQueue.q[i].priority === _PCBReadyQueue.q[newProcessIndex].priority) {
                                // If the priorities are equal, use FCFS to break tie
                                if (_PCBReadyQueue.q[i].pid < _PCBReadyQueue.q[newProcessIndex].pid) {
                                    newProcessIndex = i;
                                }
                            }
                        }
                        // Remove the process from the array and place it at the start
                        newProcess = _PCBReadyQueue.q.splice(newProcessIndex, 1)[0];
                        _PCBReadyQueue.q.unshift(newProcess);
                    }
                    if (newProcess.segment === 3) {
                        _Kernel.krnSwap(newProcess);
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