
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface StaticCashFlowChartProps {
    data: {
        month: string;
        revenue: number;
        costs: number;
        profit: number;
    }[];
}

const StaticCashFlowChart = ({ data }: StaticCashFlowChartProps) => {
    if (!data || data.length === 0) return null;

    // Use standard BarChart without ResponsiveContainer for PDF generation stability
    // Fixed dimensions ensure it renders correctly in the print view
    return (
        <BarChart
            width={700}
            height={300}
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
                tickFormatter={(value) =>
                    new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short" }).format(value)
                }
            />
            <Legend verticalAlign="top" height={36} />
            <Bar name="Receita" dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false} />
            <Bar name="Despesas" dataKey="costs" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={40} isAnimationActive={false} />
        </BarChart>
    );
};

export default StaticCashFlowChart;
