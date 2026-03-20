import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
    try {
        console.log('--- Checking Companies ---');
        const companies = await prisma.company.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        financialEntries: true,
                        people: true,
                        kpis: true,
                        flows: true,
                        processBlocks: true,
                        alerts: true,
                        goals: true,
                    }
                }
            }
        });
        console.log(`Found ${companies.length} companies:`);
        companies.forEach(c => {
            console.log(`- ${c.name} (${c.id})`);
            console.log(`  Users: ${c._count.users}, Financials: ${c._count.financialEntries}, People: ${c._count.people}`);
            console.log(`  KPIs: ${c._count.kpis}, Flows: ${c._count.flows}, Blocks: ${c._count.processBlocks}`);
            console.log(`  Alerts: ${c._count.alerts}, Goals: ${c._count.goals}`);
        });

        console.log('\n--- Checking Goals & Key Results ---');
        const goals = await prisma.goal.findMany({
            include: { keyResults: true }
        });
        goals.forEach(g => {
            console.log(`Goal: ${g.title}, KeyResults: ${g.keyResults.length}`);
            if (g.keyResults.length === 0) {
                console.warn(`[WARNING] Goal "${g.title}" has NO KeyResults!`);
            }
        });

    } catch (error) {
        console.error('Error checking database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
