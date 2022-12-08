var TSOS;
(function (TSOS) {
    /**
     * Enum to represent the current status of memory
     */
    let MemoryState;
    (function (MemoryState) {
        MemoryState[MemoryState["READY"] = 0] = "READY";
        MemoryState[MemoryState["WAIT0"] = 1] = "WAIT0";
        MemoryState[MemoryState["WAIT1"] = 2] = "WAIT1";
        MemoryState[MemoryState["WAIT2"] = 3] = "WAIT2";
    })(MemoryState = TSOS.MemoryState || (TSOS.MemoryState = {}));
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memoryState.js.map