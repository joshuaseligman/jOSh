module TSOS {
    /**
     * Represents the output for each adder
     */
    export interface AdderOutput {
        /**
         * 0 or 1 for the sum of the bits
         */
        sum: number;

        /**
         * 0 or 1 for the carry
         */
        carry: number;
    }

    /**
     * Class that represents the ALU of the CPU
     */
    export class Alu {
        
        /**
         * Represents the zFlag
         */
        private _zFlag: number;

        /**
         * Represents the carry flag
         */
        private _carryFlag: boolean;

        /**
         * Represents the output from the last operation
         */
        private _lastOutput: number;

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
        public addWithCarry(num1: number, num2: number, shouldCarry: boolean = false): number {
            // Set initial variables
            let sum: number = 0;
            let carry: number = (shouldCarry) ? Number(this._carryFlag) : 0;

            for (let i: number = 0; i < 8; i++) {
                // Get the bits to add
                let bit1: number = num1 & 1;
                let bit2: number = num2 & 1;

                // Update the numbers
                num1 = num1 >> 1;
                num2 = num2 >> 1;

                // Get the result
                let result: AdderOutput = this.fullAdder(bit1, bit2, carry);

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
        public fullAdder(bit1: number, bit2: number, carry: number): AdderOutput {
            // Add the two original bits
            let first: AdderOutput =  this.halfAdder(bit1, bit2);
            
            // Add the first sum with the carry input
            let second: AdderOutput = this.halfAdder(first.sum, carry);

            // Return the result
            let sumOut = second.sum;
            let carryOut = first.carry | second.carry;
            let out: AdderOutput = {
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
        public halfAdder(bit1: number, bit2: number): AdderOutput {
            // Sum is XOR of the bits
            let sumOut: number = bit1 ^ bit2;
            
            // Carry is the AND of the bits
            let carryOut: number = bit1 & bit2;

            // Return the result
            let out: AdderOutput = {
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
        public negate(num: number): number {
            let result: number = ((~num) & 0xFF) + 1;
            this._lastOutput = result;
            return result;
        }

        /**
         * Getter for the zFlag
         * @returns The zFlag
         */
        public getZFlag(): number {
            return this._zFlag;
        }

        /**
         * Setter for the z flag
         * @param newZFlag The new z flag
         */
        public setZFlag(newZFlag: number) {
            this._zFlag = newZFlag;
        }

        /**
         * Getter for the carry flag
         * @returns The carry flag
         */
        public getCarryFlag(): boolean {
            return this._carryFlag;
        }

        /**
         * Getter for the last output
         * @returns The last output
         */
        public getLastOutput(): number {
            return this._lastOutput;
        }
    }
}