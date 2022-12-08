var TSOS;
(function (TSOS) {
    /**
     * Enum to represent the current state of the CPU's fetch cycle
     */
    let FetchState;
    (function (FetchState) {
        FetchState[FetchState["FETCH0"] = 0] = "FETCH0";
        FetchState[FetchState["FETCH1"] = 1] = "FETCH1";
        FetchState[FetchState["FETCH2"] = 2] = "FETCH2";
    })(FetchState = TSOS.FetchState || (TSOS.FetchState = {}));
})(TSOS || (TSOS = {}));
//# sourceMappingURL=fetchState.js.map