'use client';
import { useEffect, useState } from 'react';

export default function LiabilitiesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', typeId: '', amount: '', interestRate: '', currency: 'CNY', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function refresh() {
    try {
      const [resItems, resTypes] = await Promise.all([fetch('/api/liabilities'), fetch('/api/liability-types')]);
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
      interestRate: form.interestRate ? parseFloat(form.interestRate) : null,
      currency: form.currency,
      dueDate: form.dueDate ? new Date(form.dueDate) : null,
    };
    const res = await fetch('/api/liabilities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' });
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
      setForm({ name: '', typeId: '', amount: '', interestRate: '', currency: 'CNY', dueDate: '' });
      await refresh();
    }
    setLoading(false);
  }

  return (
    <div>
      <h2>负债列表</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 12 }}>
        <div>
          <input placeholder="名称" required aria-invalid={!!fieldErrors.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {fieldErrors.name && <div style={{ color: 'red', fontSize: 12 }}>{fieldErrors.name}</div>}
        </div>
        <div>
          <select required aria-invalid={!!fieldErrors.typeId} value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
          <option value="">类型</option>
          {types.map((t: any) => <option value={t.id} key={t.id}>{t.label}</option>)}
          </select>
          {fieldErrors.typeId && <div style={{ color: 'red', fontSize: 12 }}>{fieldErrors.typeId}</div>}
        </div>
        {types.length === 0 && (
          <div style={{ gridColumn: '1 / -1', color: '#955' }}>
            暂无负债类型，请前往 <a href="/types">类型管理</a> 新增。
          </div>
        )}
        <div>
          <input type="number" step="0.01" placeholder="金额" required aria-invalid={!!fieldErrors.amount} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          {fieldErrors.amount && <div style={{ color: 'red', fontSize: 12 }}>{fieldErrors.amount}</div>}
        </div>
        <div>
          <input type="number" step="0.0001" placeholder="利率(可选)" aria-invalid={!!fieldErrors.interestRate} value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} />
          {fieldErrors.interestRate && <div style={{ color: 'red', fontSize: 12 }}>{fieldErrors.interestRate}</div>}
        </div>
        <div>
          <input type="date" aria-invalid={!!fieldErrors.dueDate} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          {fieldErrors.dueDate && <div style={{ color: 'red', fontSize: 12 }}>{fieldErrors.dueDate}</div>}
        </div>
        <button type="submit" disabled={loading}>{loading ? '提交中' : '添加'}</button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error} {error?.includes('未登录') && (<a href="/login" style={{ marginLeft: 8 }}>登录</a>)}</div>}
      {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
      <table>
        <thead>
          <tr>
            <th>名称</th><th>类型</th><th>金额</th><th>利率</th><th>币种</th><th>到期日</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td>{it.name}</td>
              <td>{it.type?.label}</td>
              <td>{Number(it.amount).toFixed(2)}</td>
              <td>{it.interestRate ? Number(it.interestRate).toFixed(4) : '-'}</td>
              <td>{it.currency}</td>
              <td>{it.dueDate ? new Date(it.dueDate).toLocaleDateString() : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}