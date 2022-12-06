module TSOS {
    /**
     * Enum to represent the current status of the CPU pipeline
     */
    export enum PipelineState {
        FETCH,
        DECODE,
        EXECUTE,
        WRITEBACK,
        INTERRUPTCHECK
    }
}