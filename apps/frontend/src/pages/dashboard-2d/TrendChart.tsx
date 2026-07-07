import ReactEChartsCore from 'echarts-for-react/esm/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useMemo } from 'react';

echarts.use([LineChart, GridComponent, TooltipComponent, CanvasRenderer]);

interface TrendChartProps {
  data: {
    timestamp: number;
    speed: number;
    rpm: number;
    coolantTemp: number;
    batteryVoltage: number;
  }[];
  dataKey: 'speed' | 'rpm' | 'coolantTemp' | 'batteryVoltage';
  color: string;
  unit: string;
}

export default function TrendChart({ data, dataKey, color, unit }: TrendChartProps) {
  const option = useMemo(() => {
    const values = data.map((d) => d[dataKey]);

    const labels = data.map((d) => {
      const s = Math.floor((Date.now() - d.timestamp) / 1000);
      return `-${s}s`;
    });

    return {
      grid: { left: 40, right: 10, top: 10, bottom: 25 },
      xAxis: {
        type: 'category' as const,
        data: labels,
        axisLabel: { color: '#64748b', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        name: unit,
        nameTextStyle: { color: '#64748b', fontSize: 10 },
      },
      series: [
        {
          type: 'line' as const,
          data: values,
          smooth: true,
          symbol: 'none',
          lineStyle: { color, width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: `${color}33` },
              { offset: 1, color: `${color}00` },
            ]),
          },
        },
      ],
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#1a2235',
        borderColor: '#1e293b',
        textStyle: { color: '#e2e8f0', fontSize: 12 },
      },
      animation: false,
    };
  }, [data, dataKey, color, unit]);

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: '100%', minHeight: 180 }}
      notMerge
    />
  );
}
