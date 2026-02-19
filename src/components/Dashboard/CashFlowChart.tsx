
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from './RechartsWrapper';

interface CashFlowChartProps {
    data: {
        month: string;
        revenue: number;
        costs: number;
        profit: number;
    }[];
}

const CashFlowChart = ({ data }: CashFlowChartProps) => {
    if (!data || data.length === 0) {
        return <div className="h-full flex items-center justify-center text-muted text-sm">Dados insuficientes para o gráfico</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(value: number) =>
                        new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short" }).format(value)
                    }
                />
                <Tooltip
                    cursor={{ fill: '#F3F4F6' }}
                    formatter={(value: number) =>
                        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                    }
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar name="Receita" dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar name="Despesas" dataKey="costs" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default CashFlowChart;
