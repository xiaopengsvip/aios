const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  await prisma.model.update({
    where: { name: 'mimo-v2.5-pro' },
    data: { displayName: { 'zh-CN': 'MiMo v2.5 Pro', 'en-US': 'MiMo v2.5 Pro' } },
  });
  await prisma.model.update({
    where: { name: 'mimo-v2.5' },
    data: { displayName: { 'zh-CN': 'MiMo v2.5', 'en-US': 'MiMo v2.5' } },
  });
  console.log('✅ Fixed MiMo displayName');
  await prisma.$disconnect();
})();
