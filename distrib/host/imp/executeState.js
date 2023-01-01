var TSOS;
(function (TSOS) {
    /**
     * Enum to represent the current status of the CPU execute state
     */
    let ExecuteState;
    (function (ExecuteState) {
        ExecuteState[ExecuteState["EXECUTE0"] = 0] = "EXECUTE0";
        ExecuteState[ExecuteState["EXECUTE1"] = 1] = "EXECUTE1";
        ExecuteState[ExecuteState["EXECUTE2"] = 2] = "EXECUTE2";
        ExecuteState[ExecuteState["EXECUTE3"] = 3] = "EXECUTE3";
        ExecuteState[ExecuteState["EXECUTE4"] = 4] = "EXECUTE4";
        ExecuteState[ExecuteState["EXECUTE5"] = 5] = "EXECUTE5";
        ExecuteState[ExecuteState["EXECUTE6"] = 6] = "EXECUTE6";
        ExecuteState[ExecuteState["EXECUTE7"] = 7] = "EXECUTE7";
    })(ExecuteState = TSOS.ExecuteState || (TSOS.ExecuteState = {}));
})(TSOS || (TSOS = {}));
//# sourceMappingURL=executeState.js.map