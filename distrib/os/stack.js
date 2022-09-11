var TSOS;
(function (TSOS) {
    // Simple Stack class for basic use right now
    class Stack {
        constructor(s = new Array()) {
            this.s = s;
        }
        getSize() {
            return this.s.length;
        }
        isEmpty() {
            return (this.s.length == 0);
        }
        push(element) {
            this.s.unshift(element);
        }
        pop() {
            var retVal = null;
            if (this.s.length > 0) {
                retVal = this.s.shift();
            }
            return retVal;
        }
        toString() {
            var retVal = "";
            for (var i in this.s) {
                retVal += "[" + this.s[i] + "] ";
            }
            return retVal;
        }
        clear() {
            this.s = [];
        }
    }
    TSOS.Stack = Stack;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=stack.js.map