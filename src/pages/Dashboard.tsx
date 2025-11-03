import { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { MonthPicker } from '../components/ui/MonthPicker';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency } from '../lib/utils';

// Helper function to calculate projection for a specific date
function calculateMonthlyProjectionForDate(data: any, targetDate: Date) {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  // Filter recurring income by date range
  const totalIncome = data.recurringIncome
    .filter((item: any) => {
      if (!item.startDate && !item.endDate) return true;

      if (item.startDate) {
        const startDate = new Date(item.startDate);
        if (monthEnd < startDate) return false;
      }

      if (item.endDate) {
        const endDate = new Date(item.endDate);
        if (monthStart > endDate) return false;
      }

      return true;
    })
    .reduce((sum: number, item: any) => sum + item.amount, 0);

  // Filter recurring expenses by date range
  const baseExpenses = data.recurringExpenses
    .filter((item: any) => {
      if (!item.startDate && !item.endDate) return true;

      if (item.startDate) {
        const startDate = new Date(item.startDate);
        if (monthEnd < startDate) return false;
      }

      if (item.endDate) {
        const endDate = new Date(item.endDate);
        if (monthStart > endDate) return false;
      }

      return true;
    })
    .reduce((sum: number, item: any) => sum + item.amount, 0);

  // Apply deviation percentage
  const deviationMultiplier = 1 + (data.settings.monthlyExpensesDeviation || 0) / 100;
  const totalExpenses = baseExpenses * deviationMultiplier;

  // Get house sale information
  const houseSaleDate = data.sellingHouse?.sellingDate
    ? new Date(data.sellingHouse.sellingDate)
    : null;
  const cancelledLoanIds = new Set(data.sellingHouse?.selectedLoanIds || []);

  // Calculate loan payments for this month
  // Exclude cancelled loans if target date is on or after house sale date
  let totalLoanPayments = 0;
  data.loans.forEach((loan: any) => {
    const isLoanCancelled =
      houseSaleDate && targetDate >= houseSaleDate && cancelledLoanIds.has(loan.id);
    if (!isLoanCancelled) {
      totalLoanPayments += loan.monthlyPayment;
    }
  });

  return {
    totalIncome,
    totalExpenses,
    totalLoanPayments,
    monthlyResult: totalIncome - totalExpenses - totalLoanPayments,
  };
}

export function Dashboard() {
  const { data, updateData } = useFinancial();
  const [selectedDate, setSelectedDate] = useState(() => {
    // Load from saved settings if available
    if (data.settings.dashboardDate) {
      return new Date(data.settings.dashboardDate);
    }
    // Default to current date
    return new Date();
  });

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // Save to settings
    updateData({
      ...data,
      settings: {
        ...data.settings,
        dashboardDate: date.toISOString(),
      },
    });
  };

  const projection = calculateMonthlyProjectionForDate(data, selectedDate);

  const totalIncome = projection.totalIncome;
  const totalExpenses = projection.totalExpenses;
  const totalLoanPayments = projection.totalLoanPayments;
  const monthlyResult = projection.monthlyResult;

  const stats = [
    {
      title: 'Monthly Income',
      value: totalIncome,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Monthly Expenses',
      value: totalExpenses,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Loan Payments',
      value: totalLoanPayments,
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Starting Balance',
      value: data.settings.startingBalance,
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  return (
    <div>
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mr-4">Financial Dashboard</h1>
        <MonthPicker value={selectedDate} onChange={handleDateChange} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {formatCurrency(stat.value)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Projection and Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Month Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Total Recurring Income</span>
                <span className="text-lg font-semibold text-green-600">
                  +{formatCurrency(totalIncome)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Total Recurring Expenses</span>
                <span className="text-lg font-semibold text-red-600">
                  -{formatCurrency(totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Total Loan Payments</span>
                <span className="text-lg font-semibold text-orange-600">
                  -{formatCurrency(totalLoanPayments)}
                </span>
              </div>
              <div className="flex justify-between items-center py-4 bg-gray-50 rounded-lg px-4 mt-4">
                <span className="text-lg font-semibold text-gray-900">Monthly Net Result</span>
                <span
                  className={`text-2xl font-bold ${
                    monthlyResult >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(monthlyResult)}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>What this means:</strong> Every month, based on your recurring income and
                expenses, you will have {monthlyResult >= 0 ? 'a surplus' : 'a deficit'} of{' '}
                <span className={monthlyResult >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(Math.abs(monthlyResult))}
                </span>
                . This does not include one-off income or expenses.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recurringExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recurring expenses added yet</p>
            ) : (
              <div className="space-y-2">
                {data.recurringExpenses
                  .filter((item) => {
                    const year = selectedDate.getFullYear();
                    const month = selectedDate.getMonth();
                    const monthStart = new Date(year, month, 1);
                    const monthEnd = new Date(year, month + 1, 0);

                    if (!item.startDate && !item.endDate) return true;

                    if (item.startDate) {
                      const startDate = new Date(item.startDate);
                      if (monthEnd < startDate) return false;
                    }

                    if (item.endDate) {
                      const endDate = new Date(item.endDate);
                      if (monthStart > endDate) return false;
                    }

                    return true;
                  })
                  .sort((a, b) => b.amount - a.amount)
                  .map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="text-gray-700">{item.title}</span>
                      <span className="font-semibold text-red-600">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recurringIncome.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recurring income added yet</p>
            ) : (
              <div className="space-y-2">
                {data.recurringIncome
                  .filter((item) => {
                    const year = selectedDate.getFullYear();
                    const month = selectedDate.getMonth();
                    const monthStart = new Date(year, month, 1);
                    const monthEnd = new Date(year, month + 1, 0);

                    if (!item.startDate && !item.endDate) return true;

                    if (item.startDate) {
                      const startDate = new Date(item.startDate);
                      if (monthEnd < startDate) return false;
                    }

                    if (item.endDate) {
                      const endDate = new Date(item.endDate);
                      if (monthStart > endDate) return false;
                    }

                    return true;
                  })
                  .map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span className="text-gray-700">{item.title}</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
