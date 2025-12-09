'use client';
import { useEffect, useState } from 'react';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { formatAmount } from '../../../lib/format';

export default function ExpenseDetail({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [item, setItem] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  async function refresh() {
    setError(null);
    const res = await fetch(`/api/expenses/${id}`);
    if (!res.ok) { setError('加载失败'); return; }
    setItem(await res.json());
  }

  useEffect(() => { refresh(); }, [id]);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">固定支出详情</h2>
        <a href="/expenses" className="text-sm text-primary">返回列表</a>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <Card className="p-4">
        {item ? (
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div><div className="text-muted">名称</div><div className="font-medium">{item.name}</div></div>
            <div><div className="text-muted">金额</div><div className="font-medium">{formatAmount(Number(item.amount))}</div></div>
            <div><div className="text-muted">周期</div><div className="font-medium">{item.cycle}</div></div>
            <div><div className="text-muted">所属人</div><div className="font-medium">{item.person?.name}</div></div>
            <div><div className="text-muted">日期</div><div className="font-medium">{new Date(item.date).toLocaleDateString()}</div></div>
            <div><div className="text-muted">备注</div><div className="font-medium">{item.notes || '-'}</div></div>
            <div className="col-span-3 flex gap-2">
              <button className="btn btn-default" onClick={() => setEditing(item)}>编辑</button>
              <button className="btn btn-default" onClick={() => setDeleting(item)}>删除</button>
            </div>
          </div>
        ) : (<div className="text-sm text-muted">加载中...</div>)}
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
            <Input placeholder="周期" value={editing.cycle} onChange={(e) => setEditing({ ...editing, cycle: e.target.value })} />
            <Input placeholder="所属人ID" value={editing.personId} onChange={(e) => setEditing({ ...editing, personId: Number(e.target.value) })} />
            <Input type="date" value={editing.date?.slice?.(0,10) || ''} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            <Input placeholder="备注" value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
          </div>
        )}
      </Modal>

      <Modal open={!!deleting} title="确认删除固定支出" onClose={() => setDeleting(null)}
        footer={<>
          <Button variant="default" onClick={() => setDeleting(null)}>取消</Button>
          <Button onClick={async () => { if (!deleting) return; const res = await fetch(`/api/expenses/${deleting.id}`, { method: 'DELETE', credentials: 'same-origin' }); if (res.ok) { window.location.href = '/expenses'; } else { setError('删除失败，请登录或稍后再试'); } }}>删除</Button>
        </>}>
        <div className="text-sm text-muted">删除后不可恢复。</div>
      </Modal>
    </div>
  );
}