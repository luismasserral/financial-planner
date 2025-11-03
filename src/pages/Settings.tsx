import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency } from '../lib/utils';

export function Settings() {
  const { data, updateData } = useFinancial();
  const [startingBalance, setStartingBalance] = useState(
    data.settings.startingBalance.toString()
  );
  const [expensesDeviation, setExpensesDeviation] = useState(
    (data.settings.monthlyExpensesDeviation || 0).toString()
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(startingBalance);
    const deviation = parseFloat(expensesDeviation);
    if (isNaN(balance) || isNaN(deviation)) return;

    updateData({
      ...data,
      settings: {
        ...data.settings,
        startingBalance: balance,
        monthlyExpensesDeviation: deviation,
      },
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Monthly Expenses Deviation */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses Deviation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Add a percentage to account for unexpected or untracked monthly expenses. This helps
              create more realistic financial projections.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Deviation Percentage (%)"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={expensesDeviation}
                onChange={(e) => setExpensesDeviation(e.target.value)}
                placeholder="0"
                required
              />
              <div className="flex items-center gap-4">
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
                {isSaved && <span className="text-green-600 font-medium">Saved successfully!</span>}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right Column - Starting Balance */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Starting Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Set your current bank account balance. This will be used as the starting point for
                financial projections.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Current Balance (€)"
                  type="number"
                  step="0.01"
                  value={startingBalance}
                  onChange={(e) => setStartingBalance(e.target.value)}
                  placeholder="0.00"
                  required
                />
                <div className="flex items-center gap-4">
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                  {isSaved && <span className="text-green-600 font-medium">Saved successfully!</span>}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Starting Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(data.settings.startingBalance)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
