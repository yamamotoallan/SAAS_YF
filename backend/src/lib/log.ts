import prisma from './prisma';

interface LogParams {
    action: 'created' | 'updated' | 'deleted' | 'resolved' | 'dismissed' | 'moved' | 'invited';
    module: string;
    entityId: string;
    entityName: string;
    details?: Record<string, any>;
    companyId: string;
    userId?: string;
}

export async function logActivity(params: LogParams) {
    try {
        await prisma.activityLog.create({
            data: {
                action: params.action,
                module: params.module,
                entityId: params.entityId,
                entityName: params.entityName,
                details: params.details ? JSON.stringify(params.details) : null,
                companyId: params.companyId,
                userId: params.userId || null,
            },
        });
    } catch (e) {
        // Log failures should never break the main request
        console.error('[ActivityLog] Failed to write log:', e);
    }
}
