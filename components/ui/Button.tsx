import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'default'; };

export default function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base = 'btn ' + (variant === 'primary' ? 'btn-primary' : 'btn-default');
  return <button className={`${base} ${className}`} {...props} />;
}