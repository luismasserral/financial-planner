import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useFinancial } from '../context/FinancialContext';
import type { Loan } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { getLoanDetails } from '../lib/calculations';

export function Loans() {
  const { data, updateData } = useFinancial();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Loan | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    outstandingBalance: '',
    maturityDate: '',
    monthlyPayment: '',
    interestRate: '',
    startDate: '',
  });

  const handleOpenModal = (item?: Loan) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        outstandingBalance: item.outstandingBalance.toString(),
        maturityDate: item.maturityDate,
        monthlyPayment: item.monthlyPayment.toString(),
        interestRate: item.interestRate.toString(),
        startDate: item.startDate,
      });
    } else {
      setEditingItem(null);
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        title: '',
        outstandingBalance: '',
        maturityDate: '',
        monthlyPayment: '',
        interestRate: '',
        startDate: today,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const outstandingBalance = parseFloat(formData.outstandingBalance);
    const monthlyPayment = parseFloat(formData.monthlyPayment);
    const interestRate = parseFloat(formData.interestRate);

    if (
      !formData.title ||
      isNaN(outstandingBalance) ||
      isNaN(monthlyPayment) ||
      isNaN(interestRate) ||
      !formData.maturityDate ||
      !formData.startDate
    )
      return;

    if (editingItem) {
      const updatedItems = data.loans.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              title: formData.title,
              outstandingBalance,
              maturityDate: formData.maturityDate,
              monthlyPayment,
              interestRate,
              startDate: formData.startDate,
            }
          : item
      );
      updateData({ ...data, loans: updatedItems });
    } else {
      const newItem: Loan = {
        id: crypto.randomUUID(),
        title: formData.title,
        outstandingBalance,
        maturityDate: formData.maturityDate,
        monthlyPayment,
        interestRate,
        startDate: formData.startDate,
      };
      updateData({ ...data, loans: [...data.loans, newItem] });
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this loan?')) {
      const updatedItems = data.loans.filter((item) => item.id !== id);
      updateData({ ...data, loans: updatedItems });
    }
  };

  const totalMonthlyPayments = data.loans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);

  // Sort loans by current balance descending
  const sortedLoans = [...data.loans].sort((a, b) => {
    const detailsA = getLoanDetails(a);
    const detailsB = getLoanDetails(b);
    return detailsB.currentBalance - detailsA.currentBalance;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Loans</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Loan
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Total Monthly Loan Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-orange-600">
            {formatCurrency(totalMonthlyPayments)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {data.loans.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No loans added yet. Click the button above to add one.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedLoans.map((loan) => {
                const details = getLoanDetails(loan);
                return (
                  <div
                    key={loan.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{loan.title}</h3>
                        <p className="text-sm text-gray-500">
                          Interest Rate: {loan.interestRate}% annually
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(loan)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(loan.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Current Balance</p>
                        <p className="font-semibold">{formatCurrency(details.currentBalance)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Monthly Payment</p>
                        <p className="font-semibold text-orange-600">
                          {formatCurrency(loan.monthlyPayment)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Months Remaining</p>
                        <p className="font-semibold">{details.monthsRemaining}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Maturity Date</p>
                        <p className="font-semibold">{formatDate(loan.maturityDate)}</p>
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
        title={editingItem ? 'Edit Loan' : 'Add Loan'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Mortgage"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Outstanding Balance (€)"
              type="number"
              step="0.01"
              value={formData.outstandingBalance}
              onChange={(e) => setFormData({ ...formData, outstandingBalance: e.target.value })}
              placeholder="0.00"
              required
            />
            <Input
              label="Monthly Payment (€)"
              type="number"
              step="0.01"
              value={formData.monthlyPayment}
              onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>
          <Input
            label="Annual Interest Rate (%)"
            type="number"
            step="0.01"
            value={formData.interestRate}
            onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
            placeholder="0.00"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="Maturity Date"
              type="date"
              value={formData.maturityDate}
              onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
              required
            />
          </div>
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
