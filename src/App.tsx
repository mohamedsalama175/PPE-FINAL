import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import CatalogForm from './pages/CatalogForm';
import Attributes from './pages/Attributes';
import AttributeForm from './pages/AttributeForm';
import ItemGroups from './pages/ItemGroups';
import ItemGroupForm from './pages/ItemGroupForm';
import Locations from './pages/Locations';
import LocationForm from './pages/LocationForm';
import Kits from './pages/Kits';
import KitForm from './pages/KitForm';
import Stock from './pages/Stock';
import StockAdjustments from './pages/StockAdjustments';
import StockAdjustmentForm from './pages/StockAdjustmentForm';
import Transfers from './pages/Transfers';
import TransferForm from './pages/TransferForm';
import OpeningBalances from './pages/OpeningBalances';
import OpeningBalanceForm from './pages/OpeningBalanceForm';
import AuditLogs from './pages/AuditLogs';
import Issuances from './pages/Issuances';
import IssuanceForm from './pages/IssuanceForm';
import Scrap from './pages/Scrap';
import ExpirySettings from './pages/ExpirySettings';
import TrashBin from './pages/TrashBin';
import MyPPE from './pages/MyPPE';

import IssueKitForm from './pages/IssueKitForm';
import IssueLoanForm from './pages/IssueLoanForm';

// New Pages (PPE-040, PPE-041, PPE-042, PPE-043, PPE-044, PPE-050)
import ReplacementsDue from './pages/ReplacementsDue';
import OpenLoans from './pages/OpenLoans';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import HistoricalImport from './pages/HistoricalImport';
import ModuleSettings from './pages/ModuleSettings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          
          <Route path="catalog" element={<Catalog />} />
          <Route path="catalog/new" element={<CatalogForm />} />
          <Route path="catalog/:id/edit" element={<CatalogForm />} />
          <Route path="attributes" element={<Attributes />} />
          <Route path="attributes/new" element={<AttributeForm />} />
          <Route path="attributes/:id/edit" element={<AttributeForm />} />
          <Route path="item-groups" element={<ItemGroups />} />
          <Route path="item-groups/new" element={<ItemGroupForm />} />
          <Route path="item-groups/:id/edit" element={<ItemGroupForm />} />
          
          <Route path="locations" element={<Locations />} />
          <Route path="locations/new" element={<LocationForm />} />
          <Route path="locations/:id/edit" element={<LocationForm />} />
          <Route path="kits" element={<Kits />} />
          <Route path="kits/new" element={<KitForm />} />
          <Route path="kits/:id/edit" element={<KitForm />} />
          
          <Route path="stock" element={<Stock />} />
          <Route path="stock/adjustments" element={<StockAdjustments />} />
          <Route path="stock/adjustments/new" element={<StockAdjustmentForm />} />
          <Route path="stock/transfers" element={<Transfers />} />
          <Route path="stock/transfers/new" element={<TransferForm />} />
          <Route path="stock/opening-balances" element={<OpeningBalances />} />
          <Route path="stock/opening-balances/new" element={<OpeningBalanceForm />} />
          <Route path="stock/opening-balances/:id" element={<OpeningBalanceForm />} />
          
          <Route path="issuances" element={<Issuances />} />
          <Route path="issuances/new" element={<IssuanceForm />} />
          <Route path="issuances/new-kit" element={<IssueKitForm />} />
          <Route path="issuances/new-loan" element={<IssueLoanForm />} />
          <Route path="issuances/open-loans" element={<OpenLoans />} />
          <Route path="loans" element={<OpenLoans />} />
          <Route path="replacements-due" element={<ReplacementsDue />} />

          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="import-historical" element={<HistoricalImport />} />
          
          <Route path="scrap" element={<Scrap />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          
          <Route path="settings" element={<ModuleSettings />} />
          <Route path="settings/expiry" element={<ExpirySettings />} />
          <Route path="settings/store-keeper-assignments" element={<Locations />} />
          
          <Route path="trash" element={<TrashBin />} />
          <Route path="my-ppe" element={<MyPPE />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
