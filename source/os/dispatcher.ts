module TSOS {
    export class Dispatcher {

        public contextSwitch(): void {
            let preemptedProcess: ProcessControlBlock = _PCBReadyQueue.dequeue();
            preemptedProcess.status = 'Ready';
            preemptedProcess.updateTableEntry();
            _PCBReadyQueue.enqueue(preemptedProcess);
            let newProcess: ProcessControlBlock = _PCBReadyQueue.getHead();
            _CPU.setCpuStatus(newProcess.programCounter, newProcess.instructionRegister, newProcess.acc, newProcess.xReg, newProcess.yReg, newProcess.zFlag);
        }
    }
}