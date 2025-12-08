'use client';
import { useEffect, useState } from 'react';

export default function AssetsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', typeId: '', amount: '', currency: 'CNY', valuationDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function refresh() {
    try {
      const [resItems, resTypes] = await Promise.all([fetch('/api/assets'), fetch('/api/asset-types')]);
      setItems(await resItems.json());
      setTypes(await resTypes.json());
    } catch (e) {
      setError('加载失败，请检查网络或服务端');
    }
  }

  useEffect(() => { refresh(); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    setFieldErrors({});
    const payload = {
      name: form.name,
      typeId: Number(form.typeId),
      amount: parseFloat(form.amount),
      currency: form.currency,
      valuationDate: new Date(form.valuationDate),
    };
    const res = await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' });
    if (res.status === 401) {
      setError('未登录，请先登录');
    } else if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const fe = data?.errors?.fieldErrors || {};
      const mapped: Record<string, string> = {};
      Object.keys(fe).forEach((k) => {
        const arr = fe[k];
        if (Array.isArray(arr) && arr.length) mapped[k] = arr.join(', ');
      });
      setFieldErrors(mapped);
      const msg = data?.errors?.formErrors?.join?.(', ') || Object.values(mapped).filter(Boolean).join(', ');
      setError(msg || '提交失败');
    } else {
      setSuccess('已添加');
      setForm({ name: '', typeId: '', amount: '', currency: 'CNY', valuationDate: '' });
      await refresh();
    }
    setLoading(false);
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">资产列表</h2>
      {error && <div className="alert alert-error">{error} {error?.includes('未登录') && (<a href="/login" className="ml-2 text-primary">登录</a>)}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <div className="card p-4">
        <form onSubmit={onSubmit} className="grid grid-cols-5 gap-3">
          <div>
            <input className="input" placeholder="名称" required aria-invalid={!!fieldErrors.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {fieldErrors.name && <div className="text-red-600 text-xs mt-1">{fieldErrors.name}</div>}
          </div>
          <div>
            <select className="select" required aria-invalid={!!fieldErrors.typeId} value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
              <option value="">类型</option>
              {types.map((t: any) => <option value={t.id} key={t.id}>{t.label}</option>)}
            </select>
            {fieldErrors.typeId && <div className="text-red-600 text-xs mt-1">{fieldErrors.typeId}</div>}
          </div>
          <div>
            <input className="input" type="number" step="0.01" placeholder="金额" required aria-invalid={!!fieldErrors.amount} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            {fieldErrors.amount && <div className="text-red-600 text-xs mt-1">{fieldErrors.amount}</div>}
          </div>
          <div>
            <input className="input" type="date" required aria-invalid={!!fieldErrors.valuationDate} value={form.valuationDate} onChange={(e) => setForm({ ...form, valuationDate: e.target.value })} />
            {fieldErrors.valuationDate && <div className="text-red-600 text-xs mt-1">{fieldErrors.valuationDate}</div>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? '提交中' : '添加'}</button>
        </form>
        {types.length === 0 && (
          <div className="text-sm text-muted mt-3">暂无资产类型，请前往 <a href="/types" className="text-primary">类型管理</a> 新增。</div>
        )}
      </div>
      <div className="card p-0">
        <table className="table">
          <thead>
            <tr>
              <th>名称</th><th>类型</th><th>金额</th><th>币种</th><th>估值日期</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td className="text-muted" colSpan={5}>暂无数据</td></tr>
            )}
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.name}</td>
                <td>{it.type?.label}</td>
                <td>{Number(it.amount).toFixed(2)}</td>
                <td>{it.currency}</td>
                <td>{new Date(it.valuationDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}