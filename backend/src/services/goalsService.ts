// @ts-nocheck
import prisma from '../lib/prisma';

export const METRIC_TYPES = {
    FINANCIAL_REVENUE_MONTH: 'financial_revenue_month',
    FINANCIAL_PROFIT_MONTH: 'financial_profit_month',
    SALES_WON_COUNT_MONTH: 'sales_won_count_month',
    SALES_WON_VALUE_MONTH: 'sales_won_value_month',
    ACTIVE_CLIENTS_COUNT: 'active_clients_count'
};

export const GoalsService = {
    /**
     * Recalculates progress for all goals and key results of a company.
     * Optionally filters by a specific indicator type or goal ID.
     */
    async syncMetrics(companyId: string, indicatorType?: string) {
        // 1. Find all KRs that have a linked indicator
        const whereClause: any = {
            goal: { companyId },
            linkedIndicator: { not: null }
        };

        if (indicatorType) {
            whereClause.linkedIndicator = indicatorType;
        }

        const krsToUpdate = await prisma.keyResult.findMany({
            where: whereClause,
            include: { goal: true }
        });

        if (krsToUpdate.length === 0) return;

        // 2. Calculate current values for each indicator
        // We fetch data once per type to avoid repetitive queries if multiple KRs use same indicator
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const metrics: Record<string, number> = {};

        // Helper to get metric value with caching
        const getMetric = async (type: string): Promise<number> => {
            if (metrics[type] !== undefined) return metrics[type];

            let value = 0;
            switch (type) {
                case METRIC_TYPES.FINANCIAL_REVENUE_MONTH:
                    const revenue = await prisma.financialEntry.aggregate({
                        where: {
                            companyId,
                            type: 'revenue',
                            date: { gte: startOfMonth, lte: endOfMonth }
                        },
                        _sum: { value: true }
                    });
                    value = revenue._sum.value || 0;
                    break;

                case METRIC_TYPES.FINANCIAL_PROFIT_MONTH:
                    const entries = await prisma.financialEntry.groupBy({
                        by: ['type'],
                        where: {
                            companyId,
                            date: { gte: startOfMonth, lte: endOfMonth }
                        },
                        _sum: { value: true }
                    });
                    const rev = entries.find(e => e.type === 'revenue')?._sum.value || 0;
                    const cost = entries.find(e => e.type === 'cost')?._sum.value || 0;
                    value = rev - cost;
                    break;

                case METRIC_TYPES.SALES_WON_COUNT_MONTH:
                    value = await prisma.operatingItem.count({
                        where: {
                            companyId,
                            stage: { type: 'end_success' }, // Correct way to identify WON items
                            updatedAt: { gte: startOfMonth, lte: endOfMonth } // Use closing date
                        }
                    });
                    break;

                case METRIC_TYPES.SALES_WON_VALUE_MONTH:
                    const sales = await prisma.operatingItem.aggregate({
                        where: {
                            companyId,
                            stage: { type: 'end_success' },
                            updatedAt: { gte: startOfMonth, lte: endOfMonth }
                        },
                        _sum: { value: true }
                    });
                    value = sales._sum.value || 0;
                    break;

                case METRIC_TYPES.ACTIVE_CLIENTS_COUNT:
                    value = await prisma.client.count({
                        where: { companyId, status: 'active' }
                    });
                    break;
            }
            metrics[type] = value;
            return value;
        };

        // 3. Update KRs
        for (const kr of krsToUpdate) {
            if (!kr.linkedIndicator) continue;

            const newValue = await getMetric(kr.linkedIndicator);

            // Only update if value changed to avoid unnecessary db writes
            if (Math.abs(kr.currentValue - newValue) > 0.01) {
                await prisma.keyResult.update({
                    where: { id: kr.id },
                    data: { currentValue: newValue }
                });
            }
        }

        // 4. Recalculate Goal Progress using the existing logic
        // We can reuse the logic from the route or duplicate it here for the service
        // Ideally we should extract the progress calculation logic to a shared function

        // Get all unique goal IDs affected
        const goalIds = [...new Set(krsToUpdate.map(kr => kr.goalId))];

        for (const goalId of goalIds) {
            const goal = await prisma.goal.findUnique({
                where: { id: goalId },
                include: { keyResults: true }
            });

            if (!goal) continue;

            const totalProgress = goal.keyResults.reduce((sum, kr) => {
                if (kr.targetValue === 0) return sum;
                const krProgress = Math.min(100, Math.max(0, (kr.currentValue / kr.targetValue) * 100));
                return sum + krProgress;
            }, 0);

            const goalProgress = goal.keyResults.length > 0
                ? Math.round(totalProgress / goal.keyResults.length)
                : 0;

            await prisma.goal.update({
                where: { id: goal.id },
                data: { progress: goalProgress }
            });
        }
    }
};
