'use client';
import { useEffect, useState } from 'react';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';

type Asset = { id: number; name: string; typeId: number; amount: number; currency: string; valuationDate: string; type?: { code: string; label: string } };
type Holding = { id: number; name: string; price: number; quantity: number; notes?: string };

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const assetId = Number(params.id);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', quantity: '', notes: '' });
  const [editing, setEditing] = useState<Holding | null>(null);
  const [deleting, setDeleting] = useState<Holding | null>(null);

  async function refresh() {
    setError(null);
    const [a, h] = await Promise.all([
      fetch(`/api/assets/${assetId}`),
      fetch(`/api/assets/${assetId}/holdings`),
    ]);
    if (!a.ok) { setError('资产信息加载失败'); return; }
    setAsset(await a.json());
    setHoldings(await h.json());
  }

  useEffect(() => { refresh(); }, [assetId]);

  const totalValue = holdings.reduce((sum, x) => sum + Number(x.price) * Number(x.quantity), 0);
  const isStockOrFund = asset?.type?.code === 'stock' || asset?.type?.code === 'fund';

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setLoading(true);
    const payload = { name: form.name, price: parseFloat(form.price), quantity: parseFloat(form.quantity), notes: form.notes || undefined };
    const res = await fetch(`/api/assets/${assetId}/holdings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data?.errors?.formErrors?.join?.(', ') || Object.values(data?.errors?.fieldErrors || {}).flat().join(', ');
      setError(msg || '添加失败，请检查输入或登录');
    } else {
      setSuccess('已添加');
      setForm({ name: '', price: '', quantity: '', notes: '' });
      await refresh();
    }
    setLoading(false);
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">资产详情</h2>
        <a href="/assets" className="text-sm text-primary">返回列表</a>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <Card className="p-4">
        {asset ? (
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div><div className="text-muted">名称</div><div className="font-medium">{asset.name}</div></div>
            <div><div className="text-muted">类型</div><div className="font-medium">{asset.type?.label}</div></div>
            <div><div className="text-muted">币种</div><div className="font-medium">{asset.currency}</div></div>
            <div><div className="text-muted">基础金额</div><div className="font-medium">{Number(asset.amount).toFixed(2)}</div></div>
            <div><div className="text-muted">估值日期</div><div className="font-medium">{new Date(asset.valuationDate).toLocaleDateString()}</div></div>
          </div>
        ) : <div className="text-sm text-muted">加载中...</div>}
      </Card>

      {isStockOrFund ? (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">持仓管理</div>
            <div className="text-sm text-muted">持仓总价值：{totalValue.toFixed(2)}</div>
          </div>
          <form onSubmit={onAdd} className="grid md:grid-cols-4 gap-3 mb-3">
            <Input placeholder="名称" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input type="number" step="0.0001" placeholder="价格" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input type="number" step="0.0001" placeholder="数量" required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <Input placeholder="备注(可选)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <Button type="submit" disabled={loading}>{loading ? '提交中' : '添加'}</Button>
          </form>

          <table className="table">
            <thead>
              <tr><th>名称</th><th>价格</th><th>数量</th><th>小计</th><th>备注</th><th>操作</th></tr>
            </thead>
            <tbody>
              {holdings.length === 0 && (<tr><td className="text-muted" colSpan={6}>暂无持仓</td></tr>)}
              {holdings.map(h => (
                <tr key={h.id}>
                  <td>{h.name}</td>
                  <td>{Number(h.price).toFixed(4)}</td>
                  <td>{Number(h.quantity).toFixed(4)}</td>
                  <td>{(Number(h.price) * Number(h.quantity)).toFixed(2)}</td>
                  <td>{h.notes || '-'}</td>
                  <td>
                    <button className="btn btn-default px-2 py-1 mr-2" onClick={() => setEditing(h)}>编辑</button>
                    <button className="btn btn-default px-2 py-1" onClick={() => setDeleting(h)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="p-4"><div className="text-sm text-muted">该资产类型不支持持仓管理。</div></Card>
      )}

      <Modal open={!!editing} title="编辑持仓" onClose={() => setEditing(null)}
        footer={<>
          <Button variant="default" onClick={() => setEditing(null)}>取消</Button>
          <Button onClick={async () => {
            if (!editing) return;
            const payload = { name: editing.name, price: Number(editing.price), quantity: Number(editing.quantity), notes: editing.notes || '' };
            const res = await fetch(`/api/asset-holdings/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' });
            if (res.ok) { setEditing(null); await refresh(); setSuccess('已更新'); } else { setError('更新失败，检查输入或登录'); }
          }}>保存</Button>
        </>}>
        {editing && (
          <div className="grid gap-3">
            <Input placeholder="名称" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Input type="number" step="0.0001" placeholder="价格" value={Number(editing.price)} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
            <Input type="number" step="0.0001" placeholder="数量" value={Number(editing.quantity)} onChange={(e) => setEditing({ ...editing, quantity: Number(e.target.value) })} />
            <Input placeholder="备注" value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
          </div>
        )}
      </Modal>

      <Modal open={!!deleting} title="确认删除持仓" onClose={() => setDeleting(null)}
        footer={<>
          <Button variant="default" onClick={() => setDeleting(null)}>取消</Button>
          <Button onClick={async () => { if (!deleting) return; const res = await fetch(`/api/asset-holdings/${deleting.id}`, { method: 'DELETE', credentials: 'same-origin' }); if (res.ok) { setDeleting(null); await refresh(); setSuccess('已删除'); } else { setError('删除失败，请登录或稍后再试'); } }}>删除</Button>
        </>}>
        <div className="text-sm text-muted">删除后不可恢复。</div>
      </Modal>
    </div>
  );
}