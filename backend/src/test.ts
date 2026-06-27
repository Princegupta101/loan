// Unit tests for Loan Management System (LMS) BRE and Interest Math


const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

interface BREResult {
  eligible: boolean;
  reason?: string;
}

const runBRE = (personalDetails: {
  age: number;
  monthlySalary: number;
  panNumber: string;
  employmentStatus: string;
}): BREResult => {
  const { age, monthlySalary, panNumber, employmentStatus } = personalDetails;

  if (age < 23 || age > 50) {
    return { eligible: false, reason: `Age must be between 23 and 50. Provided: ${age}` };
  }
  if (monthlySalary < 25000) {
    return { eligible: false, reason: `Monthly salary must be at least 25,000. Provided: ${monthlySalary}` };
  }
  if (!PAN_REGEX.test(panNumber.toUpperCase())) {
    return { eligible: false, reason: `Invalid PAN format. Provided: ${panNumber}` };
  }
  if (employmentStatus !== 'Salaried') {
    return { eligible: false, reason: `Employment status must be Salaried. Provided: ${employmentStatus}` };
  }
  return { eligible: true };
};

const calculateLoanMath = (amount: number, tenureDays: number) => {
  const interestRate = 12; // 12% p.a.
  const interestAmount = Number((amount * (interestRate / 100) * (tenureDays / 365)).toFixed(2));
  const totalRepayment = Number((amount + interestAmount).toFixed(2));

  return {
    amount,
    tenureDays,
    interestRate,
    interestAmount,
    totalRepayment
  };
};

// Assert Helper
const assert = (condition: boolean, message: string) => {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ TEST PASSED: ${message}`);
  }
};

const runTests = () => {
  console.log('--- STARTING PROGRAMMATIC UNIT TESTS ---');

  // Test 1: Simple Interest Math Verification
  // Principal: 100,000, Tenure: 180 Days, Rate: 12% p.a.
  // Interest = 100,000 * 0.12 * (180 / 365) = 5917.808...
  // Rounded interest: 5917.81
  // Total repayment: 105917.81
  const mathResult = calculateLoanMath(100000, 180);
  assert(mathResult.interestAmount === 5917.81, `Interest should be 5917.81, got ${mathResult.interestAmount}`);
  assert(mathResult.totalRepayment === 105917.81, `Total Repayment should be 105917.81, got ${mathResult.totalRepayment}`);

  // Test 2: BRE - Valid Borrower
  const breValid = runBRE({
    age: 30,
    monthlySalary: 35000,
    panNumber: 'ABCDE1234F',
    employmentStatus: 'Salaried'
  });
  assert(breValid.eligible === true, 'Valid user should be eligible');

  // Test 3: BRE - Invalid Age (Too young)
  const breYoung = runBRE({
    age: 20,
    monthlySalary: 35000,
    panNumber: 'ABCDE1234F',
    employmentStatus: 'Salaried'
  });
  assert(breYoung.eligible === false, 'Age 20 should be ineligible');

  // Test 4: BRE - Invalid Age (Too old)
  const breOld = runBRE({
    age: 52,
    monthlySalary: 35000,
    panNumber: 'ABCDE1234F',
    employmentStatus: 'Salaried'
  });
  assert(breOld.eligible === false, 'Age 52 should be ineligible');

  // Test 5: BRE - Invalid Salary
  const breLowSalary = runBRE({
    age: 30,
    monthlySalary: 20000,
    panNumber: 'ABCDE1234F',
    employmentStatus: 'Salaried'
  });
  assert(breLowSalary.eligible === false, 'Salary 20,000 should be ineligible');

  // Test 6: BRE - Invalid PAN Card Format
  const breBadPan = runBRE({
    age: 30,
    monthlySalary: 35000,
    panNumber: 'ABCD12345',
    employmentStatus: 'Salaried'
  });
  assert(breBadPan.eligible === false, 'PAN ABCD12345 should be ineligible');

  // Test 7: BRE - Invalid Employment Status
  const breSelfEmployed = runBRE({
    age: 30,
    monthlySalary: 35000,
    panNumber: 'ABCDE1234F',
    employmentStatus: 'Self-Employed'
  });
  assert(breSelfEmployed.eligible === false, 'Self-Employed borrower should be ineligible');

  console.log('--- ALL UNIT TESTS PASSED SUCCESSFULLY ---');
};

runTests();
