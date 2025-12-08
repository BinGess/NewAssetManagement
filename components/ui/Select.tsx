import type { SelectHTMLAttributes } from 'react';

export default function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`select ${props.className || ''}`} {...props} />;
}