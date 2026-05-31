// Seed system roles
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const systemRoles = [
  {
    name: 'super_admin',
    label: '超级管理员',
    description: '拥有系统所有权限，可管理所有功能和角色',
    permissions: JSON.stringify([
      'admin.users', 'admin.models', 'admin.providers', 'admin.keys',
      'admin.billing', 'admin.monitor', 'admin.tenants', 'admin.pages', 'admin.roles',
      'nav.all'
    ]),
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    isSystem: true,
    sortOrder: 0,
  },
  {
    name: 'admin',
    label: '管理员',
    description: '可管理用户、模型、计费和页面',
    permissions: JSON.stringify([
      'admin.users', 'admin.models', 'admin.billing', 'admin.monitor', 'admin.pages',
      'nav.all'
    ]),
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    isSystem: true,
    sortOrder: 1,
  },
  {
    name: 'user',
    label: '普通用户',
    description: '可使用所有普通功能',
    permissions: JSON.stringify(['nav.all']),
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    isSystem: true,
    sortOrder: 2,
  },
  {
    name: 'guest',
    label: '访客',
    description: '仅可使用部分体验功能',
    permissions: JSON.stringify(['nav.chat', 'nav.image', 'nav.marketplace']),
    color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    isSystem: true,
    sortOrder: 3,
  },
];

async function main() {
  console.log('Seeding system roles...');
  
  for (const role of systemRoles) {
    const existing = await prisma.roleDefinition.findUnique({
      where: { name: role.name },
    });
    
    if (existing) {
      console.log(`  Updating: ${role.label} (${role.name})`);
      await prisma.roleDefinition.update({
        where: { name: role.name },
        data: role,
      });
    } else {
      console.log(`  Creating: ${role.label} (${role.name})`);
      await prisma.roleDefinition.create({
        data: role,
      });
    }
  }
  
  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
