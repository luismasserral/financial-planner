import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { DatePicker } from '../components/ui/DatePicker';
import { useFinancial } from '../context/FinancialContext';
import { calculateProjections } from '../lib/calculations';
import { formatCurrency, formatCompactCurrency } from '../lib/utils';

export function ProgressTracking() {
  const { data, updateData } = useFinancial();
  const [maxDate, setMaxDate] = useState(() => {
    // Load from saved settings if available
    if (data.settings.progressTrackingDate) {
      return new Date(data.settings.progressTrackingDate);
    }
    // Default to 12 months from now
    const date = new Date();
    date.setMonth(date.getMonth() + 12);
    return date;
  });

  const handleDateChange = (date: Date) => {
    setMaxDate(date);
    // Save to settings
    updateData({
      ...data,
      settings: {
        ...data.settings,
        progressTrackingDate: date.toISOString(),
      },
    });
  };

  const projections = calculateProjections(data, maxDate);

  const chartData = projections.map((proj) => ({
    month: proj.month,
    balance: proj.endingBalance,
    income: proj.totalIncome,
    expenses:
      proj.totalExpenses +
      proj.loanPayments +
      proj.irpfQuarterly +
      proj.ivaPayment +
      proj.rentaPayment,
    irpfQuarterly: proj.irpfQuarterly,
    ivaPayment: proj.ivaPayment,
    rentaPayment: proj.rentaPayment,
  }));

  return (
    <div>
      <div className="mb-6 flex gap-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Financial Progress Tracking</h1>
        <DatePicker value={maxDate} onChange={handleDateChange} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Starting Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.settings.startingBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Projected Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                projections[projections.length - 1]?.endingBalance >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatCurrency(projections[projections.length - 1]?.endingBalance || 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total IRPF Taxes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(
                projections.reduce((sum, proj) => sum + proj.irpfQuarterly + proj.rentaPayment, 0)
              )}
            </p>
            <p className="text-sm text-gray-600 mt-1">Quarterly + Annual Renta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total IVA Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(projections.reduce((sum, proj) => sum + proj.ivaPayment, 0))}
            </p>
            <p className="text-sm text-gray-600 mt-1">Quarterly returns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Change</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                (projections[projections.length - 1]?.endingBalance || 0) -
                  data.settings.startingBalance >=
                0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {formatCurrency(
                (projections[projections.length - 1]?.endingBalance || 0) -
                  data.settings.startingBalance
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCompactCurrency(value)} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Income"
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance Evolution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => formatCompactCurrency(value)} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Bar dataKey="balance" fill="#3b82f6" name="Balance" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Month</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Starting Balance
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Income</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Expenses</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Loan Payments
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    IRPF (Quarterly)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    IVA (Quarterly)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Renta (Annual)
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    One-off Income
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    One-off Expenses
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Ending Balance
                  </th>
                </tr>
              </thead>
              <tbody>
                {projections.map((proj, index) => (
                  <tr key={proj.month} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-3 px-4 font-medium">{proj.month}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(proj.startingBalance)}</td>
                    <td className="text-right py-3 px-4 text-green-600">
                      {formatCurrency(proj.totalIncome)}
                    </td>
                    <td className="text-right py-3 px-4 text-red-600">
                      {formatCurrency(proj.totalExpenses)}
                    </td>
                    <td className="text-right py-3 px-4 text-orange-600">
                      {formatCurrency(proj.loanPayments)}
                    </td>
                    <td className="text-right py-3 px-4 text-purple-600">
                      {proj.irpfQuarterly > 0 ? formatCurrency(proj.irpfQuarterly) : '-'}
                    </td>
                    <td className="text-right py-3 px-4 text-purple-600">
                      {proj.ivaPayment > 0 ? formatCurrency(proj.ivaPayment) : '-'}
                    </td>
                    <td className="text-right py-3 px-4 text-purple-600">
                      {proj.rentaPayment > 0 ? formatCurrency(proj.rentaPayment) : '-'}
                    </td>
                    <td className="text-right py-3 px-4 text-green-600">
                      {proj.oneOffIncome > 0 ? formatCurrency(proj.oneOffIncome) : '-'}
                    </td>
                    <td className="text-right py-3 px-4 text-red-600">
                      {proj.oneOffExpenses > 0 ? formatCurrency(proj.oneOffExpenses) : '-'}
                    </td>
                    <td
                      className={`text-right py-3 px-4 font-semibold ${
                        proj.endingBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(proj.endingBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
