import * as React from 'react';
import { SerialStatus } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { useTranslation } from '../../i18n/useTranslation';
import type { TranslationKey } from '../../i18n/translations';

export const SERIAL_STATUSES: SerialStatus[] = ['In Stock', 'Issued', 'On Loan', 'Scrapped', 'Written off'];

const LABEL_KEY: Record<SerialStatus, TranslationKey> = {
  'In Stock': 'serialStatusInStock',
  'Issued': 'serialStatusIssued',
  'On Loan': 'serialStatusOnLoan',
  'Scrapped': 'serialStatusScrapped',
  'Written off': 'serialStatusWrittenOff',
};

const TONE: Record<SerialStatus, 'success' | 'info' | 'warning' | 'error' | 'neutral'> = {
  'In Stock': 'success',
  'Issued': 'info',
  'On Loan': 'warning',
  'Scrapped': 'error',
  'Written off': 'neutral',
};

export function useSerialStatusLabel() {
  const { t } = useTranslation();
  return (s: SerialStatus) => t(LABEL_KEY[s]);
}

export function SerialStatusBadge({ status }: { status: SerialStatus }) {
  const label = useSerialStatusLabel();
  return <StatusBadge status={TONE[status]} label={label(status)} />;
}
