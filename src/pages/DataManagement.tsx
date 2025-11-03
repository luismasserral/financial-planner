import React, { useRef, useState } from 'react';
import { Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useFinancial } from '../context/FinancialContext';
import { exportData, importData } from '../lib/storage';

export function DataManagement() {
  const { data, replaceData } = useFinancial();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleExport = () => {
    exportData(data);
    setImportStatus({
      type: 'success',
      message: 'Data exported successfully!',
    });
    setTimeout(() => setImportStatus({ type: null, message: '' }), 3000);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await importData(file);
      replaceData(importedData);
      setImportStatus({
        type: 'success',
        message: 'Data imported successfully!',
      });
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to import data',
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => setImportStatus({ type: null, message: '' }), 5000);
  };

  const dataStats = {
    recurringIncome: data.recurringIncome.length,
    recurringExpenses: data.recurringExpenses.length,
    loans: data.loans.length,
    oneOffIncome: data.oneOffIncome.length,
    oneOffExpenses: data.oneOffExpenses.length,
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Management</h1>

      {/* Status Message */}
      {importStatus.type && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            importStatus.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {importStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}

      {/* Data Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Data Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{dataStats.recurringIncome}</p>
              <p className="text-sm text-gray-600 mt-1">Recurring Income</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{dataStats.recurringExpenses}</p>
              <p className="text-sm text-gray-600 mt-1">Recurring Expenses</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{dataStats.loans}</p>
              <p className="text-sm text-gray-600 mt-1">Loans</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{dataStats.oneOffIncome}</p>
              <p className="text-sm text-gray-600 mt-1">One-off Income</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{dataStats.oneOffExpenses}</p>
              <p className="text-sm text-gray-600 mt-1">One-off Expenses</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Download all your financial data as a JSON file. You can use this file to backup your
            data or transfer it to another device.
          </p>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle>Import Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Import financial data from a previously exported JSON file. This will replace all
            current data.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800">Warning</p>
                <p className="text-sm text-yellow-700">
                  Importing data will completely replace your current data. Make sure to export
                  your current data first if you want to keep a backup.
                </p>
              </div>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button onClick={handleImportClick} variant="secondary">
            <Upload className="w-4 h-4 mr-2" />
            Import Data
          </Button>
        </CardContent>
      </Card>

      {/* Local Storage Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Storage Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Your financial data is automatically saved in your browser's local storage. This means:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
            <li>Data is stored locally on your device and is not sent to any server</li>
            <li>Data persists between browser sessions</li>
            <li>Clearing your browser data will delete all financial information</li>
            <li>Data is specific to this browser and device</li>
          </ul>
          <p className="text-sm text-gray-600 mt-3">
            <strong>Recommendation:</strong> Regularly export your data to ensure you have a backup.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
