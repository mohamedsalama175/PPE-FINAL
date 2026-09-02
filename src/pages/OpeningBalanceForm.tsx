import * as React from 'react';
import { Navigate } from 'react-router-dom';

export default function OpeningBalanceForm() {
  return <Navigate to="/stock/adjustments?tab=ob" replace />;
}
