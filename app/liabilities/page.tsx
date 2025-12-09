'use client';
import { useEffect, useMemo, useState } from 'react';
import { formatAmount } from '../../lib/format';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function LiabilitiesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', typeId: '', amount: '', interestRate: '', currency: 'CNY', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [sort, setSort] = useState<{ field: 'name' | 'type' | 'amount' | 'date'; dir: 'asc' | 'desc' }>({ field: 'date', dir: 'desc' });

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
  useEffect(() => {
    try {
      const s = localStorage.getItem('liabilities_sort');
      if (s) setSort(JSON.parse(s));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('liabilities_sort', JSON.stringify(sort)); } catch {}
  }, [sort]);

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
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">负债列表</h2>
      {error && <div className="alert alert-error">{error} {error?.includes('未登录') && (<a href="/login" className="ml-2 text-primary">登录</a>)}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <div className="card p-4">
      <form onSubmit={onSubmit} className="grid grid-cols-6 gap-3">
        <div>
          <Input placeholder="名称" required aria-invalid={!!fieldErrors.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          {fieldErrors.name && <div className="text-red-600 text-xs mt-1">{fieldErrors.name}</div>}
        </div>
        <div>
          <Select required aria-invalid={!!fieldErrors.typeId} value={form.typeId} onChange={(e) => setForm({ ...form, typeId: e.target.value })}>
          <option value="">类型</option>
          {types.map((t: any) => <option value={t.id} key={t.id}>{t.label}</option>)}
          </Select>
          {fieldErrors.typeId && <div className="text-red-600 text-xs mt-1">{fieldErrors.typeId}</div>}
        </div>
        {types.length === 0 && (
          <div className="text-sm text-muted col-span-6">暂无负债类型，请前往 <a href="/types" className="text-primary">类型管理</a> 新增。</div>
        )}
        <div>
          <Input type="number" step="0.01" placeholder="金额" required aria-invalid={!!fieldErrors.amount} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          {fieldErrors.amount && <div className="text-red-600 text-xs mt-1">{fieldErrors.amount}</div>}
        </div>
        <div>
          <Input type="number" step="0.0001" placeholder="利率(可选)" aria-invalid={!!fieldErrors.interestRate} value={form.interestRate} onChange={(e) => setForm({ ...form, interestRate: e.target.value })} />
          {fieldErrors.interestRate && <div className="text-red-600 text-xs mt-1">{fieldErrors.interestRate}</div>}
        </div>
        <div>
          <Input type="date" aria-invalid={!!fieldErrors.dueDate} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          {fieldErrors.dueDate && <div className="text-red-600 text-xs mt-1">{fieldErrors.dueDate}</div>}
        </div>
        <Button type="submit" disabled={loading}>{loading ? '提交中' : '添加'}</Button>
      </form>
      </div>
      <div className="card p-0">
      <table className="table">
        <thead>
          <tr>
              <th className="cursor-pointer" onClick={() => setSort(s => s.field === 'name' ? { field: 'name', dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field: 'name', dir: 'asc' })}>名称 {sort.field === 'name' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
              <th className="cursor-pointer" onClick={() => setSort(s => s.field === 'type' ? { field: 'type', dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field: 'type', dir: 'asc' })}>类型 {sort.field === 'type' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
              <th className="cursor-pointer" onClick={() => setSort(s => s.field === 'amount' ? { field: 'amount', dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field: 'amount', dir: 'asc' })}>金额 {sort.field === 'amount' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
              <th>利率</th>
              <th>币种</th>
              <th className="cursor-pointer" onClick={() => setSort(s => s.field === 'date' ? { field: 'date', dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field: 'date', dir: 'asc' })}>到期日 {sort.field === 'date' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
              <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (<tr><td className="text-muted" colSpan={6}>暂无数据</td></tr>)}
          {useMemo(() => {
            const arr = [...items];
            arr.sort((a, b) => {
              let va: any; let vb: any;
              if (sort.field === 'name') { va = a.name || ''; vb = b.name || ''; return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va)); }
              if (sort.field === 'type') { va = a.type?.label || ''; vb = b.type?.label || ''; return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va)); }
              if (sort.field === 'amount') { va = Number(a.amount) || 0; vb = Number(b.amount) || 0; return sort.dir === 'asc' ? va - vb : vb - va; }
              va = a.dueDate ? new Date(a.dueDate).getTime() : -Infinity;
              vb = b.dueDate ? new Date(b.dueDate).getTime() : -Infinity;
              return sort.dir === 'asc' ? va - vb : vb - va;
            });
            return arr;
          }, [items, sort]).map((it) => (
            <tr key={it.id}>
              <td>{it.name}</td>
              <td>{it.type?.label}</td>
              <td>{formatAmount(Number(it.amount))}</td>
              <td>{it.interestRate ? Number(it.interestRate).toFixed(4) : '-'}</td>
              <td>{it.currency}</td>
              <td>{it.dueDate ? new Date(it.dueDate).toLocaleDateString() : '-'}</td>
              <td>
                <button className="btn btn-default px-2 py-1 mr-2" onClick={() => setEditing(it)}>编辑</button>
                <button className="btn btn-default px-2 py-1" onClick={() => setDeleting(it)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <Modal open={!!editing} title="编辑负债" onClose={() => setEditing(null)}
        footer={<>
          <Button variant="default" onClick={() => setEditing(null)}>取消</Button>
          <Button onClick={async () => {
            if (!editing) return;
            const payload = {
              name: editing.name,
              typeId: editing.typeId,
              amount: Number(editing.amount),
              interestRate: editing.interestRate ? Number(editing.interestRate) : null,
              currency: editing.currency,
              dueDate: editing.dueDate ? new Date(editing.dueDate) : null,
              notes: editing.notes || '',
            };
          const res = await fetch(`/api/liabilities/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' });
            if (res.ok) { setEditing(null); await refresh(); setSuccess('已更新'); } else { setError('更新失败，检查输入或登录'); }
          }}>保存</Button>
        </>}>
        {editing && (
          <div className="grid gap-3">
            <Input placeholder="名称" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Select value={editing.typeId} onChange={(e) => setEditing({ ...editing, typeId: Number(e.target.value) })}>
              {types.map((t: any) => <option value={t.id} key={t.id}>{t.label}</option>)}
            </Select>
            <Input type="number" step="0.01" placeholder="金额" value={editing.amount} onChange={(e) => setEditing({ ...editing, amount: e.target.value })} />
            <Input type="number" step="0.0001" placeholder="利率(可选)" value={editing.interestRate || ''} onChange={(e) => setEditing({ ...editing, interestRate: e.target.value })} />
            <Input type="date" value={editing.dueDate?.slice?.(0,10) || ''} onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })} />
          </div>
        )}
      </Modal>

      <Modal open={!!deleting} title="确认删除负债" onClose={() => setDeleting(null)}
        footer={<>
          <Button variant="default" onClick={() => setDeleting(null)}>取消</Button>
          <Button onClick={async () => { if (!deleting) return; const res = await fetch(`/api/liabilities/${deleting.id}`, { method: 'DELETE', credentials: 'same-origin' }); if (res.ok) { setDeleting(null); await refresh(); setSuccess('已删除'); } else { setError('删除失败，请登录或稍后再试'); } }}>删除</Button>
        </>}>
        <div className="text-sm text-muted">删除后不可恢复。</div>
      </Modal>

    </div>
  );
}