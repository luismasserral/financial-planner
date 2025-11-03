import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FinancialProvider } from './context/FinancialContext';
import { Dashboard } from './pages/Dashboard';
import { ProgressTracking } from './pages/ProgressTracking';
import { RecurringIncome } from './pages/RecurringIncome';
import { RecurringExpenses } from './pages/RecurringExpenses';
import { Loans } from './pages/Loans';
import { SellingHouse } from './pages/SellingHouse';
import { OneOffIncome } from './pages/OneOffIncome';
import { OneOffExpenses } from './pages/OneOffExpenses';
import { Settings } from './pages/Settings';
import { DataManagement } from './pages/DataManagement';

function App() {
  return (
    <FinancialProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/progress" element={<ProgressTracking />} />
            <Route path="/recurring-income" element={<RecurringIncome />} />
            <Route path="/recurring-expenses" element={<RecurringExpenses />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/selling-house" element={<SellingHouse />} />
            <Route path="/one-off-income" element={<OneOffIncome />} />
            <Route path="/one-off-expenses" element={<OneOffExpenses />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/data-management" element={<DataManagement />} />
          </Routes>
        </Layout>
      </Router>
    </FinancialProvider>
  );
}

export default App;
