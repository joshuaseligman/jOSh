var TSOS;
(function (TSOS) {
    /**
     * Enum to represent the current status of the CPU writeback state
     */
    let WritebackState;
    (function (WritebackState) {
        WritebackState[WritebackState["WRITEBACK0"] = 0] = "WRITEBACK0";
        WritebackState[WritebackState["WRITEBACK1"] = 1] = "WRITEBACK1";
    })(WritebackState = TSOS.WritebackState || (TSOS.WritebackState = {}));
})(TSOS || (TSOS = {}));
//# sourceMappingURL=writebackState.js.map