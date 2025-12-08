'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setMsg('登录成功'); else setMsg('登录失败');
  }

  return (
    <div style={{ maxWidth: 360 }}>
      <h2>登录</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
        <input type="password" placeholder="管理员密码" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">登录</button>
      </form>
      {msg && <div>{msg}</div>}
    </div>
  );
}