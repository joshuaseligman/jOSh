/* ------------
   Globals.ts

   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation / Host.)

   This code references page numbers in our text book:
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

//
// Global CONSTANTS (TypeScript 1.5 introduced const. Very cool.)
//
const APP_NAME: string    = "jOSh";   // 'cause Bob and I were at a loss for a better name.
const APP_VERSION: string = "0.0.1 - a work in progress";   // What did you expect?

const CPU_CLOCK_INTERVAL: number = 100;   // This is in ms (milliseconds) so 1000 = 1 second.

const TIMER_IRQ: number = 0;  // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority).
                              // NOTE: The timer is different from hardware/host clock pulses. Don't confuse these.
const KEYBOARD_IRQ: number = 1;

const PROG_BREAK_SINGLE_IRQ: number = 2; // IRQ for a BRK (0x00) instruction to stop the program

const MEM_EXCEPTION_IRQ: number = 3; // IRQ for a memory out of bounds error

const INVALID_OPCODE_IRQ: number = 4; // IRQ for invalid opcode

const SYSCALL_PRINT_INT_IRQ: number = 5; // IRQ for printing an integer

const SYSCALL_PRINT_STR_IRQ: number = 6; // IRQ for printing a string

const CALL_DISPATCHER_IRQ: number = 7; // IRQ for calling the dispatcher to do a context switch

const PROG_BREAK_ALL_IRQ: number = 8; // IRQ for calling a program break for all running programs


// Flag to determine if the next step should be executed
let _NextStepRequested: boolean = false;

//
// Global Variables
// TODO: Make a global object and use that instead of the "_" naming convention in the global namespace.
//
var _CPU: TSOS.Cpu;  // Utilize TypeScript's type annotation system to ensure that _CPU is an instance of the Cpu class.
var _Memory: TSOS.Memory; // Define the memory object
var _MemoryAccessor: TSOS.MemoryAccessor; // Define the memory access object

var _OSclock: number = 0;  // Page 23.

var _Mode: number = 0;     // (currently unused)  0 = Kernel Mode, 1 = User Mode.  See page 21.

var _Canvas: HTMLCanvasElement;          // Initialized in Control.hostInit().
var _DrawingContext: any;                // = _Canvas.getContext("2d");  // Assigned here for type safety, but re-initialized in Control.hostInit() for OCD and logic.
var _DefaultFontFamily: string = "sans"; // Ignored, I think. The was just a place-holder in 2008, but the HTML canvas may have use for it.
var _DefaultFontSize: number = 11;
var _FontHeightMargin: number = 3;       // Additional space added to font size when advancing a line.

var _Trace: boolean = true;              // Default the OS trace to be on.

// The OS Kernel and its queues.
var _Kernel: TSOS.Kernel;
var _KernelInterruptQueue: TSOS.Queue = null;
var _KernelInputQueue: TSOS.Queue = null; 
var _KernelBuffers = null;

// The memory manager and the PCB queue
var _MemoryManager: TSOS.MemoryManager = null;
var _PCBHistory: TSOS.ProcessControlBlock[] = [];
var _PCBReadyQueue: TSOS.Queue = null;

// Pairs for easily determining the base and limit registers
const _BaseLimitPairs: number[][] = [[0x0000, 0x0100], [0x0100, 0x0200], [0x0200, 0x0300]];

// Standard input and output
var _StdIn:  TSOS.Console = null; 
var _StdOut: TSOS.Console = null;

// UI
var _Console: TSOS.Console;
var _OsShell: TSOS.Shell;

// At least this OS is not trying to kill you. (Yet.)
var _SarcasticMode: boolean = false;

// Global Device Driver Objects - page 12
var _krnKeyboardDriver: TSOS.DeviceDriverKeyboard = null;
var _krnDiskSystemDeviceDriver: TSOS.DiskSystemDeviceDriver = null;

// 4 total tracks
const NUM_TRACKS = 4;

// 8 sectors per track
const NUM_SECTORS = 8;

// 8 blocks per sector
const NUM_BLOCKS = 8;

// 64 byte blocks
const BLOCK_SIZE = 64;

var _hardwareClockID: number = null;

// Delcare the variables for the scheduler and dispatcher
var _Scheduler: TSOS.Scheduler = null;
var _Dispatcher: TSOS.Dispatcher = null;

// The default quantum is 6 CPU cycles
const DEFAULT_QUANTUM: number = 6;

// For testing (and enrichment)...
var Glados: any = null;  // This is the function Glados() in glados-ip*.js http://alanclasses.github.io/TSOS/test/ .
var _GLaDOS: any = null; // If the above is linked in, this is the instantiated instance of Glados.

var onDocumentLoad = function() {
	TSOS.Control.hostInit();
};
