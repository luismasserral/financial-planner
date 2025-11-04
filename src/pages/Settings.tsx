import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency } from '../lib/utils';

export function Settings() {
  const { data, updateData } = useFinancial();
  const [startingBalance, setStartingBalance] = useState(data.settings.startingBalance.toString());
  const [expensesDeviation, setExpensesDeviation] = useState(
    (data.settings.monthlyExpensesDeviation || 0).toString()
  );
  const [isFreelanceMode, setIsFreelanceMode] = useState(
    data.settings.isFreelanceMode !== false // Default to true for backwards compatibility
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
        isFreelanceMode,
      },
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Account Type and Monthly Expenses Deviation */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Type</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Choose whether you are a freelancer or not. In non-freelance mode, no IRPF, IVA, or
                Renta taxes will be calculated.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="freelanceMode"
                    checked={isFreelanceMode}
                    onChange={(e) => setIsFreelanceMode(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="freelanceMode" className="text-sm font-medium text-gray-700">
                    Freelance mode (includes IRPF, IVA, and Renta calculations)
                  </label>
                </div>
                <div className="flex items-center gap-4">
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                  {isSaved && (
                    <span className="text-green-600 font-medium">Saved successfully!</span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

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
                  {isSaved && (
                    <span className="text-green-600 font-medium">Saved successfully!</span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

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
                  {isSaved && (
                    <span className="text-green-600 font-medium">Saved successfully!</span>
                  )}
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
