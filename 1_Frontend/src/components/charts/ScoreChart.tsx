/**
 * AI 평가 점수 추이 차트 - 동적 로딩 컴포넌트
 * 성능 최적화: Recharts 라이브러리를 필요시에만 로드
 */
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  month: string;
  total: number;
  claude: number;
  chatgpt: number;
  grok: number;
}

interface ScoreChartProps {
  data: ChartDataPoint[];
  height?: number;
}

export default function ScoreChart({ data, height = 300 }: ScoreChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const parts = value.split('-');
            return parts.length === 2 ? `${parts[1]}월` : value;
          }}
        />
        <YAxis domain={[800, 1000]} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number, name: string) => {
            const nameMap: Record<string, string> = {
              total: '종합',
              claude: 'Claude',
              chatgpt: 'ChatGPT',
              grok: 'Grok',
            };
            return [value, nameMap[name] || name];
          }}
          labelFormatter={(label) => {
            const parts = label.split('-');
            return parts.length === 2 ? `${parts[0]}년 ${parts[1]}월` : label;
          }}
        />
        <Legend
          formatter={(value: string) => {
            const nameMap: Record<string, string> = {
              total: '종합',
              claude: 'Claude',
              chatgpt: 'ChatGPT',
              grok: 'Grok',
            };
            return nameMap[value] || value;
          }}
        />
        <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} name="total" />
        <Line type="monotone" dataKey="claude" stroke="#FF6B00" strokeWidth={2} name="claude" />
        <Line type="monotone" dataKey="chatgpt" stroke="#10A37F" strokeWidth={2} name="chatgpt" />
        <Line type="monotone" dataKey="grok" stroke="#1DA1F2" strokeWidth={2} name="grok" />
      </LineChart>
    </ResponsiveContainer>
  );
}
