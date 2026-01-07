'use client';
import { useEffect, useState } from 'react';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { formatAmount } from '../../../lib/format';

type Asset = { id: number; name: string; typeId: number; amount: number; currency: string; valuationDate: string; type?: { code: string; label: string } };
type FundAsset = Asset & { annualRate?: number; startDate?: string };
type Holding = { id: number; name: string; price: number; quantity: number; notes?: string };
type Change = { id: number; beforeAmount: number; afterAmount: number; diff: number; at: string; notes?: string };

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const assetId = Number(params.id);
  const [asset, setAsset] = useState<FundAsset | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [changes, setChanges] = useState<Change[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', quantity: '', notes: '' });
  const [editing, setEditing] = useState<Holding | null>(null);
  const [deleting, setDeleting] = useState<Holding | null>(null);
  const [assetEditing, setAssetEditing] = useState<FundAsset | null>(null);
  const [assetDeleting, setAssetDeleting] = useState<boolean>(false);
  const [types, setTypes] = useState<{ id: number; label: string }[]>([]);
  const [jobRunning, setJobRunning] = useState(false);
  

  async function refresh() {
    setError(null);
    const [a, h, c, t] = await Promise.all([
      fetch(`/api/assets/${assetId}`),
      fetch(`/api/assets/${assetId}/holdings`),
      fetch(`/api/assets/${assetId}/changes`),
      fetch(`/api/asset-types`),
    ]);
    if (!a.ok) { setError('资产信息加载失败'); return; }
    setAsset(await a.json());
    setHoldings(await h.json());
    setChanges(await c.json());
    setTypes(await t.json());
  }

  useEffect(() => { refresh(); }, [assetId]);

  // 货币基金信息移入编辑资产弹窗，收益概览直接使用已保存数据

  const totalValue = holdings.reduce((sum, x) => sum + Number(x.price) * Number(x.quantity), 0);
  const isStockOrFund = asset?.type?.code === 'stock' || asset?.type?.code === 'fund';
  const isMoneyFund = (() => {
    const code = asset?.type?.code?.toLowerCase?.() || '';
    const label = asset?.type?.label || '';
    return code === 'huobi' || code === 'money_fund' || label.includes('货币基金');
  })();

  const amount = Number(asset?.amount) || 0;
  const rate = asset?.annualRate ? Number(asset.annualRate) : 0;
  const startDateStr = asset?.startDate || '';
  const daysElapsed = (() => {
    if (!startDateStr) return 0;
    const ms = Date.now() - new Date(startDateStr).getTime();
    return ms > 0 ? Math.floor(ms / 86400000) : 0;
  })();
  const daily = amount * rate / 365;
  const monthly = amount * rate / 12;
  const yearly = amount * rate;
  const cumulative = amount * rate * daysElapsed / 365;

  const shNow = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const shY = shNow.getUTCFullYear();
  const shM = shNow.getUTCMonth();
  const shD = shNow.getUTCDate();
  const shStartUTC = new Date(Date.UTC(shY, shM, shD));
  const shStart = new Date(shStartUTC.getTime() - 8 * 60 * 60 * 1000);
  const shEnd = new Date(shStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  const triggerTime = new Date(shStart.getTime() + 60 * 1000);
  const nowAfterTrigger = Date.now() >= triggerTime.getTime();
  const updatedToday = changes.some(ch => {
    const at = new Date(ch.at);
    return at >= shStart && at <= shEnd && String(ch.notes || '').includes('自动收益');
  });

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
            <div><div className="text-muted">基础金额</div><div className="font-medium">{formatAmount(Number(asset.amount))}</div></div>
            <div><div className="text-muted">估值日期</div><div className="font-medium">{new Date(asset.valuationDate).toLocaleDateString()}</div></div>
            {isMoneyFund && (
              <>
                <div><div className="text-muted">年化利率</div><div className="font-medium">{asset.annualRate !== undefined && asset.annualRate !== null ? Number(asset.annualRate).toFixed(4) : '-'}</div></div>
                <div><div className="text-muted">起始日期</div><div className="font-medium">{asset.startDate ? new Date(asset.startDate).toLocaleDateString() : '-'}</div></div>
              </>
            )}
            <div className="col-span-3 flex gap-2">
              <button className="btn btn-default" onClick={() => setAssetEditing(asset!)}>编辑资产</button>
              <button className="btn btn-default" onClick={() => setAssetDeleting(true)}>删除资产</button>
              {isMoneyFund && (
                <button className="btn btn-default" disabled={jobRunning} onClick={async () => {
                  if (!asset) return;
                  setError(null); setSuccess(null); setJobRunning(true);
                  const res = await fetch(`/api/jobs/money-fund-daily?assetId=${assetId}`, { method: 'POST', credentials: 'same-origin' });
                  if (res.ok) { setSuccess('已手动执行每日收益计算'); await refresh(); } else { setError('执行失败，请检查登录或服务端配置'); }
                  setJobRunning(false);
                }}>{jobRunning ? '执行中' : '手动执行日收益'}</button>
              )}
            </div>
          </div>
        ) : <div className="text-sm text-muted">加载中...</div>}
      </Card>

      {/* 货币基金信息输入已移入编辑资产弹窗 */}

      {/* 持仓管理移动到页面末尾（仅 stock/fund 显示） */}

      {isMoneyFund && (
        <Card className="p-4">
          <div className="text-sm font-medium mb-3">收益概览</div>
          {(rate && startDateStr) ? (
            <div className="grid md:grid-cols-4 gap-4 text-sm">
              <div><div className="text-muted">每日收益</div><div className="font-medium">{daily.toFixed(2)} {asset?.currency}</div></div>
              <div><div className="text-muted">每月收益</div><div className="font-medium">{monthly.toFixed(2)} {asset?.currency}</div></div>
              <div><div className="text-muted">每年收益</div><div className="font-medium">{yearly.toFixed(2)} {asset?.currency}</div></div>
              <div><div className="text-muted">累计收益</div><div className="font-medium">{cumulative.toFixed(2)} {asset?.currency}</div></div>
            </div>
          ) : (
            <div className="text-sm text-muted">请在【编辑资产】中填写年化利率与起始日期以计算收益。</div>
          )}
        </Card>
      )}

      <Card className="p-4">
        <div className="text-sm font-medium mb-3">资产变更详情 {isMoneyFund && (updatedToday ? (<span className="ml-2 text-green-600">今日更新成功</span>) : (nowAfterTrigger ? (<span className="ml-2 text-red-600">自动更新失败</span>) : null))}</div>
        {changes.length === 0 ? (
          <div className="text-sm text-muted">暂无变更记录</div>
        ) : (
          <div className="relative">
            <div className="absolute left-2 top-0 bottom-0 border-l border-border" />
            <ul className="space-y-3">
              {changes.map(ch => (
                <li key={ch.id} className="pl-6">
                  <div className="w-3 h-3 rounded-full bg-primary absolute -ml-5 mt-1" />
                  <div className="text-xs text-muted">{new Date(ch.at).toLocaleString()}</div>
                  <div className="text-sm">{Number(ch.beforeAmount).toFixed(2)} → {Number(ch.afterAmount).toFixed(2)} <span className={Number(ch.diff) >= 0 ? 'text-green-600' : 'text-red-600'}>({Number(ch.diff).toFixed(2)})</span></div>
                  {ch.notes && <div className="text-xs text-muted">{ch.notes}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

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

      <Modal open={!!assetEditing} title="编辑资产" onClose={() => setAssetEditing(null)}
        footer={<>
          <Button variant="default" onClick={() => setAssetEditing(null)}>取消</Button>
          <Button onClick={async () => {
            if (!assetEditing) return;
            const payload = {
              name: assetEditing.name,
              typeId: assetEditing.typeId,
              amount: Number(assetEditing.amount),
              currency: assetEditing.currency,
              valuationDate: new Date(assetEditing.valuationDate),
              annualRate: isMoneyFund ? (assetEditing.annualRate !== undefined && assetEditing.annualRate !== null ? Number(assetEditing.annualRate) : undefined) : undefined,
              startDate: isMoneyFund ? (assetEditing.startDate ? new Date(assetEditing.startDate) : undefined) : undefined,
              notes: undefined,
            };
            const res = await fetch(`/api/assets/${assetId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' });
            if (res.ok) { setAssetEditing(null); await refresh(); setSuccess('资产已更新'); } else { setError('资产更新失败，检查输入或登录'); }
          }}>保存</Button>
        </>}>
        {assetEditing && (
          <div className="grid gap-3">
            <Input placeholder="名称" value={assetEditing.name} onChange={(e) => setAssetEditing({ ...assetEditing, name: e.target.value })} />
            <select className="select" value={assetEditing.typeId} onChange={(e) => setAssetEditing({ ...assetEditing, typeId: Number(e.target.value) })}>
              {types.map(t => (<option key={t.id} value={t.id}>{t.label}</option>))}
            </select>
            <Input type="number" step="0.01" placeholder="基础金额" value={Number(assetEditing.amount)} onChange={(e) => setAssetEditing({ ...assetEditing, amount: Number(e.target.value) })} />
            <Input placeholder="币种" value={assetEditing.currency} onChange={(e) => setAssetEditing({ ...assetEditing, currency: e.target.value })} />
            <Input type="date" value={assetEditing.valuationDate?.slice?.(0,10) || ''} onChange={(e) => setAssetEditing({ ...assetEditing, valuationDate: e.target.value })} />
            {isMoneyFund && (
              <>
                <Input type="number" step="0.0001" placeholder="年化利率(小数，例如0.03)" value={assetEditing.annualRate !== undefined && assetEditing.annualRate !== null ? Number(assetEditing.annualRate) : ''} onChange={(e) => setAssetEditing({ ...assetEditing!, annualRate: Number(e.target.value) })} />
                <Input type="date" placeholder="起始日期" value={assetEditing.startDate?.slice?.(0,10) || ''} onChange={(e) => setAssetEditing({ ...assetEditing!, startDate: e.target.value })} />
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal open={assetDeleting} title="确认删除资产" onClose={() => setAssetDeleting(false)}
        footer={<>
          <Button variant="default" onClick={() => setAssetDeleting(false)}>取消</Button>
          <Button onClick={async () => { const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE', credentials: 'same-origin' }); if (res.ok) { window.location.href = '/assets'; } else { setError('删除失败，请登录或稍后再试'); } }}>删除</Button>
        </>}>
        <div className="text-sm text-muted">删除后不可恢复，将删除该资产及其持仓。</div>
      </Modal>

      {isStockOrFund ? (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium">持仓管理</div>
            <div className="text-sm text-muted">持仓总价值：{formatAmount(totalValue)}</div>
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
                  <td>{formatAmount(Number(h.price) * Number(h.quantity))}</td>
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
    </div>
  );
}