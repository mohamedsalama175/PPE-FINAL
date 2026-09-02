import { showConfirm, showDeleteReason, showToast, showInfo } from './swal';

/**
 * React hook for consuming HSE SweetAlert2 dialogs and toasts
 */
export function useSwal() {
  return {
    showConfirm,
    showDeleteReason,
    showToast,
    showInfo,
  };
}

export default useSwal;
