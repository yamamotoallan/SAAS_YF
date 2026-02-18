import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Company
    const company = await prisma.company.create({
        data: {
            name: 'Empresa Demo - YF Consultoria',
            cnpj: '12.345.678/0001-00',
            segment: 'consulting',
            size: 'medium',
            revenue: 145000,
            headcount: 42,
        },
    });

    // 2. Create Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
        data: {
            email: 'admin@yf.com.br',
            password: hashedPassword,
            name: 'Administrador YF',
            role: 'admin',
            companyId: company.id,
        },
    });

    // 3. Clients
    const clients = await Promise.all([
        prisma.client.create({ data: { name: 'TechSolutions LTDA', type: 'PJ', email: 'contato@techsolutions.com.br', phone: '(11) 99999-0001', segment: 'Tecnologia', status: 'active', totalValue: 250000, companyId: company.id } }),
        prisma.client.create({ data: { name: 'Varejo Express', type: 'PJ', email: 'compras@varejoexpress.com.br', phone: '(11) 99999-0002', segment: 'Varejo', status: 'active', totalValue: 180000, companyId: company.id } }),
        prisma.client.create({ data: { name: 'Indústria Nacional', type: 'PJ', email: 'diretoria@inacional.com.br', phone: '(11) 99999-0003', segment: 'Indústria', status: 'active', totalValue: 320000, companyId: company.id } }),
        prisma.client.create({ data: { name: 'StartupXYZ', type: 'PJ', email: 'ceo@startupxyz.io', phone: '(11) 99999-0004', segment: 'Tecnologia', status: 'prospect', totalValue: 0, companyId: company.id } }),
        prisma.client.create({ data: { name: 'Construtora Horizonte', type: 'PJ', email: 'projetos@horizonte.com.br', phone: '(11) 99999-0005', segment: 'Construção', status: 'active', totalValue: 420000, companyId: company.id } }),
        prisma.client.create({ data: { name: 'Clínica Saúde Total', type: 'PJ', email: 'admin@saudetotal.com.br', phone: '(11) 99999-0006', segment: 'Saúde', status: 'inactive', totalValue: 95000, companyId: company.id } }),
    ]);

    // 4. Flows + Stages
    const salesFlow = await prisma.operatingFlow.create({
        data: {
            name: 'Vendas B2B',
            type: 'sales',
            companyId: company.id,
            stages: {
                create: [
                    { name: 'Prospecção', order: 0, sla: 48, type: 'start' },
                    { name: 'Qualificação', order: 1, sla: 72, type: 'process' },
                    { name: 'Proposta', order: 2, sla: 48, type: 'process' },
                    { name: 'Négociação', order: 3, sla: 96, type: 'process' },
                    { name: 'Fechamento', order: 4, sla: 24, type: 'end_success' },
                    { name: 'Perdido', order: 5, sla: 0, type: 'end_fail' },
                ],
            },
        },
        include: { stages: { orderBy: { order: 'asc' } } },
    });

    const projectFlow = await prisma.operatingFlow.create({
        data: {
            name: 'Projetos',
            type: 'project',
            companyId: company.id,
            stages: {
                create: [
                    { name: 'Planejamento', order: 0, sla: 120, type: 'start' },
                    { name: 'Diagnóstico', order: 1, sla: 160, type: 'process' },
                    { name: 'Implementação', order: 2, sla: 240, type: 'process' },
                    { name: 'Treinamento', order: 3, sla: 80, type: 'process' },
                    { name: 'Entrega', order: 4, sla: 40, type: 'end_success' },
                ],
            },
        },
        include: { stages: { orderBy: { order: 'asc' } } },
    });

    const serviceFlow = await prisma.operatingFlow.create({
        data: {
            name: 'Serviços',
            type: 'service',
            companyId: company.id,
            stages: {
                create: [
                    { name: 'Abertura', order: 0, sla: 4, type: 'start' },
                    { name: 'Análise', order: 1, sla: 24, type: 'process' },
                    { name: 'Execução', order: 2, sla: 48, type: 'process' },
                    { name: 'Validação', order: 3, sla: 24, type: 'process' },
                    { name: 'Concluído', order: 4, sla: 0, type: 'end_success' },
                ],
            },
        },
        include: { stages: { orderBy: { order: 'asc' } } },
    });

    // 5. Operating Items (Sales)
    const salesStages = salesFlow.stages;
    await Promise.all([
        prisma.operatingItem.create({ data: { title: 'Consultoria Estratégica - TechSolutions', type: 'deal', flowId: salesFlow.id, stageId: salesStages[3].id, clientId: clients[0].id, responsibleId: admin.id, value: 85000, priority: 'high', slaDueAt: new Date('2026-02-20') } }),
        prisma.operatingItem.create({ data: { title: 'Diagnóstico Operacional - Varejo Express', type: 'deal', flowId: salesFlow.id, stageId: salesStages[2].id, clientId: clients[1].id, responsibleId: admin.id, value: 45000, priority: 'medium' } }),
        prisma.operatingItem.create({ data: { title: 'Reestruturação - Indústria Nacional', type: 'deal', flowId: salesFlow.id, stageId: salesStages[3].id, clientId: clients[2].id, responsibleId: admin.id, value: 120000, priority: 'critical', slaDueAt: new Date('2026-02-18') } }),
        prisma.operatingItem.create({ data: { title: 'Mentoria CEO - StartupXYZ', type: 'lead', flowId: salesFlow.id, stageId: salesStages[0].id, clientId: clients[3].id, value: 15000, priority: 'low' } }),
        prisma.operatingItem.create({ data: { title: 'Gestão Financeira - Horizonte', type: 'deal', flowId: salesFlow.id, stageId: salesStages[1].id, clientId: clients[4].id, responsibleId: admin.id, value: 65000, priority: 'high' } }),
        prisma.operatingItem.create({ data: { title: 'Plano de Crescimento - TechSolutions', type: 'deal', flowId: salesFlow.id, stageId: salesStages[2].id, clientId: clients[0].id, responsibleId: admin.id, value: 95000, priority: 'medium' } }),
        prisma.operatingItem.create({ data: { title: 'Assessment Cultural - Varejo Express', type: 'lead', flowId: salesFlow.id, stageId: salesStages[0].id, clientId: clients[1].id, value: 22000, priority: 'low' } }),
        prisma.operatingItem.create({ data: { title: 'Automação de Processos', type: 'deal', flowId: salesFlow.id, stageId: salesStages[1].id, clientId: clients[2].id, responsibleId: admin.id, value: 78000, priority: 'high' } }),
    ]);

    // Items for Projects
    const projectStages = projectFlow.stages;
    await Promise.all([
        prisma.operatingItem.create({ data: { title: 'Implantação ERP - Indústria Nacional', type: 'project', flowId: projectFlow.id, stageId: projectStages[2].id, clientId: clients[2].id, responsibleId: admin.id, value: 180000, priority: 'critical' } }),
        prisma.operatingItem.create({ data: { title: 'Consultoria RH - Horizonte', type: 'project', flowId: projectFlow.id, stageId: projectStages[1].id, clientId: clients[4].id, responsibleId: admin.id, value: 55000, priority: 'medium' } }),
        prisma.operatingItem.create({ data: { title: 'Redesenho Comercial - TechSolutions', type: 'project', flowId: projectFlow.id, stageId: projectStages[0].id, clientId: clients[0].id, value: 72000, priority: 'high' } }),
    ]);

    // Items for Services
    const serviceStages = serviceFlow.stages;
    await Promise.all([
        prisma.operatingItem.create({ data: { title: 'Relatório Mensal - TechSolutions', type: 'task', flowId: serviceFlow.id, stageId: serviceStages[1].id, clientId: clients[0].id, responsibleId: admin.id, value: 5000, priority: 'medium' } }),
        prisma.operatingItem.create({ data: { title: 'Revisão Contratual - Horizonte', type: 'ticket', flowId: serviceFlow.id, stageId: serviceStages[2].id, clientId: clients[4].id, responsibleId: admin.id, value: 3000, priority: 'low' } }),
    ]);

    // 6. Process Blocks + Items
    const processData = [
        {
            name: 'Direção Estratégica', type: 'direction', order: 0,
            processes: [
                { code: 'D01', name: 'Planejamento Estratégico', status: 'informal', responsible: true, frequency: 'eventual' },
                { code: 'D02', name: 'Definição de Metas e KPIs', status: 'none', responsible: false, frequency: 'never' },
                { code: 'D03', name: 'Reunião de Resultado Mensal', status: 'formal', responsible: true, frequency: 'periodic' },
                { code: 'D04', name: 'Gestão de Riscos Corporativos', status: 'none', responsible: false, frequency: 'never' },
                { code: 'D05', name: 'Plano de Expansão / Crescimento', status: 'informal', responsible: false, frequency: 'eventual' },
            ],
        },
        {
            name: 'Gestão Financeira', type: 'finance', order: 1,
            processes: [
                { code: 'F01', name: 'Controle de Fluxo de Caixa', status: 'formal', responsible: true, frequency: 'periodic' },
                { code: 'F02', name: 'DRE e Balancete Mensal', status: 'formal', responsible: true, frequency: 'periodic' },
                { code: 'F03', name: 'Contas a Pagar / Receber', status: 'formal', responsible: true, frequency: 'periodic' },
                { code: 'F04', name: 'Precificação e Margem', status: 'informal', responsible: false, frequency: 'eventual' },
                { code: 'F05', name: 'Planejamento Orçamentário Anual', status: 'none', responsible: false, frequency: 'never' },
            ],
        },
        {
            name: 'Administrativo', type: 'admin', order: 2,
            processes: [
                { code: 'A01', name: 'Controle de Contratos', status: 'formal', responsible: true, frequency: 'periodic' },
                { code: 'A02', name: 'Gestão de Fornecedores', status: 'informal', responsible: true, frequency: 'eventual' },
                { code: 'A03', name: 'Compliance e Documentação', status: 'formal', responsible: true, frequency: 'periodic' },
                { code: 'A04', name: 'Gestão de Patrimônio', status: 'informal', responsible: false, frequency: 'eventual' },
                { code: 'A05', name: 'Procedimento de Compras', status: 'formal', responsible: true, frequency: 'periodic' },
            ],
        },
        {
            name: 'Pessoas & Cultura', type: 'people', order: 3,
            processes: [
                { code: 'P01', name: 'Recrutamento e Seleção', status: 'formal', responsible: true, frequency: 'periodic' },
                { code: 'P02', name: 'Onboarding de Novos', status: 'informal', responsible: true, frequency: 'eventual' },
                { code: 'P03', name: 'Avaliação de Desempenho', status: 'informal', responsible: false, frequency: 'eventual' },
                { code: 'P04', name: 'Plano de Cargos e Salários', status: 'none', responsible: false, frequency: 'never' },
                { code: 'P05', name: 'Pesquisa de Clima', status: 'informal', responsible: false, frequency: 'eventual' },
            ],
        },
        {
            name: 'Operacional', type: 'ops', order: 4,
            processes: [
                { code: 'O01', name: 'Gestão de Projetos', status: 'formal', responsible: true, frequency: 'periodic' },
                { code: 'O02', name: 'Controle de Qualidade', status: 'formal', responsible: true, frequency: 'periodic' },
                { code: 'O03', name: 'Gestão de Estoque / Insumos', status: 'informal', responsible: true, frequency: 'eventual' },
                { code: 'O04', name: 'SLA e Indicadores de Entrega', status: 'formal', responsible: true, frequency: 'periodic' },
                { code: 'O05', name: 'Melhoria Contínua (PDCA)', status: 'none', responsible: false, frequency: 'never' },
            ],
        },
        {
            name: 'Governança', type: 'governance', order: 5,
            processes: [
                { code: 'G01', name: 'Reunião de Conselho / Sócios', status: 'formal', responsible: true, frequency: 'periodic' },
                { code: 'G02', name: 'Política de Segurança da Informação', status: 'informal', responsible: false, frequency: 'eventual' },
                { code: 'G03', name: 'Auditoria Interna', status: 'none', responsible: false, frequency: 'never' },
                { code: 'G04', name: 'Código de Conduta', status: 'formal', responsible: true, frequency: 'periodic' },
                { code: 'G05', name: 'Gestão de Sucessão', status: 'none', responsible: false, frequency: 'never' },
            ],
        },
    ];

    for (const block of processData) {
        await prisma.processBlock.create({
            data: {
                name: block.name,
                type: block.type,
                order: block.order,
                companyId: company.id,
                processes: {
                    create: block.processes.map(p => ({
                        code: p.code,
                        name: p.name,
                        status: p.status,
                        responsible: p.responsible,
                        frequency: p.frequency,
                    })),
                },
            },
        });
    }

    // 7. KPIs
    await Promise.all([
        prisma.kPI.create({ data: { name: 'Faturamento Mensal', category: 'Financeiro', value: 145000, target: 130000, unit: 'R$', trend: 'up', status: 'success', companyId: company.id } }),
        prisma.kPI.create({ data: { name: 'Margem Operacional', category: 'Financeiro', value: 22, target: 24, unit: '%', trend: 'down', status: 'warning', companyId: company.id } }),
        prisma.kPI.create({ data: { name: 'Turnover Trimestral', category: 'Pessoas', value: 5.2, target: 3.0, unit: '%', trend: 'up', status: 'danger', companyId: company.id } }),
        prisma.kPI.create({ data: { name: 'NPS (Satisfação)', category: 'Cliente', value: 72, target: 75, unit: 'score', trend: 'down', status: 'warning', companyId: company.id } }),
        prisma.kPI.create({ data: { name: 'Custo Fixo Total', category: 'Financeiro', value: 45000, target: 45000, unit: 'R$', trend: 'stable', status: 'success', companyId: company.id } }),
        prisma.kPI.create({ data: { name: 'Absenteísmo', category: 'Pessoas', value: 1.5, target: 2.0, unit: '%', trend: 'down', status: 'success', companyId: company.id } }),
    ]);

    // 8. Financial Entries
    const currentMonth = new Date();
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);

    await Promise.all([
        // Current month revenue
        prisma.financialEntry.create({ data: { type: 'revenue', category: 'Consultoria', description: 'Projeto TechSolutions - Parcela 2/4', value: 55000, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 5), companyId: company.id } }),
        prisma.financialEntry.create({ data: { type: 'revenue', category: 'Consultoria', description: 'Diagnóstico Indústria Nacional', value: 40000, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 10), companyId: company.id } }),
        prisma.financialEntry.create({ data: { type: 'revenue', category: 'Treinamento', description: 'Workshop Liderança - Horizonte', value: 25000, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 12), companyId: company.id } }),
        prisma.financialEntry.create({ data: { type: 'revenue', category: 'Mensalidade', description: 'Contrato Mensal - Varejo Express', value: 15000, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), recurring: true, companyId: company.id } }),
        prisma.financialEntry.create({ data: { type: 'revenue', category: 'Consultoria', description: 'Assessment Cultural - 3 empresas', value: 10000, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15), companyId: company.id } }),
        // Current month costs
        prisma.financialEntry.create({ data: { type: 'cost', category: 'Folha de Pagamento', description: 'Salários + Encargos', value: 52000, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 5), recurring: true, companyId: company.id } }),
        prisma.financialEntry.create({ data: { type: 'cost', category: 'Infraestrutura', description: 'Aluguel + Utilities', value: 12000, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), recurring: true, companyId: company.id } }),
        prisma.financialEntry.create({ data: { type: 'cost', category: 'Marketing', description: 'Campanha LinkedIn + Google', value: 8000, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 3), companyId: company.id } }),
        prisma.financialEntry.create({ data: { type: 'cost', category: 'Tecnologia', description: 'SaaS Tools + Licenças', value: 5000, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), recurring: true, companyId: company.id } }),
        prisma.financialEntry.create({ data: { type: 'cost', category: 'Viagens', description: 'Deslocamento consultores', value: 8000, date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 8), companyId: company.id } }),
        // Previous month
        prisma.financialEntry.create({ data: { type: 'revenue', category: 'Consultoria', description: 'Faturamento mês anterior', value: 129000, date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 15), companyId: company.id } }),
        prisma.financialEntry.create({ data: { type: 'cost', category: 'Operacional', description: 'Custos mês anterior', value: 74000, date: new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 15), companyId: company.id } }),
        // Cash reserve (historical)
        prisma.financialEntry.create({ data: { type: 'revenue', category: 'Acumulado', description: 'Reserva acumulada de meses anteriores', value: 500000, date: new Date(2025, 11, 31), companyId: company.id } }),
        prisma.financialEntry.create({ data: { type: 'cost', category: 'Acumulado', description: 'Custos acumulados de meses anteriores', value: 180000, date: new Date(2025, 11, 31), companyId: company.id } }),
    ]);

    // 9. People
    const departments = [
        { name: 'Comercial', people: ['Fernanda Santos', 'Ricardo Alves', 'Mariana Costa', 'Lucas Oliveira', 'Patrícia Lima', 'André Souza', 'Camila Ferreira', 'Bruno Nascimento', 'Juliana Martins', 'Felipe Rodrigues', 'Aline Pereira', 'Gustavo Mendes'] },
        { name: 'Tecnologia', people: ['Carlos Machado', 'Amanda Ribeiro', 'Thiago Cardoso', 'Larissa Gomes', 'Eduardo Nunes', 'Isabela Araujo', 'Vinícius Barros', 'Natália Castro'] },
        { name: 'Operações', people: ['Roberto Junior', 'Sandra Viana', 'Marcos Paulo', 'Tatiana Lopes', 'Renato Freitas', 'Vanessa Moura', 'Diego Ramos', 'Priscila Dias', 'Artur Nogueira', 'Elaine Cavalcanti', 'Hugo Teixeira', 'Rafaela Monteiro', 'Daniel Correia', 'Simone Rezende', 'Otávio Cunha'] },
        { name: 'Financeiro', people: ['Ana Paula', 'Beatriz Carvalho', 'Miguel Fonseca', 'Cláudia Duarte'] },
        { name: 'RH', people: ['Juliana Rosa', 'Karen Torres', 'Leonardo Pinto'] },
    ];

    const roles: Record<string, string[]> = {
        'Comercial': ['Gerente Comercial', 'Executivo de Vendas', 'Analista Comercial', 'SDR', 'Key Account Manager'],
        'Tecnologia': ['Tech Lead', 'Desenvolvedor Full Stack', 'Desenvolvedor Front-end', 'Analista de BI', 'DevOps'],
        'Operações': ['Diretor de Operações', 'Consultor Sênior', 'Consultor Pleno', 'Analista de Processos', 'Coordenador de Projetos'],
        'Financeiro': ['Controller', 'Analista Financeiro', 'Assistente Fiscal', 'Analista Contábil'],
        'RH': ['Gerente de RH', 'Analista de DP', 'Analista de R&S'],
    };

    for (const dept of departments) {
        for (let i = 0; i < dept.people.length; i++) {
            const deptRoles = roles[dept.name] || ['Colaborador'];
            await prisma.person.create({
                data: {
                    name: dept.people[i],
                    role: deptRoles[i % deptRoles.length],
                    department: dept.name,
                    hireDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                    salary: 4000 + Math.floor(Math.random() * 12000),
                    status: 'active',
                    companyId: company.id,
                },
            });
        }
    }

    // 10. Alerts
    await Promise.all([
        prisma.alert.create({ data: { title: 'Fluxo de Caixa Projetado', description: 'Previsão de caixa negativo para dia 25/02. Necessário aporte ou antecipação de recebíveis.', type: 'financial', priority: 'high', companyId: company.id } }),
        prisma.alert.create({ data: { title: 'Gargalo em Negociação', description: 'Estágio de Negociação no funil de vendas está com 168% da capacidade. Redistribuir responsáveis.', type: 'operational', priority: 'high', companyId: company.id } }),
        prisma.alert.create({ data: { title: 'Margem em Queda', description: 'Custos operacionais subiram 15% este mês, impactando a margem direta. Revisar orçamento.', type: 'financial', priority: 'medium', companyId: company.id } }),
        prisma.alert.create({ data: { title: 'Turnover no Comercial', description: '3 desligamentos no setor comercial nos últimos 30 dias. Avaliar clima e remuneração.', type: 'people', priority: 'medium', companyId: company.id } }),
        prisma.alert.create({ data: { title: 'Avaliação de Desempenho Pendente', description: 'Ciclo trimestral pendente para 5 gestores. Prazo encerra em 3 dias.', type: 'people', priority: 'low', companyId: company.id } }),
        prisma.alert.create({ data: { title: 'Meta de Expansão Atrasada', description: 'Progresso da meta de abertura de nova filial está 10% atrasado vs timeline.', type: 'strategic', priority: 'low', companyId: company.id } }),
    ]);

    console.log('✅ Seed completed successfully!');
    console.log(`📧 Login: admin@yf.com.br / admin123`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
