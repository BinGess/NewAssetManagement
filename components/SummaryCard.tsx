'use client';
import { useEffect, useState } from 'react';

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

  if (error) return <div>加载失败：{error}</div>;
  if (!summary) return <div>加载中...</div>;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div>总资产：{summary.totalAssets}</div>
        <div>总负债：{summary.totalLiabilities}</div>
        <div>净值：{summary.netWorth}</div>
      </div>
      <div style={{ display: 'flex', gap: 24 }}>
        <div>
          <h4>资产分类汇总</h4>
          <ul>
            {summary.byAssetTypes.map((t) => (
              <li key={t.label}>{t.label}: {t.total}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>负债分类汇总</h4>
          <ul>
            {summary.byLiabilityTypes.map((t) => (
              <li key={t.label}>{t.label}: {t.total}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}