
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    console.log('Populating People Intelligence Rules...');

    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('No company found.');
        return;
    }

    // 1. Rule for Critical Climate (eNPS/Score)
    const ruleName = 'Alerta: Clima Organizacional Crítico';

    // Cleanup old rule if exists
    await prisma.businessRule.deleteMany({ where: { companyId: company.id, name: ruleName } });

    const rule = await prisma.businessRule.create({
        data: {
            name: ruleName,
            entity: 'people',
            metric: 'score',
            operator: '<',
            value: 60, // Less than 60% is alarming
            priority: 'high',
            actionType: 'alert',
            companyId: company.id
        }
    });
    console.log(`✅ Regra de Clima criada: ${rule.name}`);

    // 2. Rule for High Turnover
    const turnoverRuleName = 'Alerta: Rotatividade (Turnover) Elevada';
    await prisma.businessRule.deleteMany({ where: { companyId: company.id, name: turnoverRuleName } });

    await prisma.businessRule.create({
        data: {
            name: turnoverRuleName,
            entity: 'people',
            metric: 'turnover',
            operator: '>',
            value: 15, // More than 15% is risky
            priority: 'high',
            actionType: 'alert',
            companyId: company.id
        }
    });
    console.log(`✅ Regra de Turnover criada: ${turnoverRuleName}`);
}

run()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
