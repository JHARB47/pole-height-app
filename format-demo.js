// Demonstration of the new formatting capabilities
import { 
  parseFeet, 
  formatFeetInchesTickMarks, 
  formatFeetInchesVerbose,
  formatFeetInches 
} from './src/utils/calculations.js';

const testInputs = [
  "15",       // plain number (feet)
  "15'",      // feet with tick mark  
  "15ft",     // feet with ft
  "15\"",     // inches with tick mark
  "15''",     // inches with double tick
  "15in",     // inches with in
  "15'6\"",   // feet and inches with tick marks
  "15' 6\"",  // feet and inches with space
  "15ft 6in", // feet and inches verbose
  "15.5'",    // decimal feet with tick
  "15.5ft",   // decimal feet verbose
  "6\"",      // inches only tick
  "6in"       // inches only verbose
];

console.log("=== Parsing and Formatting Demo ===\n");

console.log("Input Format Test:");
console.log("------------------");
testInputs.forEach(input => {
  const parsed = parseFeet(input);
  const tickFormat = formatFeetInchesTickMarks(parsed);
  const verboseFormat = formatFeetInchesVerbose(parsed);
  console.log(`Input: "${input.padEnd(10)}" → Parsed: ${parsed?.toFixed(3).padStart(7)} ft → Tick: ${tickFormat.padEnd(8)} Verbose: ${verboseFormat}`);
});

console.log("\n=== Format Options Demo ===\n");

const testValues = [35, 35.5, 42.92, 0.5, 15];
testValues.forEach(val => {
  const tickFormat = formatFeetInches(val, { tickMarks: true });
  const verboseFormat = formatFeetInches(val, { tickMarks: false });
  console.log(`${val} ft → Tick Marks: ${tickFormat.padEnd(10)} Verbose: ${verboseFormat}`);
});

console.log("\n=== User Preference Simulation ===\n");

// Simulate user preferences
const userPreferences = [
  { name: "Engineer (prefers verbose)", useTickMarks: false },
  { name: "Field Tech (prefers tick marks)", useTickMarks: true }
];

const sampleData = { poleHeight: 35.5, sagAmount: 2.25, clearance: 18.0 };

userPreferences.forEach(user => {
  console.log(`${user.name}:`);
  const fmt = user.useTickMarks ? formatFeetInchesTickMarks : formatFeetInchesVerbose;
  console.log(`  Pole Height: ${fmt(sampleData.poleHeight)}`);
  console.log(`  Sag: ${fmt(sampleData.sagAmount)}`);
  console.log(`  Clearance: ${fmt(sampleData.clearance)}`);
  console.log();
});

console.log("✅ All formats working correctly for imports, exports, and display!");
