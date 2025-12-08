'use client';
import { useEffect, useState } from 'react';

export default function AssetsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', typeId: '', amount: '', currency: 'CNY', valuationDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function refresh() {
    const [resItems, resTypes] = await Promise.all([fetch('/api/assets'), fetch('/api/asset-types')]);
    setItems(await resItems.json());
    setTypes(await resTypes.json());
  }

  useEffect(() => { refresh(); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const payload = {
      name: form.name,
      typeId: Number(form.typeId),
      amount: parseFloat(form.amount),
      currency: form.currency,
      valuationDate: new Date(form.valuationDate),
    };
    const res = await fetch('/api/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data?.errors === 'string' ? data.errors : '提交失败，请检查输入或登录');
    } else {
      setSuccess('已添加');
      setForm({ name: '', typeId: '', amount: '', currency: 'CNY', valuationDate: '' });
      await refresh();
    }
    setLoading(false);
  }

  return (
    <div>
      <h2>资产列表</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
        <input placeholder="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
          <option value="">类型</option>
          {types.map((t: any) => <option value={t.id} key={t.id}>{t.label}</option>)}
        </select>
        <input type="number" step="0.01" placeholder="金额" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <input type="date" value={form.valuationDate} onChange={(e) => setForm({ ...form, valuationDate: e.target.value })} />
        <button type="submit" disabled={loading || !form.name || !form.typeId || !form.amount || !form.valuationDate}>{loading ? '提交中' : '添加'}</button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
      <table>
        <thead>
          <tr>
            <th>名称</th><th>类型</th><th>金额</th><th>币种</th><th>估值日期</th>
          </tr>
        </thead>
        <tbody>
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
  );
}