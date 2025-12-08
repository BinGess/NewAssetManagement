import type { ReactNode } from 'react';

export default function Modal({ open, title, children, footer, onClose }: { open: boolean; title?: string; children: ReactNode; footer?: ReactNode; onClose?: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative card w-full max-w-lg p-4">
        {title && <div className="text-sm font-medium mb-3">{title}</div>}
        <div>{children}</div>
        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}