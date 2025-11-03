import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useFinancial } from '../context/FinancialContext';
import type { RecurringExpense } from '../types';
import { formatCurrency } from '../lib/utils';

export function RecurringExpenses() {
  const { data, updateData } = useFinancial();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringExpense | null>(null);
  const [formData, setFormData] = useState({ title: '', amount: '', startDate: '', endDate: '' });

  const handleOpenModal = (item?: RecurringExpense) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        amount: item.amount.toString(),
        startDate: item.startDate || '',
        endDate: item.endDate || '',
      });
    } else {
      setEditingItem(null);
      setFormData({ title: '', amount: '', startDate: '', endDate: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ title: '', amount: '', startDate: '', endDate: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (!formData.title || isNaN(amount)) return;

    if (editingItem) {
      const updatedItems = data.recurringExpenses.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              title: formData.title,
              amount,
              startDate: formData.startDate || undefined,
              endDate: formData.endDate || undefined,
            }
          : item
      );
      updateData({ ...data, recurringExpenses: updatedItems });
    } else {
      const newItem: RecurringExpense = {
        id: crypto.randomUUID(),
        title: formData.title,
        amount,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      };
      updateData({ ...data, recurringExpenses: [...data.recurringExpenses, newItem] });
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const updatedItems = data.recurringExpenses.filter((item) => item.id !== id);
      updateData({ ...data, recurringExpenses: updatedItems });
    }
  };

  const total = data.recurringExpenses.reduce((sum, item) => sum + item.amount, 0);
  const deviation = data.settings.monthlyExpensesDeviation || 0;
  const deviationAmount = total * (deviation / 100);
  const totalWithDeviation = total + deviationAmount;
  const sortedExpenses = [...data.recurringExpenses].sort((a, b) => b.amount - a.amount);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Recurring Expenses</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Base Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(total)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deviation ({deviation}%)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(deviationAmount)}</p>
            <p className="text-sm text-gray-600 mt-2">
              Accounts for unexpected expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total with Deviation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700">{formatCurrency(totalWithDeviation)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          {data.recurringExpenses.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No recurring expenses added yet. Click the button above to add one.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedExpenses.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    <p className="text-sm text-gray-500">Monthly</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-red-600">
                      {formatCurrency(item.amount)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
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

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Rent"
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
            Leave dates empty for expense that is always active. Set dates to limit when this expense applies.
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
