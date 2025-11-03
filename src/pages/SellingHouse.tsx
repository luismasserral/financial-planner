import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Home } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useFinancial } from '../context/FinancialContext';
import { formatCurrency, formatDate } from '../lib/utils';
import { getLoanDetails } from '../lib/calculations';

export function SellingHouse() {
  const { data, updateData } = useFinancial();
  const [saleAmount, setSaleAmount] = useState<string>(
    data.sellingHouse?.saleAmount.toString() || ''
  );
  const [selectedLoans, setSelectedLoans] = useState<Set<string>>(
    new Set(data.sellingHouse?.selectedLoanIds || [])
  );
  const [sellingDate, setSellingDate] = useState<string>(data.sellingHouse?.sellingDate || '');

  // Save to storage and manage one-off income whenever values change
  useEffect(() => {
    const saleAmountNumber = parseFloat(saleAmount) || 0;

    // Update selling house data
    const newSellingHouseData = {
      saleAmount: saleAmountNumber,
      selectedLoanIds: Array.from(selectedLoans),
      sellingDate: sellingDate || undefined,
    };

    // Calculate final amount after agency fees and loan payments
    const agencyCommissionBase = saleAmountNumber * 0.035;
    const agencyVAT = agencyCommissionBase * 0.21;
    const totalAgencyFee = agencyCommissionBase + agencyVAT;
    const amountAfterAgency = saleAmountNumber - totalAgencyFee;

    const totalLoansToPay = data.loans
      .filter((loan) => selectedLoans.has(loan.id))
      .reduce((sum, loan) => {
        const details = getLoanDetails(loan);
        return sum + details.currentBalance;
      }, 0);

    // Calculate final amount with safety margin
    const finalAmountBeforeMargin = amountAfterAgency - totalLoansToPay;
    const safetyMargin = finalAmountBeforeMargin * 0.1;
    const finalAmount = finalAmountBeforeMargin - safetyMargin;

    // Manage one-off income entry
    let newOneOffIncome = [...data.oneOffIncome];
    const existingHouseSaleIncome = newOneOffIncome.find((item) => item.isFromHouseSale);

    if (sellingDate && saleAmountNumber > 0) {
      // Create or update the house sale income entry
      const houseSaleIncome = {
        id: existingHouseSaleIncome?.id || 'house-sale-income',
        title: 'House Sale Proceeds',
        amount: finalAmount,
        date: sellingDate,
        isFromHouseSale: true,
      };

      if (existingHouseSaleIncome) {
        // Update existing entry
        newOneOffIncome = newOneOffIncome.map((item) =>
          item.isFromHouseSale ? houseSaleIncome : item
        );
      } else {
        // Add new entry
        newOneOffIncome.push(houseSaleIncome);
      }
    } else if (existingHouseSaleIncome) {
      // Remove the house sale income if selling date is cleared
      newOneOffIncome = newOneOffIncome.filter((item) => !item.isFromHouseSale);
    }

    updateData({
      ...data,
      sellingHouse: newSellingHouseData,
      oneOffIncome: newOneOffIncome,
    });
  }, [saleAmount, selectedLoans, sellingDate]);

  const saleAmountNumber = parseFloat(saleAmount) || 0;

  // Calculate agency commission
  const agencyCommissionBase = saleAmountNumber * 0.035; // 3.5%
  const agencyVAT = agencyCommissionBase * 0.21; // 21% VAT on commission
  const totalAgencyFee = agencyCommissionBase + agencyVAT;

  // Amount after paying agency
  const amountAfterAgency = saleAmountNumber - totalAgencyFee;

  // Calculate total loans to pay
  const totalLoansToPay = data.loans
    .filter((loan) => selectedLoans.has(loan.id))
    .reduce((sum, loan) => {
      const details = getLoanDetails(loan);
      return sum + details.currentBalance;
    }, 0);

  // Final amount in bank account (before safety margin)
  const finalAmountBeforeMargin = amountAfterAgency - totalLoansToPay;

  // Apply 10% safety margin
  const safetyMargin = finalAmountBeforeMargin * 0.1;
  const finalAmount = finalAmountBeforeMargin - safetyMargin;

  const toggleLoanSelection = (loanId: string) => {
    setSelectedLoans((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(loanId)) {
        newSet.delete(loanId);
      } else {
        newSet.add(loanId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedLoans(new Set(data.loans.map((loan) => loan.id)));
  };

  const deselectAll = () => {
    setSelectedLoans(new Set());
  };

  // Sort loans by current balance descending
  const sortedLoans = [...data.loans].sort((a, b) => {
    const detailsA = getLoanDetails(a);
    const detailsB = getLoanDetails(b);
    return detailsB.currentBalance - detailsA.currentBalance;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Home className="w-8 h-8" />
          Selling House Calculator
        </h1>
        <p className="text-gray-600">
          Calculate how much money you'll have after selling your house and paying off selected
          loans
        </p>
      </div>

      {/* Two Column Layout for Sale Details and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sale Amount Input */}
        <Card>
          <CardHeader>
            <CardTitle>House Sale Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Sale Price (€)"
              type="number"
              step="0.01"
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              placeholder="Enter the sale price of your house"
            />
            <Input
              label="Selling Date (Optional)"
              type="date"
              value={sellingDate}
              onChange={(e) => setSellingDate(e.target.value)}
            />
            {sellingDate && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Setting a selling date will:
                </p>
                <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
                  <li>Create a one-off income entry for the house sale proceeds</li>
                  <li>Stop counting selected loans in progress tracking from this date forward</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calculations Breakdown */}
        {saleAmountNumber > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Financial Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sale Amount */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">House Sale Price</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(saleAmountNumber)}
                  </span>
                </div>

                {/* Agency Commission Breakdown */}
                <div className="bg-red-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Agency Commission (3.5%)</span>
                    <span className="text-lg font-semibold text-red-600">
                      -{formatCurrency(agencyCommissionBase)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm pl-4">+ VAT (21% on commission)</span>
                    <span className="text-base font-semibold text-red-600">
                      -{formatCurrency(agencyVAT)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-red-200">
                    <span className="text-gray-700 font-medium">Total Agency Fee</span>
                    <span className="text-lg font-bold text-red-700">
                      -{formatCurrency(totalAgencyFee)}
                    </span>
                  </div>
                </div>

                {/* Amount After Agency */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">Amount After Agency Fee</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(amountAfterAgency)}
                  </span>
                </div>

                {/* Loans to Pay */}
                {totalLoansToPay > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-700 font-medium">
                      Loans to Pay ({selectedLoans.size} selected)
                    </span>
                    <span className="text-xl font-semibold text-orange-600">
                      -{formatCurrency(totalLoansToPay)}
                    </span>
                  </div>
                )}

                {/* Safety Margin */}
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">Safety Margin (10%)</span>
                  <span className="text-xl font-semibold text-purple-600">
                    -{formatCurrency(safetyMargin)}
                  </span>
                </div>

                {/* Final Amount */}
                <div className="flex justify-between items-center py-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg px-4 mt-4">
                  <span className="text-lg font-bold text-gray-900">Final Amount in Bank</span>
                  <span
                    className={`text-3xl font-bold ${
                      finalAmount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(finalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Loans Selection */}
      {saleAmountNumber > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Select Loans to Pay Off</h2>
            {data.loans.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {data.loans.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-gray-500">
                  No loans available. Go to the Loans page to add your loans.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {sortedLoans.map((loan) => {
                const isSelected = selectedLoans.has(loan.id);
                const details = getLoanDetails(loan);

                return (
                  <Card
                    key={loan.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'ring-2 ring-orange-500 bg-orange-50 border-orange-200'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => toggleLoanSelection(loan.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {isSelected ? (
                              <CheckCircle2 className="w-6 h-6 text-orange-600 flex-shrink-0" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-400 flex-shrink-0" />
                            )}
                            <h3 className="text-lg font-semibold text-gray-900">{loan.title}</h3>
                          </div>
                          <p className="text-sm text-gray-500 ml-9">
                            Interest Rate: {loan.interestRate}% annually
                          </p>
                        </div>
                      </div>

                      <div className="ml-9 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Current Balance</p>
                            <p
                              className={`text-lg font-bold ${
                                isSelected ? 'text-orange-600' : 'text-gray-900'
                              }`}
                            >
                              {formatCurrency(details.currentBalance)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Monthly Payment</p>
                            <p className="text-lg font-semibold text-gray-700">
                              {formatCurrency(loan.monthlyPayment)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Months Remaining</p>
                            <p className="text-sm font-medium text-gray-700">
                              {details.monthsRemaining}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Maturity Date</p>
                            <p className="text-sm font-medium text-gray-700">
                              {formatDate(loan.maturityDate)}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="pt-3 border-t border-orange-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-orange-700">Will pay:</span>
                              <span className="text-lg font-bold text-orange-700">
                                {formatCurrency(details.currentBalance)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Summary Card (only show if sale amount is entered) */}
      {saleAmountNumber > 0 && (
        <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700">
                • You are selling your house for <strong>{formatCurrency(saleAmountNumber)}</strong>
              </p>
              <p className="text-gray-700">
                • After paying agency fees (3.5% + VAT), you'll receive{' '}
                <strong>{formatCurrency(amountAfterAgency)}</strong>
              </p>
              {selectedLoans.size > 0 && (
                <p className="text-gray-700">
                  • You've selected {selectedLoans.size} loan{selectedLoans.size !== 1 ? 's' : ''}{' '}
                  to pay off, totaling <strong>{formatCurrency(totalLoansToPay)}</strong>
                </p>
              )}
              <p className="text-gray-700">
                • A 10% safety margin has been applied:{' '}
                <strong>{formatCurrency(safetyMargin)}</strong>
              </p>
              <p className="text-gray-700 pt-2 text-base">
                • <strong>Final amount in your bank account:</strong>{' '}
                <span
                  className={`text-xl font-bold ${
                    finalAmount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(finalAmount)}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              1. Enter the sale price of your house to see the breakdown of costs and potential
              profits
            </p>
            <p>2. Agency commission is calculated as 3.5% of the sale price</p>
            <p>3. VAT (21%) is then applied to the agency commission amount</p>
            <p>4. Select which loans you want to pay off with the proceeds from the sale</p>
            <p>5. A 10% safety margin is applied to account for unexpected costs</p>
            <p>
              6. The final amount shows what you'll have left in your bank account after all
              deductions
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
