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
    <div style={{ display: 'grid', gap: 24 }}>
      <h2>类型管理</h2>
      {err && <div style={{ color: 'red' }}>{err}</div>}
      {msg && <div style={{ color: 'green' }}>{msg}</div>}
      <section>
        <h3>资产类型</h3>
        <form onSubmit={addAssetType} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input placeholder="编码" required value={assetForm.code} onChange={(e) => setAssetForm({ ...assetForm, code: e.target.value })} />
          <input placeholder="名称" required value={assetForm.label} onChange={(e) => setAssetForm({ ...assetForm, label: e.target.value })} />
          <button type="submit">添加</button>
        </form>
        <table>
          <thead>
            <tr><th>ID</th><th>编码</th><th>名称</th><th>启用</th></tr>
          </thead>
          <tbody>
            {assetTypes.map(t => (
              <tr key={t.id}><td>{t.id}</td><td>{t.code}</td><td>{t.label}</td><td>{t.enabled ? '是' : '否'}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>负债类型</h3>
        <form onSubmit={addLiabilityType} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input placeholder="编码" required value={liabilityForm.code} onChange={(e) => setLiabilityForm({ ...liabilityForm, code: e.target.value })} />
          <input placeholder="名称" required value={liabilityForm.label} onChange={(e) => setLiabilityForm({ ...liabilityForm, label: e.target.value })} />
          <button type="submit">添加</button>
        </form>
        <table>
          <thead>
            <tr><th>ID</th><th>编码</th><th>名称</th><th>启用</th></tr>
          </thead>
          <tbody>
            {liabilityTypes.map(t => (
              <tr key={t.id}><td>{t.id}</td><td>{t.code}</td><td>{t.label}</td><td>{t.enabled ? '是' : '否'}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}