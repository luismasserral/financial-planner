import type {
  FinancialData,
  MonthlyProjection,
  Loan,
  OneOffExpense,
  OneOffIncome,
  RecurringIncome,
  RecurringExpense,
  IRPFBracket,
} from '../types';

// Calculate progressive IRPF tax based on annual income and tax brackets
function calculateProgressiveIRPF(annualIncome: number, brackets: IRPFBracket[]): number {
  if (brackets.length === 0 || annualIncome <= 0) return 0;

  // Sort brackets by fromAmount
  const sortedBrackets = [...brackets].sort((a, b) => a.fromAmount - b.fromAmount);

  let totalTax = 0;

  for (const bracket of sortedBrackets) {
    // Skip if we haven't reached this bracket yet
    if (annualIncome <= bracket.fromAmount) {
      break;
    }

    // Calculate the amount of income in this bracket
    const bracketStart = bracket.fromAmount;
    const bracketEnd = bracket.toAmount ?? Infinity;
    const bracketSize = Math.min(annualIncome, bracketEnd) - bracketStart;

    if (bracketSize > 0) {
      totalTax += bracketSize * (bracket.rate / 100);
    }
  }

  return totalTax;
}

// Calculate net income after IVA and IRPF
function calculateNetIncome(
  item: RecurringIncome | OneOffIncome,
  isFreelanceMode: boolean = true
): number {
  let netAmount = item.amount;
  if (isFreelanceMode) {
    if (item.iva) {
      netAmount += item.amount * (item.iva / 100);
    }
    if (item.irpf) {
      netAmount -= item.amount * (item.irpf / 100);
    }
  }
  return netAmount;
}

function isRecurringItemActiveForMonth(
  item: RecurringIncome | RecurringExpense,
  currentDate: Date
): boolean {
  // If no dates specified, always active
  if (!item.startDate && !item.endDate) {
    return true;
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  // Check start date
  if (item.startDate) {
    const startDate = new Date(item.startDate);
    if (monthEnd < startDate) {
      return false;
    }
  }

  // Check end date
  if (item.endDate) {
    const endDate = new Date(item.endDate);
    if (monthStart > endDate) {
      return false;
    }
  }

  return true;
}

export function calculateMonthlyResult(data: FinancialData): number {
  const currentDate = new Date();
  const isFreelanceMode = data.settings.isFreelanceMode !== false; // Default to true
  const totalIncome = data.recurringIncome
    .filter((item) => isRecurringItemActiveForMonth(item, currentDate))
    .reduce((sum, item) => sum + calculateNetIncome(item, isFreelanceMode), 0);
  const baseExpenses = data.recurringExpenses
    .filter((item) => isRecurringItemActiveForMonth(item, currentDate))
    .reduce((sum, item) => sum + item.amount, 0);

  // Apply deviation percentage
  const deviationMultiplier = 1 + (data.settings.monthlyExpensesDeviation || 0) / 100;
  const totalExpenses = baseExpenses * deviationMultiplier;

  const totalLoanPayments = data.loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);

  return totalIncome - totalExpenses - totalLoanPayments;
}

function calculateLoanBalance(
  loan: Loan,
  currentDate: Date
): { balance: number; monthlyPayment: number } {
  const startDate = new Date(loan.startDate);
  const maturityDate = new Date(loan.maturityDate);

  // If we haven't started yet
  if (currentDate < startDate) {
    return { balance: loan.outstandingBalance, monthlyPayment: 0 };
  }

  // If loan is already matured
  if (currentDate >= maturityDate) {
    return { balance: 0, monthlyPayment: 0 };
  }

  // Calculate months elapsed since start
  const monthsElapsed =
    (currentDate.getFullYear() - startDate.getFullYear()) * 12 +
    (currentDate.getMonth() - startDate.getMonth());

  // Calculate remaining balance with compound interest
  const monthlyRate = loan.interestRate / 100 / 12;
  let balance = loan.outstandingBalance;

  for (let i = 0; i < monthsElapsed; i++) {
    // Add interest
    balance += balance * monthlyRate;
    // Subtract payment
    balance -= loan.monthlyPayment;
    // Ensure balance doesn't go negative
    if (balance < 0) balance = 0;
  }

  return { balance, monthlyPayment: loan.monthlyPayment };
}

function getOneOffItemsForMonth(
  items: (OneOffExpense | OneOffIncome)[],
  year: number,
  month: number,
  isIncome: boolean = false,
  isFreelanceMode: boolean = true
): number {
  return items
    .filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month;
    })
    .reduce((sum, item) => {
      if (isIncome && 'iva' in item) {
        return sum + calculateNetIncome(item as OneOffIncome, isFreelanceMode);
      }
      return sum + item.amount;
    }, 0);
}

