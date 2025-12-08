/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assetTypes = [
    { code: 'cash', label: '现金/储蓄' },
    { code: 'checking', label: '活期' },
    { code: 'deposit', label: '定期' },
    { code: 'stock', label: '股票' },
    { code: 'fund', label: '基金' },
    { code: 'bond', label: '债券' },
    { code: 'pension', label: '公积金/养老金' },
    { code: 'real_estate', label: '房产' },
    { code: 'vehicle', label: '车辆' },
    { code: 'metal', label: '贵金属' },
    { code: 'crypto', label: '加密货币' },
    { code: 'receivable', label: '应收款' },
    { code: 'other', label: '其他' },
  ];

  const liabilityTypes = [
    { code: 'mortgage', label: '房贷' },
    { code: 'auto_loan', label: '车贷' },
    { code: 'credit_card', label: '信用卡' },
    { code: 'consumer_loan', label: '消费贷' },
    { code: 'student_loan', label: '学生贷' },
    { code: 'personal_loan', label: '个人借款' },
    { code: 'payable', label: '应付款' },
    { code: 'tax', label: '税务负债' },
    { code: 'other', label: '其他' },
  ];

  for (const [i, t] of assetTypes.entries()) {
    await prisma.assetType.upsert({
      where: { code: t.code },
      update: { label: t.label, order: i },
      create: { code: t.code, label: t.label, order: i },
    });
  }

  for (const [i, t] of liabilityTypes.entries()) {
    await prisma.liabilityType.upsert({
      where: { code: t.code },
      update: { label: t.label, order: i },
      create: { code: t.code, label: t.label, order: i },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });