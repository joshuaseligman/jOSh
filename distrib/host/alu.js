var TSOS;
(function (TSOS) {
    /**
     * Class that represents the ALU of the CPU
     */
    class Alu {
        /**
         * Constructor for the ALU
         */
        constructor() {
            this._zFlag = 0;
            this._carryFlag = false;
            this._lastOutput = 0x00;
        }
        /**
         * Adder with carry based on carry flag
         * @param num1 The first number to add
         * @param num2 The second number to add
         * @returns The resulting sum
         */
        addWithCarry(num1, num2, shouldCarry = false) {
            // Set initial variables
            let sum = 0;
            let carry = (shouldCarry) ? Number(this._carryFlag) : 0;
            for (let i = 0; i < 8; i++) {
                // Get the bits to add
                let bit1 = num1 & 1;
                let bit2 = num2 & 1;
                // Update the numbers
                num1 = num1 >> 1;
                num2 = num2 >> 1;
                // Get the result
                let result = this.fullAdder(bit1, bit2, carry);
                // Update the final total and carry for next adder
                sum = result.sum << i | sum;
                carry = result.carry;
            }
            // Set zFlag and carry flag
            this._zFlag = (sum == 0) ? 1 : 0;
            this._carryFlag = Boolean(carry);
            this._lastOutput = sum;
            // Return the sum
            return sum;
        }
        /**
         * Computes the logic for a full adder
         * @param bit1 The first bit
         * @param bit2 The second bit
         * @param carry The carry
         * @returns The sum and output of the operation
         */
        fullAdder(bit1, bit2, carry) {
            // Add the two original bits
            let first = this.halfAdder(bit1, bit2);
            // Add the first sum with the carry input
            let second = this.halfAdder(first.sum, carry);
            // Return the result
            let sumOut = second.sum;
            let carryOut = first.carry | second.carry;
            let out = {
                sum: sumOut,
                carry: carryOut
            };
            return out;
        }
        /**
         * Computes the logic for a half adder
         * @param bit1 The first bit
         * @param bit2 The second bit
         * @returns The sum and output of the operation
         */
        halfAdder(bit1, bit2) {
            // Sum is XOR of the bits
            let sumOut = bit1 ^ bit2;
            // Carry is the AND of the bits
            let carryOut = bit1 & bit2;
            // Return the result
            let out = {
                sum: sumOut,
                carry: carryOut
            };
            return out;
        }
        /**
         * Negates a number using 2's complement
         * @param num The number to negate
         * @returns The negated version of the number
         */
        negate(num) {
            let result = ((~num) & 0xFF) + 1;
            this._lastOutput = result;
            return result;
        }
        /**
         * Getter for the zFlag
         * @returns The zFlag
         */
        getZFlag() {
            return this._zFlag;
        }
        /**
         * Setter for the z flag
         * @param newZFlag The new z flag
         */
        setZFlag(newZFlag) {
            this._zFlag = newZFlag;
        }
        /**
         * Getter for the carry flag
         * @returns The carry flag
         */
        getCarryFlag() {
            return this._carryFlag;
        }
        /**
         * Getter for the last output
         * @returns The last output
         */
        getLastOutput() {
            return this._lastOutput;
        }
    }
    TSOS.Alu = Alu;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=alu.js.map