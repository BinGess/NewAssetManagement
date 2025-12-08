import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const [assetSum, liabilitySum] = await Promise.all([
    prisma.asset.aggregate({ _sum: { amount: true } }),
    prisma.liability.aggregate({ _sum: { amount: true } }),
  ]);

  const byAssetTypesRaw = await prisma.asset.groupBy({ by: ['typeId'], _sum: { amount: true } });
  const byLiabilityTypesRaw = await prisma.liability.groupBy({ by: ['typeId'], _sum: { amount: true } });

  const assetTypes = await prisma.assetType.findMany();
  const liabilityTypes = await prisma.liabilityType.findMany();

  const byAssetTypes = byAssetTypesRaw.map((g) => ({
    label: assetTypes.find((t) => t.id === g.typeId)?.label || String(g.typeId),
    total: (g._sum.amount || 0).toFixed(2),
  }));

  const byLiabilityTypes = byLiabilityTypesRaw.map((g) => ({
    label: liabilityTypes.find((t) => t.id === g.typeId)?.label || String(g.typeId),
    total: (g._sum.amount || 0).toFixed(2),
  }));

  const totalAssets = (assetSum._sum.amount || 0).toFixed(2);
  const totalLiabilities = (liabilitySum._sum.amount || 0).toFixed(2);
  const netWorth = (parseFloat(totalAssets) - parseFloat(totalLiabilities)).toFixed(2);

  return NextResponse.json({ totalAssets, totalLiabilities, netWorth, byAssetTypes, byLiabilityTypes });
}