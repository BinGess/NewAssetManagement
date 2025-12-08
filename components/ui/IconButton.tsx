import type { ButtonHTMLAttributes } from 'react';

export default function IconButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`btn btn-default px-2 py-1 ${props.className || ''}`} {...props} />;
}