import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Info, Calculator } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useFinancial } from '../context/FinancialContext';
import type { IRPFBracket } from '../types';
import { formatCurrency } from '../lib/utils';

export function IRPFSettings() {
  const { data, updateData } = useFinancial();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IRPFBracket | null>(null);
  const [formData, setFormData] = useState({ fromAmount: '', toAmount: '', rate: '' });
  const [calculatorIncome, setCalculatorIncome] = useState('');

  const irpfBrackets = data.settings.irpfBrackets || [];

  // Calculate progressive IRPF tax
  const calculateTaxBreakdown = (annualIncome: number) => {
    if (irpfBrackets.length === 0 || annualIncome <= 0) return { breakdown: [], total: 0, effectiveRate: 0 };

    const sortedBrackets = [...irpfBrackets].sort((a, b) => a.fromAmount - b.fromAmount);
    const breakdown: Array<{ bracket: IRPFBracket; incomeInBracket: number; tax: number }> = [];
    let totalTax = 0;

    for (const bracket of sortedBrackets) {
      if (annualIncome <= bracket.fromAmount) {
        break;
      }

      const bracketStart = bracket.fromAmount;
      const bracketEnd = bracket.toAmount ?? Infinity;
      const incomeInBracket = Math.min(annualIncome, bracketEnd) - bracketStart;

      if (incomeInBracket > 0) {
        const tax = incomeInBracket * (bracket.rate / 100);
        totalTax += tax;
        breakdown.push({ bracket, incomeInBracket, tax });
      }
    }

    const effectiveRate = (totalTax / annualIncome) * 100;
    return { breakdown, total: totalTax, effectiveRate };
  };

  const income = parseFloat(calculatorIncome) || 0;
  const taxResult = calculateTaxBreakdown(income);

  const handleOpenModal = (item?: IRPFBracket) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        fromAmount: item.fromAmount.toString(),
        toAmount: item.toAmount !== null ? item.toAmount.toString() : '',
        rate: item.rate.toString(),
      });
    } else {
      setEditingItem(null);
      setFormData({ fromAmount: '', toAmount: '', rate: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ fromAmount: '', toAmount: '', rate: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fromAmount = parseFloat(formData.fromAmount);
    const toAmount = formData.toAmount ? parseFloat(formData.toAmount) : null;
    const rate = parseFloat(formData.rate);

    if (isNaN(fromAmount) || isNaN(rate)) return;
    if (toAmount !== null && (isNaN(toAmount) || toAmount <= fromAmount)) {
      alert('To amount must be greater than from amount');
      return;
    }

    if (editingItem) {
      // Update existing
      const updatedBrackets = irpfBrackets.map((bracket) =>
        bracket.id === editingItem.id
          ? { ...bracket, fromAmount, toAmount, rate }
          : bracket
      );
      updateData({
        ...data,
        settings: { ...data.settings, irpfBrackets: updatedBrackets },
      });
    } else {
      // Add new
      const newBracket: IRPFBracket = {
        id: crypto.randomUUID(),
        fromAmount,
        toAmount,
        rate,
      };
      updateData({
        ...data,
        settings: {
          ...data.settings,
          irpfBrackets: [...irpfBrackets, newBracket],
        },
      });
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this tax bracket?')) {
      const updatedBrackets = irpfBrackets.filter((bracket) => bracket.id !== id);
      updateData({
        ...data,
        settings: { ...data.settings, irpfBrackets: updatedBrackets },
      });
    }
  };

  const sortedBrackets = [...irpfBrackets].sort((a, b) => a.fromAmount - b.fromAmount);

  const formatRange = (bracket: IRPFBracket) => {
    const from = formatCurrency(bracket.fromAmount);
    const to = bracket.toAmount !== null ? formatCurrency(bracket.toAmount) : '∞';
    return `${from} - ${to}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">IRPF Tax Settings</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Bracket
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <CardTitle>About IRPF Tax Brackets</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Configure your IRPF (Impuesto sobre la Renta de las Personas Físicas) tax brackets
                based on your annual income. These brackets will be used to calculate your effective
                tax rate for income projections.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Example:</strong> If you earn €25,000 per year with brackets of 19% (€0-€15,000)
                and 24% (€15,001-€30,000), you'll pay 19% on the first €15,000 and 24% on the remaining
                €10,000.
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Tax Calculator */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-600" />
              <CardTitle>IRPF Tax Calculator</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Input
                  label="Annual Income (€)"
                  type="number"
                  step="0.01"
                  min="0"
                  value={calculatorIncome}
                  onChange={(e) => setCalculatorIncome(e.target.value)}
                  placeholder="Enter your annual income"
                />
              </div>

              {income > 0 && irpfBrackets.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Tax Breakdown by Bracket</h3>
                    <div className="space-y-3">
                      {taxResult.breakdown.map((item, index) => {
                        const from = formatCurrency(item.bracket.fromAmount);
                        const to = item.bracket.toAmount !== null ? formatCurrency(item.bracket.toAmount) : '∞';

                        return (
                          <div key={index} className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {from} - {to}
                                </div>
                                <div className="text-sm text-gray-600">
                                  Tax rate: {item.bracket.rate}%
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-purple-600">
                                  {formatCurrency(item.tax)}
                                </div>
                                <div className="text-xs text-gray-500">tax</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              Income in bracket: {formatCurrency(item.incomeInBracket)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-4 grid grid-cols-3 gap-2">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Annual Income</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(income)}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Total IRPF Tax</div>
                      <div className="text-lg font-bold text-purple-600">
                        {formatCurrency(taxResult.total)}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-600 mb-1">Effective Rate</div>
                      <div className="text-lg font-bold text-green-600">
                        {taxResult.effectiveRate.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-900">Net Annual Income</div>
                        <div className="text-sm text-gray-600">After IRPF taxes</div>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(income - taxResult.total)}
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-900">Monthly IRPF Tax</div>
                        <div className="text-sm text-gray-600">Divided by 12 months</div>
                      </div>
                      <div className="text-xl font-bold text-purple-600">
                        {formatCurrency(taxResult.total / 12)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {income > 0 && irpfBrackets.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    Please configure IRPF tax brackets first to see the calculation.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tax Brackets List */}
        <Card>
          <CardHeader>
            <CardTitle>Configured Tax Brackets</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedBrackets.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No IRPF tax brackets configured yet. Click the button above to add one.
              </p>
            ) : (
              <div className="space-y-4">
                {sortedBrackets.map((bracket) => (
                  <div
                    key={bracket.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{formatRange(bracket)}</h3>
                      <p className="text-sm text-gray-500">
                        Income range
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-lg font-semibold text-blue-600">{bracket.rate}%</span>
                        <div className="text-xs text-gray-500">Tax rate</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(bracket)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(bracket.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Tax Bracket' : 'Add Tax Bracket'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="From Amount (€)"
            type="number"
            step="0.01"
            min="0"
            value={formData.fromAmount}
            onChange={(e) => setFormData({ ...formData, fromAmount: e.target.value })}
            placeholder="e.g., 0"
            required
          />
          <Input
            label="To Amount (€) - Leave empty for no limit"
            type="number"
            step="0.01"
            min="0"
            value={formData.toAmount}
            onChange={(e) => setFormData({ ...formData, toAmount: e.target.value })}
            placeholder="e.g., 15000 or leave empty"
          />
          <Input
            label="Tax Rate (%)"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
            placeholder="e.g., 19"
            required
          />
          <p className="text-sm text-gray-600">
            Create tax brackets for different income ranges. Leave "To Amount" empty for the highest
            bracket with no upper limit.
          </p>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">{editingItem ? 'Update' : 'Add'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
