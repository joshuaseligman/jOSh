module TSOS {

    // Simple Stack class for basic use right now
    export class Stack {
        constructor(public s = new Array()) {
        }

        public getSize() {
            return this.s.length;
        }

        public isEmpty(){
            return (this.s.length == 0);
        }

        public push(element) {
            this.s.unshift(element);
        }

        public pop() {
            var retVal = null;
            if (this.s.length > 0) {
                retVal = this.s.shift();
            }
            return retVal;
        }

        public toString() {
            var retVal = "";
            for (var i in this.s) {
                retVal += "[" + this.s[i] + "] ";
            }
            return retVal;
        }

        public clear() {
            this.s = [];
        }
    }
}