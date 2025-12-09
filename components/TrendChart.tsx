'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import * as echarts from 'echarts';
import Card from './ui/Card';
import { formatAmount } from '../lib/format';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

type Point = { date: string; totalAssets: number };

export default function TrendChart() {
  const [period, setPeriod] = useState<'30d' | '6m' | '1y'>('30d');
  const [points, setPoints] = useState<Point[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setPoints(null);
    fetch(`/api/trend?period=${period}`)
      .then((r) => r.json())
      .then((d) => setPoints(d.points))
      .catch((e) => setError(String(e)));
  }, [period]);

  const option = useMemo(() => {
    const dates = (points || []).map((p) => p.date);
    const totals = (points || []).map((p) => p.totalAssets);
    return {
      grid: { left: 24, right: 24, top: 16, bottom: 24 },
      tooltip: { trigger: 'axis', valueFormatter: (v: number) => formatAmount(Number(v)) },
      xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280' } },
      yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#e5e7eb' } }, axisLabel: { color: '#6b7280' } },
      series: [
        {
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: totals,
          lineStyle: { color: '#2563eb', width: 2 },
          areaStyle: {
            color: new (echarts as any).graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(37,99,235,0.25)' },
              { offset: 1, color: 'rgba(37,99,235,0.0)' },
            ]),
          },
        },
      ],
    };
  }, [points]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium">总资产趋势</div>
        <div className="flex gap-2">
          <button className={`btn btn-default px-2 ${period === '30d' ? 'border border-primary text-primary' : ''}`} onClick={() => setPeriod('30d')}>最近一个月</button>
          <button className={`btn btn-default px-2 ${period === '6m' ? 'border border-primary text-primary' : ''}`} onClick={() => setPeriod('6m')}>最近半年</button>
          <button className={`btn btn-default px-2 ${period === '1y' ? 'border border-primary text-primary' : ''}`} onClick={() => setPeriod('1y')}>最近一年</button>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {!points && !error && <div className="text-sm text-muted">加载中...</div>}
      {points && <ReactECharts style={{ height: 300 }} option={option} />}
    </Card>
  );
}