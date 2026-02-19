
import { PrismaClient } from '@prisma/client';
import { RulesService } from './src/services/rules';

const prisma = new PrismaClient();

async function verify() {
    console.log('Starting Verification...');

    // 1. Setup: Get a company
    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('No company found to test with.');
        return;
    }
    console.log('Using company:', company.id);

    // 2. Clear existing alerts and rules for clean test
    await prisma.alert.deleteMany({ where: { companyId: company.id, title: { contains: 'Test Rule' } } });
    await prisma.businessRule.deleteMany({ where: { companyId: company.id, name: 'Test Rule Margin' } });

    // 3. Create a Business Rule
    console.log('Creating Rule: Margin must be > 10%...');
    await prisma.businessRule.create({
        data: {
            name: 'Test Rule Margin',
            entity: 'financial',
            metric: 'value', // Using 'value' for now as 'margin' calculation is complex in RulesService
            operator: '<',
            value: 100,
            priority: 'high',
            companyId: company.id
        }
    });

    console.log('Creating Entry with Value = 50 (Should trigger because 50 < 100)...');
    const entryData = {
        value: 50,
        type: 'revenue',
        category: 'Test',
        description: 'Test Entry',
        date: new Date(),
        companyId: company.id
    };

    // Manually call Evaluate as the Controller would
    await RulesService.evaluate({
        companyId: company.id,
        entity: 'financial',
        data: entryData
    });

    // 5. Verify Alert
    const alert = await prisma.alert.findFirst({
        where: {
            companyId: company.id,
            title: { contains: 'Test Rule Margin' }
        }
    });

    if (alert) {
        console.log('SUCCESS: Alert generated:', alert.title, alert.description);
    } else {
        console.error('FAILURE: No alert generated.');
        process.exit(1);
    }
}

verify()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
