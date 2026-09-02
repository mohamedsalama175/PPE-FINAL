import Swal from 'sweetalert2';

/**
 * HSE Enterprise Custom Styled SweetAlert2 Modal Instance
 */
export const swalCustom = Swal.mixin({
  customClass: {
    popup: 'hse-swal-modal',
    title: 'hse-swal-modal-title',
    htmlContainer: 'hse-swal-modal-text',
    confirmButton: 'hse-swal-confirm-btn',
    cancelButton: 'hse-swal-cancel-btn',
    actions: 'hse-swal-actions',
    input: 'hse-swal-textarea',
  },
  buttonsStyling: false,
});

/**
 * Glassmorphic Pill Toast Notification Instance
 */
export const toastCustom = Swal.mixin({
  toast: true,
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'hse-swal-toast',
    title: 'hse-swal-toast-title',
    timerProgressBar: 'hse-swal-progress-bar',
  },
});

/**
 * Standard confirmation dialog prompt
 */
export async function showConfirm(
  title: string,
  text?: string,
  confirmText?: string,
  isDestructive: boolean = false
): Promise<boolean> {
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const defaultConfirmText = isDestructive
    ? (isRtl ? 'حذف' : 'Delete')
    : (isRtl ? 'تأكيد' : 'Confirm');

  const result = await swalCustom.fire({
    title,
    text,
    icon: isDestructive ? 'warning' : 'question',
    iconColor: isDestructive ? '#e7515a' : '#212B59',
    showCancelButton: true,
    confirmButtonText: confirmText || defaultConfirmText,
    cancelButtonText: isRtl ? 'إلغاء' : 'Cancel',
    reverseButtons: isRtl,
    customClass: {
      popup: 'hse-swal-modal',
      title: 'hse-swal-modal-title',
      htmlContainer: 'hse-swal-modal-text',
      confirmButton: isDestructive
        ? 'hse-swal-confirm-btn !bg-danger hover:!bg-danger/90'
        : 'hse-swal-confirm-btn',
      cancelButton: 'hse-swal-cancel-btn',
      actions: 'hse-swal-actions',
    },
  });

  return result.isConfirmed;
}

/**
 * Prompt for mandatory deletion reason or in-use override justification
 */
export async function showDeleteReason(
  title: string,
  placeholder: string = 'Please enter a justification (mandatory)...',
  validationMessage: string = 'A reason of at least 5 characters is required.'
): Promise<string | null> {
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const result = await swalCustom.fire({
    title,
    input: 'textarea',
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonText: isRtl ? 'تأكيد الحذف' : 'Confirm Action',
    cancelButtonText: isRtl ? 'إلغاء' : 'Cancel',
    reverseButtons: isRtl,
    inputValidator: (value) => {
      if (!value || value.trim().length < 5) {
        return validationMessage;
      }
      return null;
    },
    customClass: {
      popup: 'hse-swal-modal',
      title: 'hse-swal-modal-title',
      confirmButton: 'hse-swal-confirm-btn !bg-danger hover:!bg-danger/90',
      cancelButton: 'hse-swal-cancel-btn',
      actions: 'hse-swal-actions',
      input: 'hse-swal-textarea',
    },
  });

  if (result.isConfirmed && result.value) {
    return result.value.trim();
  }
  return null;
}

/**
 * Glassmorphic Pill Toast Trigger
 */
export function showToast(
  title: string,
  icon: 'success' | 'error' | 'warning' | 'info' = 'success'
): void {
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  toastCustom.fire({
    title,
    icon,
    position: isRtl ? 'top-start' : 'top-end',
  });
}

/**
 * Informational Notice Modal
 */
export async function showInfo(title: string, text?: string): Promise<boolean> {
  const isRtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  const result = await swalCustom.fire({
    title,
    text,
    icon: 'info',
    iconColor: '#2196f3',
    confirmButtonText: isRtl ? 'حسناً' : 'OK',
  });
  return result.isConfirmed;
}

export default {
  showConfirm,
  showDeleteReason,
  showToast,
  showInfo,
};
