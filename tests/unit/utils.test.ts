/**
 * Unit tests for lib/utils.ts
 * Run: npx tsx tests/unit/utils.test.ts
 */
import { calcGradeTotal, getLetterGrade, calcAttendance, genStudentNo, fCurrency } from '../../lib/utils';

function assert(label: string, condition: boolean) {
  if (condition) { console.log(`✅ ${label}`); }
  else           { console.error(`❌ FAIL: ${label}`); process.exit(1); }
}

// Grade calculation
const g1 = calcGradeTotal({ participation: 10, assignments: 10, midterm: 30, final: 50 });
assert('Perfect score = 100', g1 === 100);

const g2 = calcGradeTotal({ participation: 8, assignments: 7, midterm: 22, final: 40 });
assert('Mixed score calculated correctly', g2 === 75.2);

assert('A+ for 95+',  getLetterGrade(96).letter === 'A+');
assert('A for 90-94', getLetterGrade(92).letter === 'A');
assert('B+ for 85-89',getLetterGrade(87).letter === 'B+');
assert('F for < 60',  getLetterGrade(45).letter === 'F');
assert('A+ has 4.0 GPA points', getLetterGrade(96).points === 4.0);
assert('F has 0.0 GPA points',  getLetterGrade(45).points === 0.0);

// Attendance
const records = [
  { status: 'present' }, { status: 'present' }, { status: 'absent' },
  { status: 'late' },    { status: 'excused' },
];
const att = calcAttendance(records);
assert('Attendance total = 5',      att.total === 5);
assert('Attendance attended = 3',   att.attended === 3);
assert('Attendance excused = 1',    att.excused === 1);
assert('Attendance rate = 75%',     att.rate === 75);
assert('isAtRisk = false at 75%',   att.isAtRisk === false);

const lowAtt = calcAttendance([{ status: 'absent' }, { status: 'absent' }, { status: 'present' }]);
assert('Low attendance isAtRisk',   lowAtt.isAtRisk === true);

// Student number
assert('Student number format', genStudentNo(2025, 1) === 'KCST-2025-0001');
assert('Student number padding', genStudentNo(2024, 99) === 'KCST-2024-0099');

// Currency
assert('Currency format works', fCurrency(1500).includes('1500'));

console.log('\n✅ All unit tests passed!');
