var TSOS;
(function (TSOS) {
    class Dispatcher {
        contextSwitch() {
            let preemptedProcess = _PCBReadyQueue.dequeue();
            preemptedProcess.status = 'Ready';
            preemptedProcess.updateTableEntry();
            _PCBReadyQueue.enqueue(preemptedProcess);
            let newProcess = _PCBReadyQueue.getHead();
            _CPU.setCpuStatus(newProcess.programCounter, newProcess.instructionRegister, newProcess.acc, newProcess.xReg, newProcess.yReg, newProcess.zFlag);
        }
    }
    TSOS.Dispatcher = Dispatcher;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=dispatcher.js.map