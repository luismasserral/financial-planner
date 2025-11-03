import type {
  FinancialData,
  MonthlyProjection,
  Loan,
  OneOffExpense,
  OneOffIncome,
  RecurringIncome,
  RecurringExpense,
} from '../types';

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
  const totalIncome = data.recurringIncome
    .filter((item) => isRecurringItemActiveForMonth(item, currentDate))
    .reduce((sum, item) => sum + item.amount, 0);
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
  month: number
): number {
  return items
    .filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month;
    })
    .reduce((sum, item) => sum + item.amount, 0);
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

  while (currentDate <= maxDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Calculate recurring income and expenses (with date filtering)
    const totalIncome = data.recurringIncome
      .filter((item) => isRecurringItemActiveForMonth(item, currentDate))
      .reduce((sum, item) => sum + item.amount, 0);
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

    // Calculate one-off items for this month
    const oneOffIncome = getOneOffItemsForMonth(data.oneOffIncome, year, month);
    const oneOffExpenses = getOneOffItemsForMonth(data.oneOffExpenses, year, month);

    // Calculate ending balance
    const endingBalance =
      currentBalance + totalIncome + oneOffIncome - totalExpenses - oneOffExpenses - loanPayments;

    projections.push({
      month: currentDate.toISOString().slice(0, 7),
      startingBalance: currentBalance,
      totalIncome,
      totalExpenses,
      loanPayments,
      oneOffIncome,
      oneOffExpenses,
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
