'use client';
import { useEffect, useState } from 'react';
import { formatAmount } from '../lib/format';

type Summary = {
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
  byAssetTypes: { label: string; total: string }[];
  byLiabilityTypes: { label: string; total: string }[];
};

export function SummaryCard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/summary')
      .then((res) => res.json())
      .then(setSummary)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <div className="alert alert-error">加载失败：{error}</div>;
  if (!summary) return <div className="text-sm text-muted">加载中...</div>;

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-sm text-muted">总资产</div>
          <div className="text-xl font-semibold mt-1">{formatAmount(Number(summary.totalAssets))}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-muted">总负债</div>
          <div className="text-xl font-semibold mt-1">{formatAmount(Number(summary.totalLiabilities))}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-muted">净值</div>
          <div className="text-xl font-semibold mt-1">{formatAmount(Number(summary.netWorth))}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-4">
          <h4 className="text-sm font-medium mb-2">资产分类汇总</h4>
          <ul className="text-sm text-muted space-y-1">
            {summary.byAssetTypes.map((t) => (
              <li key={t.label} className="flex justify-between"><span>{t.label}</span><span>{formatAmount(Number(t.total))}</span></li>
            ))}
          </ul>
        </div>
        <div className="card p-4">
          <h4 className="text-sm font-medium mb-2">负债分类汇总</h4>
          <ul className="text-sm text-muted space-y-1">
            {summary.byLiabilityTypes.map((t) => (
              <li key={t.label} className="flex justify-between"><span>{t.label}</span><span>{formatAmount(Number(t.total))}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}