export function calculateProjections(data: FinancialData, maxDate: Date): MonthlyProjection[] {
  const projections: MonthlyProjection[] = [];
  const startDate = new Date();
  startDate.setDate(1); // Start from first of current month

  let currentBalance = data.settings.startingBalance;
  const currentDate = new Date(startDate);

  // Get house sale information
  const houseSaleDate = data.sellingHouse?.sellingDate
    ? new Date(data.sellingHouse.sellingDate)
    : null;
  const cancelledLoanIds = new Set(data.sellingHouse?.selectedLoanIds || []);

  // Get deviation percentage
  const deviationMultiplier = 1 + (data.settings.monthlyExpensesDeviation || 0) / 100;

  // Get IRPF brackets and freelance mode
  const irpfBrackets = data.settings.irpfBrackets || [];
  const isFreelanceMode = data.settings.isFreelanceMode !== false; // Default to true

  // Calculate annual income and withholdings for each year to determine IRPF
  const annualDataByYear = new Map<
    number,
    { income: number; irpfWithheld: number; ivaCollected: number; professionalExpenses: number }
  >();
  const calculateAnnualData = (year: number) => {
    if (annualDataByYear.has(year)) {
      return annualDataByYear.get(year)!;
    }

    let yearlyIncome = 0;
    let yearlyIRPFWithheld = 0;
    let yearlyIVACollected = 0;
    let yearlyProfessionalExpenses = 0;

    // Add all months of recurring income for this year
    for (let m = 0; m < 12; m++) {
      const testDate = new Date(year, m, 1);
      data.recurringIncome
        .filter((item) => isRecurringItemActiveForMonth(item, testDate))
        .forEach((item) => {
          // For IRPF calculation, use base amount before IVA/IRPF withholding
          yearlyIncome += item.amount;
          // Track IRPF already withheld
          if (item.irpf) {
            yearlyIRPFWithheld += item.amount * (item.irpf / 100);
          }
          // Track IVA collected
          if (item.iva) {
            yearlyIVACollected += item.amount * (item.iva / 100);
          }
        });

      // Add professional expenses for this month
      data.recurringExpenses
        .filter((item) => item.isProfessional && isRecurringItemActiveForMonth(item, testDate))
        .forEach((item) => {
          yearlyProfessionalExpenses += item.amount;
        });
    }

    // Note: One-off income is NOT included in tax calculations
    // as it's not related to professional/job income

    const result = {
      income: yearlyIncome,
      irpfWithheld: yearlyIRPFWithheld,
      ivaCollected: yearlyIVACollected,
      professionalExpenses: yearlyProfessionalExpenses,
    };
    annualDataByYear.set(year, result);
    return result;
  };

  while (currentDate <= maxDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Calculate recurring income and expenses (with date filtering)
    const totalIncome = data.recurringIncome
      .filter((item) => isRecurringItemActiveForMonth(item, currentDate))
      .reduce((sum, item) => sum + calculateNetIncome(item, isFreelanceMode), 0);
    const baseExpenses = data.recurringExpenses
      .filter((item) => isRecurringItemActiveForMonth(item, currentDate))
      .reduce((sum, item) => sum + item.amount, 0);

    // Apply fixed deviation percentage
    const totalExpenses = baseExpenses * deviationMultiplier;

    // Calculate loan payments for this month
    // Exclude cancelled loans if current date is on or after house sale date
    let loanPayments = 0;
    data.loans.forEach((loan) => {
      const isLoanCancelled =
        houseSaleDate && currentDate >= houseSaleDate && cancelledLoanIds.has(loan.id);
      if (!isLoanCancelled) {
        const { monthlyPayment } = calculateLoanBalance(loan, currentDate);
        loanPayments += monthlyPayment;
      }
    });

    // Calculate one-off items for this month (with net income for income items)
    const oneOffIncome = getOneOffItemsForMonth(
      data.oneOffIncome,
      year,
      month,
      true,
      isFreelanceMode
    );
    const oneOffExpenses = getOneOffItemsForMonth(
      data.oneOffExpenses,
      year,
      month,
      false,
      isFreelanceMode
    );

    // Calculate quarterly IRPF and IVA payments (paid on 20th of Jan, Apr, Jul, Oct)
    // And annual Renta payment (paid on 31st of July)
    let quarterlyIRPF = 0;
    let quarterlyIVA = 0;
    let annualRenta = 0;

    // Only calculate taxes in freelance mode
    if (isFreelanceMode) {
      // Check if this month has a quarterly payment (January, April, July, October)
      // Payment on 20th covers the previous quarter
      if ([0, 3, 6, 9].includes(month)) {
        // Jan=0, Apr=3, Jul=6, Oct=9
        // Calculate which quarter we're paying for
        const paymentYear = month === 0 ? year - 1 : year; // January pays for previous year's Q4
        const quarterStartMonth = month === 0 ? 9 : month - 3; // Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec

        // Calculate income and professional expenses for the quarter being paid
        // Note: Only recurring income is included, not one-off income
        let quarterIncome = 0;
        let quarterIVA = 0;
        let quarterProfessionalExpenses = 0;
        for (let m = quarterStartMonth; m < quarterStartMonth + 3; m++) {
          const testDate = new Date(paymentYear, m, 1);
          data.recurringIncome
            .filter((item) => isRecurringItemActiveForMonth(item, testDate))
            .forEach((item) => {
              quarterIncome += item.amount;
              if (item.iva) {
                quarterIVA += item.amount * (item.iva / 100);
              }
            });
          // Add professional expenses for this month
          data.recurringExpenses
            .filter((item) => item.isProfessional && isRecurringItemActiveForMonth(item, testDate))
            .forEach((item) => {
              quarterProfessionalExpenses += item.amount;
            });
        }

        // IRPF: Pay 20% of net quarter income (income - professional expenses) as advance payment
        const netQuarterIncome = Math.max(0, quarterIncome - quarterProfessionalExpenses);
        quarterlyIRPF = netQuarterIncome * 0.2;

        // IVA: Return all IVA collected in the quarter
        quarterlyIVA = quarterIVA;
      }

      // Check if this is July (month = 6) for annual Renta payment on July 31st
      if (month === 6) {
        // Calculate for the previous full year
        const previousYear = year - 1;
        const prevYearData = calculateAnnualData(previousYear);
        // Calculate IRPF on net income (income - professional expenses)
        const netTaxableIncome = Math.max(
          0,
          prevYearData.income - prevYearData.professionalExpenses
        );
        const annualIRPFTotal = calculateProgressiveIRPF(netTaxableIncome, irpfBrackets);

        // Calculate actual advance payments made during the previous year
        // by simulating what would have been paid each quarter
        // For year 2025, we need to include:
        // - April 2025 pays for Q1 2025 (Jan-Mar 2025)
        // - July 2025 pays for Q2 2025 (Apr-Jun 2025)
        // - October 2025 pays for Q3 2025 (Jul-Sep 2025)
        // - January 2026 pays for Q4 2025 (Oct-Dec 2025)
        let actualAdvancePayments = 0;

        const quarters = [
          { quarterMonths: [0, 1, 2], paymentYear: previousYear }, // Q1: Jan-Mar (paid April)
          { quarterMonths: [3, 4, 5], paymentYear: previousYear }, // Q2: Apr-Jun (paid July)
          { quarterMonths: [6, 7, 8], paymentYear: previousYear }, // Q3: Jul-Sep (paid October)
          { quarterMonths: [9, 10, 11], paymentYear: previousYear }, // Q4: Oct-Dec (paid January next year)
        ];

        for (const quarter of quarters) {
          let quarterIncome = 0;
          let quarterProfessionalExpenses = 0;
          for (const m of quarter.quarterMonths) {
            const testDate = new Date(quarter.paymentYear, m, 1);
            data.recurringIncome
              .filter((item) => isRecurringItemActiveForMonth(item, testDate))
              .forEach((item) => {
                quarterIncome += item.amount;
              });
            data.recurringExpenses
              .filter(
                (item) => item.isProfessional && isRecurringItemActiveForMonth(item, testDate)
              )
              .forEach((item) => {
                quarterProfessionalExpenses += item.amount;
              });
          }
          const netQuarterIncome = Math.max(0, quarterIncome - quarterProfessionalExpenses);
          actualAdvancePayments += netQuarterIncome * 0.2;
        }

        // Renta = Total IRPF - Advance payments - Already withheld IRPF
        annualRenta = Math.max(
          0,
          annualIRPFTotal - actualAdvancePayments - prevYearData.irpfWithheld
        );

        // Debug logging
        console.log(`=== Renta Calculation for ${year}-07 (previous year: ${previousYear}) ===`);
        console.log(`Previous year income: ${prevYearData.income}`);
        console.log(`Previous year professional expenses: ${prevYearData.professionalExpenses}`);
        console.log(`Net taxable income: ${netTaxableIncome}`);
        console.log(`Previous year IRPF withheld: ${prevYearData.irpfWithheld}`);
        console.log(`Annual IRPF Total (from brackets): ${annualIRPFTotal}`);
        console.log(`Actual advance payments (quarterly 20%): ${actualAdvancePayments}`);
        console.log(`Calculated Renta: ${annualRenta}`);
      }
    } // End of isFreelanceMode check

    // Calculate ending balance
    const endingBalance =
      currentBalance +
      totalIncome +
      oneOffIncome -
      totalExpenses -
      oneOffExpenses -
      loanPayments -
      quarterlyIRPF -
      quarterlyIVA -
      annualRenta;

    projections.push({
      month: currentDate.toISOString().slice(0, 7),
      startingBalance: currentBalance,
      totalIncome,
      totalExpenses,
      loanPayments,
      oneOffIncome,
      oneOffExpenses,
      irpfQuarterly: quarterlyIRPF,
      ivaPayment: quarterlyIVA,
      rentaPayment: annualRenta,
      endingBalance,
    });

    currentBalance = endingBalance;

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return projections;
}

export function getLoanDetails(loan: Loan, currentDate: Date = new Date()) {
  const { balance, monthlyPayment } = calculateLoanBalance(loan, currentDate);
  const maturityDate = new Date(loan.maturityDate);
  const monthsRemaining = Math.max(
    0,
    (maturityDate.getFullYear() - currentDate.getFullYear()) * 12 +
      (maturityDate.getMonth() - currentDate.getMonth())
  );

  return {
    currentBalance: balance,
    monthlyPayment,
    monthsRemaining,
    totalRemaining: monthlyPayment * monthsRemaining,
  };
}
