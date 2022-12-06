var TSOS;
(function (TSOS) {
    /**
     * Enum to represent the current status of the CPU pipeline
     */
    let PipelineState;
    (function (PipelineState) {
        PipelineState[PipelineState["FETCH"] = 0] = "FETCH";
        PipelineState[PipelineState["DECODE"] = 1] = "DECODE";
        PipelineState[PipelineState["EXECUTE"] = 2] = "EXECUTE";
        PipelineState[PipelineState["WRITEBACK"] = 3] = "WRITEBACK";
        PipelineState[PipelineState["INTERRUPTCHECK"] = 4] = "INTERRUPTCHECK";
    })(PipelineState = TSOS.PipelineState || (TSOS.PipelineState = {}));
})(TSOS || (TSOS = {}));
//# sourceMappingURL=pipelineState.js.map