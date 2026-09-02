import * as React from 'react';
import { Modal as MantineModal } from '@mantine/core';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen?: boolean;
  opened?: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full' | string | number;
  children: React.ReactNode;
  footer?: React.ReactNode;
  centered?: boolean;
  closeOnClickOutside?: boolean;
  hideCloseButton?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  opened,
  onClose,
  title,
  subtitle,
  icon,
  size = 'lg',
  children,
  footer,
  centered = true,
  closeOnClickOutside = true,
  hideCloseButton = false,
  className,
}: ModalProps) {
  const isOpened = opened !== undefined ? opened : !!isOpen;

  return (
    <MantineModal
      opened={isOpened}
      onClose={onClose}
      centered={centered}
      size={size}
      withCloseButton={!hideCloseButton}
      closeOnClickOutside={closeOnClickOutside}
      radius="xl"
      title={
        title ? (
          <div className="flex items-center gap-2.5">
            {icon && (
              <div className="p-1.5 rounded-lg bg-primary-light text-primary shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        ) : null
      }
      classNames={{
        content: cn(
          '!rounded-xl !border !border-[#E2E8F0] !bg-white !shadow-2xl overflow-hidden',
          ' ',
          className
        ),
        header: cn(
          '!border-b !border-[#E2E8F0] !bg-slate-50/70 !px-6 !py-4',
          ' '
        ),
        close: cn(
          '!text-slate-400 hover:!text-slate-700 hover:!bg-slate-200/50 !rounded-md !transition-colors cursor-pointer',
          ' '
        ),
        body: '!p-0',
      }}
    >
      {/* Modal Main Body */}
      <div className="p-6 text-sm text-[#1E293B] ">{children}</div>

      {/* Modal Sticky Footer */}
      {footer && (
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-3.5 border-t border-[#E2E8F0] bg-slate-50 rounded-b-xl z-10">
          {footer}
        </div>
      )}
    </MantineModal>
  );
}

export default Modal;
