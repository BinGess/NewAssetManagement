'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      credentials: 'same-origin',
    });
    if (res.ok) {
      router.replace('/dashboard');
    } else {
      setMsg('登录失败');
    }
  }

  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-sm">
        <Card className="p-6">
          <h2 className="text-lg font-medium mb-4">登录</h2>
          <form onSubmit={onSubmit} className="grid gap-3">
            <Input type="password" placeholder="管理员密码" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="submit">登录</Button>
          </form>
          {msg && (<div className="mt-3"><Alert type={msg.includes('成功') ? 'success' : 'error'}>{msg}</Alert></div>)}
        </Card>
      </div>
    </div>
  );
}