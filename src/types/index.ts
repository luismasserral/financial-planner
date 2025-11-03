export interface RecurringIncome {
  id: string;
  title: string;
  amount: number;
  startDate?: string;
  endDate?: string;
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  startDate?: string;
  endDate?: string;
}

export interface Loan {
  id: string;
  title: string;
  outstandingBalance: number;
  maturityDate: string;
  monthlyPayment: number;
  interestRate: number; // Annual interest rate as percentage
  startDate: string;
}

export interface OneOffExpense {
  id: string;
  title: string;
  amount: number;
  date: string;
}

export interface OneOffIncome {
  id: string;
  title: string;
  amount: number;
  date: string;
  isFromHouseSale?: boolean; // Marks income generated from house sale
}

export interface SellingHouseData {
  saleAmount: number;
  selectedLoanIds: string[];
  sellingDate?: string;
}

export interface Settings {
  startingBalance: number;
  progressTrackingDate?: string;
  dashboardDate?: string;
  monthlyExpensesDeviation?: number; // Percentage (e.g., 10 for 10%)
}

export interface FinancialData {
  recurringIncome: RecurringIncome[];
  recurringExpenses: RecurringExpense[];
  loans: Loan[];
  oneOffExpenses: OneOffExpense[];
  oneOffIncome: OneOffIncome[];
  settings: Settings;
  sellingHouse?: SellingHouseData;
}

export interface MonthlyProjection {
  month: string;
  startingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  loanPayments: number;
  oneOffIncome: number;
  oneOffExpenses: number;
  endingBalance: number;
}
