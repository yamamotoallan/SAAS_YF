
import { PrismaClient } from '@prisma/client';
import { RulesService } from './src/services/rules';

const prisma = new PrismaClient();

async function run() {
    console.log('Populating Test Data...');

    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('No company found.');
        return;
    }

    // 1. Create Rule
    const ruleName = 'Alerta: Despesa Alta (> R$ 500)';
    // Cleanup old rule if exists
    await prisma.businessRule.deleteMany({ where: { companyId: company.id, name: ruleName } });

    const rule = await prisma.businessRule.create({
        data: {
            name: ruleName,
            entity: 'financial',
            metric: 'value',
            operator: '>',
            value: 500,
            priority: 'critical',
            actionType: 'alert',
            companyId: company.id
        }
    });
    console.log(`✅ Regra criada: ${rule.name}`);

    // 2. Trigger Violation
    const entryData = {
        type: 'cost',
        category: 'Operacional',
        description: 'Compra de Teste (Gatilho de Regra)',
        value: 600, // > 500
        date: new Date(),
        companyId: company.id
    };

    console.log('⏳ Criando lançamento financeiro de R$ 600...');

    // Evaluate using the Service directly to simulate the Controller
    await RulesService.evaluate({
        companyId: company.id,
        entity: 'financial',
        data: entryData
    });

    // Also actually save the entry so it shows in the dashboard
    await prisma.financialEntry.create({ data: entryData });

    console.log('✅ Lançamento criado e regra avaliada.');

    // 3. Verify Alert
    const alert = await prisma.alert.findFirst({
        where: {
            companyId: company.id,
            title: { contains: ruleName },
            createdAt: { gte: new Date(Date.now() - 10000) } // Created in last 10s
        }
    });

    if (alert) {
        console.log(`🎉 Sucesso! Alerta gerado: "${alert.title}"`);
    } else {
        console.log('⚠️ Alerta não encontrado. Verifique se o backend processou a regra.');
    }
}

run()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
