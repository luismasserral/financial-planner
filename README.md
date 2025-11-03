# Financial Planner

A comprehensive personal financial planning application built with React 19, TypeScript, Tailwind CSS 4, and ShadCN UI.

## Features

- **Recurring Income Management**: Track monthly income sources
- **Recurring Expenses Management**: Monitor monthly expenses
- **Loan Management**: Track loans with interest calculations, maturity dates, and monthly payments
- **Pay in Advance**: Calculate how much you need to pay to cancel loans in advance by selecting them
- **Selling House**: Calculate net proceeds from house sale after agency fees and loan payments
- **One-off Income**: Record occasional income entries
- **One-off Expenses**: Track one-time expenses
- **Starting Balance**: Set your current bank account balance
- **Monthly Projection**: View your standard month financial summary
- **Progress Tracking**: Visualize financial progress over time with charts and detailed tables
- **Data Management**: Export and import your financial data as JSON files

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Build

```bash
npm run build
```

## Features Detail

### Dashboard
- Overview of all financial metrics
- Monthly income vs expenses comparison
- Standard month projection showing net result

### Recurring Income & Expenses
- Add, edit, and delete monthly income sources and expenses
- View total monthly amounts

### Loans
- Track multiple loans with:
  - Outstanding balance
  - Annual interest rate
  - Monthly payment amount
  - Start date and maturity date
  - Automatic calculation of remaining balance considering interest

### Pay in Advance
- Select which loans you want to pay off early
- Interactive loan cards that can be selected/deselected
- Real-time calculation of total amount needed to cancel selected loans
- Shows current balance for each loan with interest calculations
- Select All / Clear All functionality for quick selection

### Selling House
- Input the sale price of your house
- Automatic calculation of agency commission (3.5% + 21% VAT)
- Select which loans to pay off with the proceeds
- See detailed breakdown of all costs and deductions
- Final amount shows what you'll have in your bank account
- Clear summary of the entire transaction

### One-off Income & Expenses
- Record one-time financial events with dates
- Sorted by date for easy tracking

### Progress Tracking
- Set a maximum date for projections
- View month-by-month balance progression
- Interactive chart showing balance, income, and expenses
- Detailed table with all financial movements per month

### Data Management
- Export all data as JSON file for backup
- Import previously exported data
- Data stored in browser's localStorage
- Warning system for data replacement

## Technologies Used

- **React 19**: Latest React with modern features
- **TypeScript 5.9**: Type-safe development
- **Vite 7**: Fast build tool and dev server
- **Tailwind CSS 4**: Utility-first CSS framework
- **React Router DOM**: Client-side routing
- **Recharts**: Data visualization library
- **Lucide React**: Icon library
- **ESLint & Prettier**: Code quality and formatting

## Data Storage

The application stores all data in the browser's localStorage. This means:
- Data persists between sessions
- Data is stored locally on your device
- No server or cloud storage is used
- Data is specific to your browser and device

**Important**: Regularly export your data to ensure you have backups, as clearing browser data will delete all information.

## License

ISC
