export interface RecurringIncome {
  id: string;
  title: string;
  amount: number;
  startDate?: string;
  endDate?: string;
  iva?: number; // IVA percentage (e.g., 21 for 21%)
  irpf?: number; // IRPF percentage (e.g., 15 for 15%)
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  startDate?: string;
  endDate?: string;
  isProfessional?: boolean; // Whether this expense is tax-deductible
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
  iva?: number; // IVA percentage (e.g., 21 for 21%)
  irpf?: number; // IRPF percentage (e.g., 15 for 15%)
}

export interface SellingHouseData {
  saleAmount: number;
  selectedLoanIds: string[];
  sellingDate?: string;
}

export interface IRPFBracket {
  id: string;
  fromAmount: number;
  toAmount: number | null; // null means infinity
  rate: number; // Percentage (e.g., 19 for 19%)
}

export interface Settings {
  startingBalance: number;
  progressTrackingDate?: string;
  dashboardDate?: string;
  monthlyExpensesDeviation?: number; // Percentage (e.g., 10 for 10%)
  irpfBrackets?: IRPFBracket[];
  isFreelanceMode?: boolean; // When false, no IRPF, IVA, or Renta calculations
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
  irpfQuarterly: number;
  ivaPayment: number;
  rentaPayment: number;
  endingBalance: number;
}
