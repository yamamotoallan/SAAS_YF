
import { PrismaClient } from '@prisma/client';
import { METRIC_TYPES } from './goalsService';

const prisma = new PrismaClient();

interface RuleEvaluationContext {
    companyId: string;
    entity: string; // 'financial', 'process', 'people', 'operations'
    data: any; // The record that changed
}

export const RulesService = {
    /**
     * Evaluates all active rules for a specific entity type against the new data.
     */
    evaluate: async (context: RuleEvaluationContext) => {
        const { companyId, entity, data } = context;

        try {
            // 1. Fetch active rules for this entity and company
            const rules = await prisma.businessRule.findMany({
                where: {
                    companyId,
                    entity,
                    isActive: true
                }
            });

            if (rules.length === 0) return;

            // 2. Evaluate each rule
            for (const rule of rules) {
                const metricValue = RulesService.extractMetricValue(rule.metric, data);

                if (metricValue === null || metricValue === undefined) continue;

                const isViolation = RulesService.checkCondition(metricValue, rule.operator, rule.value);

                if (isViolation) {
                    await RulesService.triggerAction(rule, metricValue);
                }
            }

        } catch (error) {
            console.error(`[RulesService] Error evaluating rules for ${entity}:`, error);
        }
    },

    /**
     * Extracts the value to be checked from the data object based on the metric name.
     */
    extractMetricValue: (metric: string, data: any): number | string | null => {
        // Simple direct mapping for now. Can be expanded for complex calculations.
        // Example: 'value' -> data.value
        // Example: 'margin' -> calculated margin? (Might need to fetch more data)

        if (metric === 'value' || metric === 'amount') return Number(data.value || data.amount || 0);
        if (metric === 'score') return Number(data.score || 0);
        if (metric === 'status') return String(data.status);

        // TODO: Implement derived metrics like 'margin' or 'turnover' which require aggregation
        return null;
    },

    /**
     * Checks if the condition is met (Violation).
     */
    checkCondition: (actual: any, operator: string, target: number): boolean => {
        const numActual = Number(actual);
        const numTarget = Number(target);

        switch (operator) {
            case '>': return numActual > numTarget;
            case '<': return numActual < numTarget;
            case '>=': return numActual >= numTarget;
            case '<=': return numActual <= numTarget;
            case '==': return actual == target; // Loose equality for string/number mix
            case '!=': return actual != target;
            default: return false;
        }
    },

    /**
     * Triggers the defined action (e.g., Create Alert).
     */
    triggerAction: async (rule: any, actualValue: any) => {
        console.log(`[RulesService] Violation detected: ${rule.name}. Value: ${actualValue}`);

        if (rule.actionType === 'alert') {
            await prisma.alert.create({
                data: {
                    title: `Alerta: ${rule.name}`,
                    description: `A regra "${rule.name}" foi ativada. Valor atual: ${actualValue} (Critério: ${rule.operator} ${rule.value})`,
                    type: rule.entity,
                    priority: rule.priority,
                    companyId: rule.companyId,
                    status: 'active'
                }
            });
        }
        // Future: Send email, webhook, etc.
    }
};
