import { getDailyDateKey } from '../src/lib/dailyDataAccess.js';

const now = new Date();
const key = getDailyDateKey(now);

console.log('--- Date Key Validation ---');
console.log('Current Date Object:', now.toString());
console.log('Generated Key:', key);

const expectedY = now.getFullYear();
const expectedM = String(now.getMonth() + 1).padStart(2, '0');
const expectedD = String(now.getDate()).padStart(2, '0');
const expectedKey = `${expectedY}-${expectedM}-${expectedD}`;

if (key === expectedKey) {
  console.log('Date Key: ✅ SUCCESS (Matched Local Time)');
} else {
  console.log('Date Key: ❌ FAILED (Expected ' + expectedKey + ', got ' + key + ')');
}
