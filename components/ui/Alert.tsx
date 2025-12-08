export default function Alert({ type = 'error', children }: { type?: 'error' | 'success' | 'info'; children: React.ReactNode }) {
  const cls = type === 'success' ? 'alert alert-success' : 'alert alert-error';
  return <div className={cls}>{children}</div>;
}