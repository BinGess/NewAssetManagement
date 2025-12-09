'use client';
import { useEffect, useMemo, useState } from 'react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { formatAmount } from '../../lib/format';

export default function ExpensesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', amount: '', cycle: 'monthly', personId: '', date: '', notes: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);
  const [sort, setSort] = useState<{ field: 'name' | 'cycle' | 'amount' | 'date'; dir: 'asc' | 'desc' }>({ field: 'date', dir: 'desc' });
  const [filterPersonId, setFilterPersonId] = useState<string>('');
  const [filterCycle, setFilterCycle] = useState<string>('');
  const [filterName, setFilterName] = useState<string>('');
  const [filterStart, setFilterStart] = useState<string>('');
  const [filterEnd, setFilterEnd] = useState<string>('');

  const filteredItems = useMemo(() => {
    const startTs = filterStart ? new Date(filterStart).getTime() : -Infinity;
    const endTs = filterEnd ? new Date(filterEnd).getTime() : Infinity;
    const pid = filterPersonId ? Number(filterPersonId) : null;
    const cyc = filterCycle || null;
    const nameQ = filterName || '';
    return items.filter(it => {
      const okPerson = pid ? it.personId === pid : true;
      const okCycle = cyc ? it.cycle === cyc : true;
      const okName = nameQ ? String(it.name || '').includes(nameQ) : true;
      const ts = it.date ? new Date(it.date).getTime() : -Infinity;
      const okStart = ts >= startTs;
      const okEnd = ts <= endTs;
      return okPerson && okCycle && okName && okStart && okEnd;
    });
  }, [items, filterPersonId, filterCycle, filterName, filterStart, filterEnd]);

  const sortedItems = useMemo(() => {
    const arr = [...filteredItems];
    arr.sort((a, b) => {
      let va: any; let vb: any;
      if (sort.field === 'name') { va = a.name || ''; vb = b.name || ''; return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va)); }
      if (sort.field === 'cycle') { va = a.cycle || ''; vb = b.cycle || ''; return sort.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va)); }
      if (sort.field === 'amount') { va = Number(a.amount) || 0; vb = Number(b.amount) || 0; return sort.dir === 'asc' ? va - vb : vb - va; }
      va = a.date ? new Date(a.date).getTime() : -Infinity;
      vb = b.date ? new Date(b.date).getTime() : -Infinity;
      return sort.dir === 'asc' ? va - vb : vb - va;
    });
    return arr;
  }, [filteredItems, sort]);

  const monthlyOverview = useMemo(() => {
    let monthly = 0; let yearly = 0;
    for (const it of filteredItems) {
      const amt = Number(it.amount) || 0;
      if (it.cycle === 'monthly') monthly += amt;
      else if (it.cycle === 'yearly') yearly += amt;
    }
    return monthly + yearly / 12;
  }, [filteredItems]);

  async function refresh() {
    const [resItems, resPersons] = await Promise.all([fetch('/api/expenses'), fetch('/api/persons')]);
    setItems(await resItems.json());
    setPersons(await resPersons.json());
  }

  useEffect(() => { refresh(); }, []);
  useEffect(() => { try { const s = localStorage.getItem('expenses_sort'); if (s) setSort(JSON.parse(s)); } catch {} }, []);
  useEffect(() => { try { localStorage.setItem('expenses_sort', JSON.stringify(sort)); } catch {} }, [sort]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    const payload = {
      name: form.name,
      amount: parseFloat(form.amount),
      cycle: form.cycle,
      personId: Number(form.personId),
      date: new Date(form.date),
      notes: form.notes || undefined,
    };
    const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' });
    if (!res.ok) setError('添加失败，请检查输入或登录'); else { setSuccess('已添加'); setForm({ name: '', amount: '', cycle: 'monthly', personId: '', date: '', notes: '' }); await refresh(); }
    setLoading(false);
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">固定支出</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <Card className="p-4">
        <div className="text-sm">每月固定开支：{formatAmount(monthlyOverview)} 元</div>
      </Card>
      <Card className="p-4">
        <div className="grid md:grid-cols-5 gap-3">
          <select className="select" value={filterPersonId} onChange={(e) => setFilterPersonId(e.target.value)}>
            <option value="">所属人(全部)</option>
            {persons.map((p: any) => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
          </select>
          <select className="select" value={filterCycle} onChange={(e) => setFilterCycle(e.target.value)}>
            <option value="">周期(全部)</option>
            <option value="daily">每日</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
            <option value="yearly">每年</option>
          </select>
          <Input placeholder="名称搜索" value={filterName} onChange={(e) => setFilterName(e.target.value)} />
          <Input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
          <Input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
          <div>
            <Button variant="default" onClick={() => { setFilterPersonId(''); setFilterCycle(''); setFilterName(''); setFilterStart(''); setFilterEnd(''); }}>重置筛选</Button>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <form onSubmit={onSubmit} className="grid md:grid-cols-6 gap-3">
          <Input placeholder="名称" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input type="number" step="0.01" placeholder="金额" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <select className="select" value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })}>
            <option value="daily">每日</option>
            <option value="weekly">每周</option>
            <option value="monthly">每月</option>
            <option value="yearly">每年</option>
          </select>
          <select className="select" value={form.personId} onChange={(e) => setForm({ ...form, personId: e.target.value })}>
            <option value="">所属人</option>
            {persons.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input placeholder="备注(可选)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit" disabled={loading}>{loading ? '提交中' : '添加'}</Button>
        </form>
      </Card>

      <Card className="p-0">
        <table className="table">
          <thead>
            <tr>
              <th className="cursor-pointer" onClick={() => setSort(s => s.field === 'name' ? { field: 'name', dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field: 'name', dir: 'asc' })}>名称 {sort.field === 'name' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
              <th className="cursor-pointer" onClick={() => setSort(s => s.field === 'cycle' ? { field: 'cycle', dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field: 'cycle', dir: 'asc' })}>周期 {sort.field === 'cycle' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
              <th className="cursor-pointer" onClick={() => setSort(s => s.field === 'amount' ? { field: 'amount', dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field: 'amount', dir: 'asc' })}>金额 {sort.field === 'amount' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
              <th>所属人</th>
              <th className="cursor-pointer" onClick={() => setSort(s => s.field === 'date' ? { field: 'date', dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field: 'date', dir: 'asc' })}>日期 {sort.field === 'date' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
              <th>备注</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((it) => (
              <tr key={it.id}>
                <td><a href={`/expenses/${it.id}`} className="text-primary">{it.name}</a></td>
                <td>{it.cycle}</td>
                <td>{formatAmount(Number(it.amount))}</td>
                <td>{it.person?.name}</td>
                <td>{new Date(it.date).toLocaleDateString()}</td>
                <td>{it.notes || '-'}</td>
                <td>
                  <button className="btn btn-default px-2 py-1 mr-2" onClick={() => setEditing(it)}>编辑</button>
                  <button className="btn btn-default px-2 py-1" onClick={() => setDeleting(it)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={!!editing} title="编辑固定支出" onClose={() => setEditing(null)}
        footer={<>
          <Button variant="default" onClick={() => setEditing(null)}>取消</Button>
          <Button onClick={async () => {
            if (!editing) return;
            const payload = { name: editing.name, amount: Number(editing.amount), cycle: editing.cycle, personId: editing.personId, date: new Date(editing.date), notes: editing.notes || '' };
            const res = await fetch(`/api/expenses/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' });
            if (res.ok) { setEditing(null); await refresh(); setSuccess('已更新'); } else { setError('更新失败，检查输入或登录'); }
          }}>保存</Button>
        </>}>
        {editing && (
          <div className="grid gap-3">
            <Input placeholder="名称" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input type="number" step="0.01" placeholder="金额" value={Number(editing.amount)} onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })} />
            <select className="select" value={editing.cycle} onChange={(e) => setEditing({ ...editing, cycle: e.target.value })}>
              <option value="daily">每日</option>
              <option value="weekly">每周</option>
              <option value="monthly">每月</option>
              <option value="yearly">每年</option>
            </select>
            <select className="select" value={editing.personId} onChange={(e) => setEditing({ ...editing, personId: Number(e.target.value) })}>
              {persons.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Input type="date" value={editing.date?.slice?.(0,10) || ''} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            <Input placeholder="备注" value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
          </div>
        )}
      </Modal>

      <Modal open={!!deleting} title="确认删除固定支出" onClose={() => setDeleting(null)}
        footer={<>
          <Button variant="default" onClick={() => setDeleting(null)}>取消</Button>
          <Button onClick={async () => { if (!deleting) return; const res = await fetch(`/api/expenses/${deleting.id}`, { method: 'DELETE', credentials: 'same-origin' }); if (res.ok) { setDeleting(null); await refresh(); setSuccess('已删除'); } else { setError('删除失败，请登录或稍后再试'); } }}>删除</Button>
        </>}>
        <div className="text-sm text-muted">删除后不可恢复。</div>
      </Modal>
    </div>
  );
}