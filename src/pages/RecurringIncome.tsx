import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useFinancial } from '../context/FinancialContext';
import type { RecurringIncome as RecurringIncomeType } from '../types';
import { formatCurrency } from '../lib/utils';

export function RecurringIncome() {
  const { data, updateData } = useFinancial();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringIncomeType | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    startDate: '',
    endDate: '',
    iva: '',
    irpf: '',
  });

  const isFreelanceMode = data.settings.isFreelanceMode !== false; // Default to true

  const handleOpenModal = (item?: RecurringIncomeType) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        amount: item.amount.toString(),
        startDate: item.startDate || '',
        endDate: item.endDate || '',
        iva: item.iva?.toString() || '',
        irpf: item.irpf?.toString() || '',
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', amount: '', startDate: '', endDate: '', iva: '', irpf: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ title: '', amount: '', startDate: '', endDate: '', iva: '', irpf: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (!formData.title || isNaN(amount)) return;

    const iva = formData.iva ? parseFloat(formData.iva) : undefined;
    const irpf = formData.irpf ? parseFloat(formData.irpf) : undefined;

    if (editingItem) {
      // Update existing
      const updatedItems = data.recurringIncome.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              title: formData.title,
              amount,
              startDate: formData.startDate || undefined,
              endDate: formData.endDate || undefined,
              iva,
              irpf,
            }
          : item
      );
      updateData({ ...data, recurringIncome: updatedItems });
    } else {
      // Add new
      const newItem: RecurringIncomeType = {
        id: crypto.randomUUID(),
        title: formData.title,
        amount,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        iva,
        irpf,
      };
      updateData({ ...data, recurringIncome: [...data.recurringIncome, newItem] });
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const updatedItems = data.recurringIncome.filter((item) => item.id !== id);
      updateData({ ...data, recurringIncome: updatedItems });
    }
  };

  // Calculate net income after IVA and IRPF
  const calculateNetIncome = (item: RecurringIncomeType) => {
    let netAmount = item.amount;
    if (item.iva) {
      netAmount += item.amount * (item.iva / 100);
    }
    if (item.irpf) {
      netAmount -= item.amount * (item.irpf / 100);
    }
    return netAmount;
  };

  const total = data.recurringIncome.reduce((sum, item) => sum + calculateNetIncome(item), 0);
  const sortedIncome = [...data.recurringIncome].sort(
    (a, b) => calculateNetIncome(b) - calculateNetIncome(a)
  );

  // Calculate tax information
  const calculateTaxInfo = () => {
    let baseIncome = 0;
    let ivaCollected = 0;
    let irpfWithheld = 0;

    data.recurringIncome.forEach((item) => {
      baseIncome += item.amount;
      if (item.iva) {
        ivaCollected += item.amount * (item.iva / 100);
      }
      if (item.irpf) {
        irpfWithheld += item.amount * (item.irpf / 100);
      }
    });

    // Calculate annual income and IRPF based on brackets
    const annualBaseIncome = baseIncome * 12;
    const irpfBrackets = data.settings.irpfBrackets || [];

    let annualIRPFTotal = 0;
    if (irpfBrackets.length > 0 && annualBaseIncome > 0) {
      const sortedBrackets = [...irpfBrackets].sort((a, b) => a.fromAmount - b.fromAmount);
      for (const bracket of sortedBrackets) {
        if (annualBaseIncome <= bracket.fromAmount) break;
        const bracketStart = bracket.fromAmount;
        const bracketEnd = bracket.toAmount ?? Infinity;
        const bracketSize = Math.min(annualBaseIncome, bracketEnd) - bracketStart;
        if (bracketSize > 0) {
          annualIRPFTotal += bracketSize * (bracket.rate / 100);
        }
      }
    }

    const annualIRPFWithheld = irpfWithheld * 12;

    // Quarterly advance payments: 20% of quarterly income, paid 4 times per year
    const quarterlyIncome = annualBaseIncome / 4;
    const quarterlyAdvancePayment = quarterlyIncome * 0.2;
    const annualAdvancePayments = quarterlyAdvancePayment * 4;

    // Annual Renta: Total IRPF - Advance payments - Withheld IRPF
    const annualRenta = Math.max(0, annualIRPFTotal - annualAdvancePayments - annualIRPFWithheld);

    // Total IRPF to pay = Quarterly advances + Annual Renta
    const totalIRPFToPay = annualAdvancePayments + annualRenta;

    const annualIVA = ivaCollected * 12;
    const quarterlyIVA = annualIVA / 4;

    return {
      baseIncome,
      ivaCollected,
      irpfWithheld,
      quarterlyAdvancePayment,
      annualAdvancePayments,
      annualRenta,
      totalIRPFToPay,
      quarterlyIVA,
      annualBaseIncome,
      annualIRPFTotal,
      annualIRPFWithheld,
      annualIVA,
    };
  };

  const taxInfo = calculateTaxInfo();

  // Calculate income for a specific year
  const calculateYearlyIncome = (year: number) => {
    let yearlyIncome = 0;
    let yearlyIRPFWithheld = 0;
    let yearlyIVACollected = 0;
    let yearlyProfessionalExpenses = 0;

    // Check each month of the year
    for (let month = 0; month < 12; month++) {
      data.recurringIncome.forEach((item) => {
        // Check if item is active for this month
        const isActive = (() => {
          if (!item.startDate && !item.endDate) return true;

          const monthStart = new Date(year, month, 1);
          const monthEnd = new Date(year, month + 1, 0);

          if (item.startDate) {
            const startDate = new Date(item.startDate);
            if (monthEnd < startDate) return false;
          }

          if (item.endDate) {
            const endDate = new Date(item.endDate);
            if (monthStart > endDate) return false;
          }

          return true;
        })();

        if (isActive) {
          yearlyIncome += item.amount;
          if (item.irpf) {
            yearlyIRPFWithheld += item.amount * (item.irpf / 100);
          }
          if (item.iva) {
            yearlyIVACollected += item.amount * (item.iva / 100);
          }
        }
      });

      // Add professional expenses for this month
      data.recurringExpenses.forEach((item) => {
        if (!item.isProfessional) return;

        const isActive = (() => {
          if (!item.startDate && !item.endDate) return true;

          const monthStart = new Date(year, month, 1);
          const monthEnd = new Date(year, month + 1, 0);

          if (item.startDate) {
            const startDate = new Date(item.startDate);
            if (monthEnd < startDate) return false;
          }

          if (item.endDate) {
            const endDate = new Date(item.endDate);
            if (monthStart > endDate) return false;
          }

          return true;
        })();

        if (isActive) {
          yearlyProfessionalExpenses += item.amount;
        }
      });
    }

    // Calculate IRPF based on brackets on net income (income - professional expenses)
    const netTaxableIncome = Math.max(0, yearlyIncome - yearlyProfessionalExpenses);
    const irpfBrackets = data.settings.irpfBrackets || [];
    let annualIRPFTotal = 0;
    if (irpfBrackets.length > 0 && netTaxableIncome > 0) {
      const sortedBrackets = [...irpfBrackets].sort((a, b) => a.fromAmount - b.fromAmount);
      for (const bracket of sortedBrackets) {
        if (netTaxableIncome <= bracket.fromAmount) break;
        const bracketStart = bracket.fromAmount;
        const bracketEnd = bracket.toAmount ?? Infinity;
        const bracketSize = Math.min(netTaxableIncome, bracketEnd) - bracketStart;
        if (bracketSize > 0) {
          annualIRPFTotal += bracketSize * (bracket.rate / 100);
        }
      }
    }

    // Calculate quarterly advance payments (20% of net quarterly income)
    const quarterlyNetIncome = netTaxableIncome / 4;
    const annualAdvancePayments = quarterlyNetIncome * 0.2 * 4;

    // Calculate Renta
    const annualRenta = Math.max(0, annualIRPFTotal - annualAdvancePayments - yearlyIRPFWithheld);

    return {
      yearlyIncome,
      yearlyProfessionalExpenses,
      netTaxableIncome,
      yearlyIRPFWithheld,
      yearlyIVACollected,
      annualIRPFTotal,
      annualAdvancePayments,
      annualRenta,
      netIncome: yearlyIncome + yearlyIVACollected - yearlyIRPFWithheld,
    };
  };

  const yearlyData = calculateYearlyIncome(selectedYear);

  // Generate year options (from 2020 to current year + 5)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: currentYear - 2020 + 6 }, (_, i) => 2020 + i);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Recurring Income</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Income
        </Button>
      </div>

      {/* Summary Cards */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 ${isFreelanceMode ? 'lg:grid-cols-4' : ''} gap-6 mb-6`}
      >
        <Card>
          <CardHeader>
            <CardTitle>Monthly Income Received</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(total)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {isFreelanceMode ? 'After IVA/IRPF withholding' : 'Total monthly income'}
            </p>
          </CardContent>
        </Card>

        {isFreelanceMode && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Quarterly IVA Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(taxInfo.quarterlyIVA)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Paid in Jan, Apr, Jul, Oct (20th)</p>
                <p className="text-xs text-gray-500 mt-1">
                  Annual: {formatCurrency(taxInfo.annualIVA)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quarterly IRPF Advance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(taxInfo.quarterlyAdvancePayment)}
                </p>
                <p className="text-sm text-gray-600 mt-1">20% advance (Jan, Apr, Jul, Oct)</p>
                <p className="text-xs text-gray-500 mt-1">
                  Total advances: {formatCurrency(taxInfo.annualAdvancePayments)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Annual Renta (July 31st)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(taxInfo.annualRenta)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Final settlement after advances</p>
                <p className="text-xs text-gray-500 mt-1">
                  Total IRPF: {formatCurrency(taxInfo.annualIRPFTotal)}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Additional Info Card */}
      {isFreelanceMode && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tax Payment Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Quarterly Payments (20th of month):
                </h3>
                <ul className="space-y-1 text-gray-600">
                  <li>
                    • <strong>January 20:</strong> IRPF{' '}
                    {formatCurrency(taxInfo.quarterlyAdvancePayment)} + IVA{' '}
                    {formatCurrency(taxInfo.quarterlyIVA)} (Oct-Dec)
                  </li>
                  <li>
                    • <strong>April 20:</strong> IRPF{' '}
                    {formatCurrency(taxInfo.quarterlyAdvancePayment)} + IVA{' '}
                    {formatCurrency(taxInfo.quarterlyIVA)} (Jan-Mar)
                  </li>
                  <li>
                    • <strong>July 20:</strong> IRPF{' '}
                    {formatCurrency(taxInfo.quarterlyAdvancePayment)} + IVA{' '}
                    {formatCurrency(taxInfo.quarterlyIVA)} (Apr-Jun)
                  </li>
                  <li>
                    • <strong>October 20:</strong> IRPF{' '}
                    {formatCurrency(taxInfo.quarterlyAdvancePayment)} + IVA{' '}
                    {formatCurrency(taxInfo.quarterlyIVA)} (Jul-Sep)
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Annual Payment:</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>
                    • <strong>July 31:</strong> Renta {formatCurrency(taxInfo.annualRenta)}
                  </li>
                  <li className="text-xs mt-2">
                    (Total IRPF {formatCurrency(taxInfo.annualIRPFTotal)} - Advances{' '}
                    {formatCurrency(taxInfo.annualAdvancePayments)} - Withheld{' '}
                    {formatCurrency(taxInfo.annualIRPFWithheld)})
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Yearly Income Calculator */}
      {isFreelanceMode && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Yearly Income Calculator</CardTitle>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Income (Base)</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(yearlyData.yearlyIncome)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Before taxes</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Professional Expenses</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(yearlyData.yearlyProfessionalExpenses)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Tax-deductible</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Net Taxable Income</div>
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(yearlyData.netTaxableIncome)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Income - Expenses</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">IVA Collected</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(yearlyData.yearlyIVACollected)}
                </div>
                <div className="text-xs text-gray-500 mt-1">To return quarterly</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">IRPF Withheld</div>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(yearlyData.yearlyIRPFWithheld)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Already deducted</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Net Income Received</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(yearlyData.netIncome)}
                </div>
                <div className="text-xs text-gray-500 mt-1">After IVA/IRPF withholding</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total IRPF (from brackets)</div>
                <div className="text-xl font-bold text-purple-600">
                  {formatCurrency(yearlyData.annualIRPFTotal)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Calculated from tax brackets</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Quarterly Advances (20%)</div>
                <div className="text-xl font-bold text-purple-600">
                  {formatCurrency(yearlyData.annualAdvancePayments)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Paid throughout the year</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Renta (July 31st)</div>
                <div className="text-xl font-bold text-purple-600">
                  {formatCurrency(yearlyData.annualRenta)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Final settlement (Total - Advances - Withheld)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          {data.recurringIncome.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No recurring income added yet. Click the button above to add one.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedIncome.map((item) => {
                const netIncome = calculateNetIncome(item);
                const hasTaxes = item.iva || item.irpf;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500">Monthly</p>
                      {isFreelanceMode ? (
                        <div className="mt-2 text-xs text-gray-600">
                          <div>Base: {formatCurrency(item.amount)}</div>
                          <div className={item.iva ? 'text-green-600' : 'text-gray-400'}>
                            +IVA ({item.iva || 0}%):{' '}
                            {formatCurrency(item.iva ? item.amount * (item.iva / 100) : 0)}
                          </div>
                          <div className={item.irpf ? 'text-red-600' : 'text-gray-400'}>
                            -IRPF ({item.irpf || 0}%):{' '}
                            {formatCurrency(item.irpf ? item.amount * (item.irpf / 100) : 0)}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-gray-600">
                          <div>Amount: {formatCurrency(item.amount)}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-lg font-semibold text-green-600">
                          {formatCurrency(netIncome)}
                        </span>
                        {hasTaxes && <div className="text-xs text-gray-500">Net</div>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Recurring Income' : 'Add Recurring Income'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Salary"
            required
          />
          <Input
            label="Amount (€)"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            required
          />
          {isFreelanceMode && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="IVA % (Optional)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.iva}
                  onChange={(e) => setFormData({ ...formData, iva: e.target.value })}
                  placeholder="e.g., 21"
                />
                <Input
                  label="IRPF % (Optional)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.irpf}
                  onChange={(e) => setFormData({ ...formData, irpf: e.target.value })}
                  placeholder="e.g., 15"
                />
              </div>
              <p className="text-sm text-gray-600">
                IVA is added to the amount, IRPF is subtracted. Leave empty if not applicable.
              </p>
            </>
          )}
          <Input
            label="Start Date (Optional)"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
          <Input
            label="End Date (Optional)"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
          <p className="text-sm text-gray-600">
            Leave dates empty for income that is always active. Set dates to limit when this income
            applies.
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
