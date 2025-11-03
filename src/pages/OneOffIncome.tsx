import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Home } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useFinancial } from '../context/FinancialContext';
import type { OneOffIncome as OneOffIncomeType } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';

export function OneOffIncome() {
  const { data, updateData } = useFinancial();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OneOffIncomeType | null>(null);
  const [formData, setFormData] = useState({ title: '', amount: '', date: '', iva: '', irpf: '' });

  const handleOpenModal = (item?: OneOffIncomeType) => {
    if (item) {
      // Prevent editing house sale income
      if (item.isFromHouseSale) return;

      setEditingItem(item);
      setFormData({
        title: item.title,
        amount: item.amount.toString(),
        date: item.date,
        iva: item.iva?.toString() || '',
        irpf: item.irpf?.toString() || '',
      });
    } else {
      setEditingItem(null);
      const today = new Date().toISOString().split('T')[0];
      setFormData({ title: '', amount: '', date: today, iva: '', irpf: '' });
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

    const iva = formData.iva ? parseFloat(formData.iva) : undefined;
    const irpf = formData.irpf ? parseFloat(formData.irpf) : undefined;

    if (editingItem) {
      const updatedItems = data.oneOffIncome.map((item) =>
        item.id === editingItem.id
          ? { ...item, title: formData.title, amount, date: formData.date, iva, irpf }
          : item
      );
      updateData({ ...data, oneOffIncome: updatedItems });
    } else {
      const newItem: OneOffIncomeType = {
        id: crypto.randomUUID(),
        title: formData.title,
        amount,
        date: formData.date,
        iva,
        irpf,
      };
      updateData({ ...data, oneOffIncome: [...data.oneOffIncome, newItem] });
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    // Prevent deleting house sale income
    const item = data.oneOffIncome.find((i) => i.id === id);
    if (item?.isFromHouseSale) return;

    if (confirm('Are you sure you want to delete this item?')) {
      const updatedItems = data.oneOffIncome.filter((item) => item.id !== id);
      updateData({ ...data, oneOffIncome: updatedItems });
    }
  };

  // Calculate net income after IVA and IRPF
  const calculateNetIncome = (item: OneOffIncomeType) => {
    let netAmount = item.amount;
    if (item.iva) {
      netAmount += item.amount * (item.iva / 100);
    }
    if (item.irpf) {
      netAmount -= item.amount * (item.irpf / 100);
    }
    return netAmount;
  };

  // Sort by net amount descending
  const sortedIncome = [...data.oneOffIncome].sort((a, b) => calculateNetIncome(b) - calculateNetIncome(a));

  const total = data.oneOffIncome.reduce((sum, item) => sum + calculateNetIncome(item), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">One-off Income</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Income
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Total One-off Income</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(total)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {sortedIncome.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No one-off income added yet. Click the button above to add one.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedIncome.map((item) => {
                const isHouseSale = item.isFromHouseSale === true;
                const netIncome = calculateNetIncome(item);
                const hasTaxes = item.iva || item.irpf;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      isHouseSale
                        ? 'bg-blue-50 border-blue-200'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        {isHouseSale && (
                          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                            <Home className="w-3 h-3" />
                            Auto-generated
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
                      {isHouseSale ? (
                        <p className="text-xs text-blue-600 mt-1">
                          Managed from Selling House page
                        </p>
                      ) : (
                        <div className="mt-2 text-xs text-gray-600">
                          <div>Base: {formatCurrency(item.amount)}</div>
                          <div className={item.iva ? "text-green-600" : "text-gray-400"}>
                            +IVA ({item.iva || 0}%): {formatCurrency(item.iva ? item.amount * (item.iva / 100) : 0)}
                          </div>
                          <div className={item.irpf ? "text-red-600" : "text-gray-400"}>
                            -IRPF ({item.irpf || 0}%): {formatCurrency(item.irpf ? item.amount * (item.irpf / 100) : 0)}
                          </div>
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
                      {!isHouseSale && (
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(item)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      )}
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
        title={editingItem ? 'Edit One-off Income' : 'Add One-off Income'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g., Bonus payment"
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
