import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useFinancial } from '../context/FinancialContext';
import type { OneOffExpense as OneOffExpenseType } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

export function OneOffExpenses() {
  const { data, updateData } = useFinancial();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OneOffExpenseType | null>(null);
  const [formData, setFormData] = useState({ title: '', amount: '', date: '' });

  const handleOpenModal = (item?: OneOffExpenseType) => {
    if (item) {
      setEditingItem(item);
      setFormData({ title: item.title, amount: item.amount.toString(), date: item.date });
    } else {
      setEditingItem(null);
      const today = new Date().toISOString().split('T')[0];
      setFormData({ title: '', amount: '', date: today });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (!formData.title || isNaN(amount) || !formData.date) return;

    if (editingItem) {
      const updatedItems = data.oneOffExpenses.map((item) =>
        item.id === editingItem.id
          ? { ...item, title: formData.title, amount, date: formData.date }
          : item
      );
      updateData({ ...data, oneOffExpenses: updatedItems });
    } else {
      const newItem: OneOffExpenseType = {
        id: crypto.randomUUID(),
        title: formData.title,
        amount,
        date: formData.date,
      };
      updateData({ ...data, oneOffExpenses: [...data.oneOffExpenses, newItem] });
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const updatedItems = data.oneOffExpenses.filter((item) => item.id !== id);
      updateData({ ...data, oneOffExpenses: updatedItems });
    }
  };

  // Sort by amount descending
  const sortedExpenses = [...data.oneOffExpenses].sort((a, b) => b.amount - a.amount);

  const total = data.oneOffExpenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">One-off Expenses</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Total One-off Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(total)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {sortedExpenses.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No one-off expenses added yet. Click the button above to add one.
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
                    <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-red-600">
                      {formatCurrency(item.amount)}
                    </span>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? 'Edit One-off Expense' : 'Add One-off Expense'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., New laptop"
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
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />
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
