'use client';
import { useEffect, useState } from 'react';

type TypeItem = { id: number; code: string; label: string; enabled: boolean; order: number };

export default function TypesPage() {
  const [assetTypes, setAssetTypes] = useState<TypeItem[]>([]);
  const [liabilityTypes, setLiabilityTypes] = useState<TypeItem[]>([]);
  const [assetForm, setAssetForm] = useState({ code: '', label: '' });
  const [liabilityForm, setLiabilityForm] = useState({ code: '', label: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const [a, l] = await Promise.all([
      fetch('/api/asset-types'),
      fetch('/api/liability-types'),
    ]);
    setAssetTypes(await a.json());
    setLiabilityTypes(await l.json());
  }

  useEffect(() => { refresh(); }, []);

  async function addAssetType(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const res = await fetch('/api/asset-types', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: assetForm.code.trim(), label: assetForm.label.trim() })
    });
    if (!res.ok) { setErr('添加失败'); return; }
    setMsg('已添加资产类型');
    setAssetForm({ code: '', label: '' });
    await refresh();
  }

  async function addLiabilityType(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setErr(null);
    const res = await fetch('/api/liability-types', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: liabilityForm.code.trim(), label: liabilityForm.label.trim() })
    });
    if (!res.ok) { setErr('添加失败'); return; }
    setMsg('已添加负债类型');
    setLiabilityForm({ code: '', label: '' });
    await refresh();
  }

  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">类型管理</h2>
      {err && <div className="alert alert-error">{err}</div>}
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="grid md:grid-cols-2 gap-4">
        <section className="card p-4">
          <h3 className="text-sm font-medium mb-3">资产类型</h3>
          <form onSubmit={addAssetType} className="flex gap-2 mb-3">
            <input className="input" placeholder="编码" required value={assetForm.code} onChange={(e) => setAssetForm({ ...assetForm, code: e.target.value })} />
            <input className="input" placeholder="名称" required value={assetForm.label} onChange={(e) => setAssetForm({ ...assetForm, label: e.target.value })} />
            <button type="submit" className="btn btn-primary">添加</button>
          </form>
          <table className="table">
            <thead>
              <tr><th>ID</th><th>编码</th><th>名称</th><th>启用</th></tr>
            </thead>
            <tbody>
              {assetTypes.length === 0 && (<tr><td className="text-muted" colSpan={4}>暂无数据</td></tr>)}
              {assetTypes.map(t => (
                <tr key={t.id}><td>{t.id}</td><td>{t.code}</td><td>{t.label}</td><td>{t.enabled ? '是' : '否'}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card p-4">
          <h3 className="text-sm font-medium mb-3">负债类型</h3>
          <form onSubmit={addLiabilityType} className="flex gap-2 mb-3">
            <input className="input" placeholder="编码" required value={liabilityForm.code} onChange={(e) => setLiabilityForm({ ...liabilityForm, code: e.target.value })} />
            <input className="input" placeholder="名称" required value={liabilityForm.label} onChange={(e) => setLiabilityForm({ ...liabilityForm, label: e.target.value })} />
            <button type="submit" className="btn btn-primary">添加</button>
          </form>
          <table className="table">
            <thead>
              <tr><th>ID</th><th>编码</th><th>名称</th><th>启用</th></tr>
            </thead>
            <tbody>
              {liabilityTypes.length === 0 && (<tr><td className="text-muted" colSpan={4}>暂无数据</td></tr>)}
              {liabilityTypes.map(t => (
                <tr key={t.id}><td>{t.id}</td><td>{t.code}</td><td>{t.label}</td><td>{t.enabled ? '是' : '否'}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}