var TSOS;
(function (TSOS) {
    /**
         * Enum to represent the current status of the CPU decode state
         */
    let DecodeState;
    (function (DecodeState) {
        DecodeState[DecodeState["DECODE0"] = 0] = "DECODE0";
        DecodeState[DecodeState["DECODE1"] = 1] = "DECODE1";
        DecodeState[DecodeState["DECODE2"] = 2] = "DECODE2";
        DecodeState[DecodeState["DECODE3"] = 3] = "DECODE3";
    })(DecodeState = TSOS.DecodeState || (TSOS.DecodeState = {}));
})(TSOS || (TSOS = {}));
//# sourceMappingURL=decodeState.js.map