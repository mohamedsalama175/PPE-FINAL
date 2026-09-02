import * as React from 'react';
import { Navigate } from 'react-router-dom';

export default function StockAdjustmentForm() {
  return <Navigate to="/stock/adjustments?tab=in" replace />;
}
