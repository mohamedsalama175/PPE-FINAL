import * as React from 'react';
import { Navigate } from 'react-router-dom';

export default function OpeningBalances() {
  return <Navigate to="/stock/adjustments?tab=ob" replace />;
}
