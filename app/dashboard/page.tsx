import { SummaryCard } from '../../components/SummaryCard';

export default async function DashboardPage() {
  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">资产概览</h2>
      <SummaryCard />
    </div>
  );
}