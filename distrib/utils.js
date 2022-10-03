/* --------
   Utils.ts

   Utility functions.
   -------- */
var TSOS;
(function (TSOS) {
    class Utils {
        static trim(str) {
            // Use a regular expression to remove leading and trailing spaces.
            return str.replace(/^\s+ | \s+$/g, "");
            /*
            Huh? WTF? Okay... take a breath. Here we go:
            - The "|" separates this into two expressions, as in A or B.
            - "^\s+" matches a sequence of one or more whitespace characters at the beginning of a string.
            - "\s+$" is the same thing, but at the end of the string.
            - "g" makes is global, so we get all the whitespace.
            - "" is nothing, which is what we replace the whitespace with.
            */
        }
        static rot13(str) {
            /*
               This is an easy-to understand implementation of the famous and common Rot13 obfuscator.
               You can do this in three lines with a complex regular expression, but I'd have
               trouble explaining it in the future.  There's a lot to be said for obvious code.
            */
            var retVal = "";
            for (var i in str) { // We need to cast the string to any for use in the for...in construct.
                var ch = str[i];
                var code = 0;
                if ("abcedfghijklmABCDEFGHIJKLM".indexOf(ch) >= 0) {
                    code = str.charCodeAt(Number(i)) + 13; // It's okay to use 13.  It's not a magic number, it's called rot13.
                    retVal = retVal + String.fromCharCode(code);
                }
                else if ("nopqrstuvwxyzNOPQRSTUVWXYZ".indexOf(ch) >= 0) {
                    code = str.charCodeAt(Number(i)) - 13; // It's okay to use 13.  See above.
                    retVal = retVal + String.fromCharCode(code);
                }
                else {
                    retVal = retVal + ch;
                }
            }
            return retVal;
        }
        static getDate() {
            // Gets the current date and time and returns it in a string for easy use throughout the project
            let now = new Date();
            return now.toLocaleString();
        }
        // Function for converting a number to a hex string
        static getHexString(num, minLength, addPrefix) {
            // Get the base 16 string representation
            let hexString = num.toString(16).toUpperCase();
            ;
            // Add leading 0s if necessary
            if (hexString.length < minLength) {
                let diff = minLength - hexString.length;
                hexString = '0'.repeat(diff) + hexString;
            }
            // Add the 0x prefix if requested
            if (addPrefix) {
                hexString = '0x' + hexString;
            }
            return hexString;
        }
    }
    TSOS.Utils = Utils;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=utils.js.map