import { useEffect, useRef } from "react";
import { createChart } from "lightweight-charts";

export default function LineChart({ points, height = 260, valueFormatter }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !points?.length) {
      return undefined;
    }

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: "#0f172a" },
        textColor: "#cbd5e1",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      rightPriceScale: { borderColor: "#334155" },
      timeScale: { borderColor: "#334155" },
    });

    const series = chart.addLineSeries({
      color: "#60a5fa",
      lineWidth: 2,
    });

    series.setData(
      [...points]
        .sort((a, b) => (a.time < b.time ? -1 : 1))
        .map((point) => ({ time: point.time, value: point.value }))
    );

    if (valueFormatter) {
      series.applyOptions({
        priceFormat: {
          type: "custom",
          formatter: valueFormatter,
        },
      });
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [points, height, valueFormatter]);

  if (!points?.length) {
    return <div className="chart-empty trend-chart-empty">暂无可绘制趋势数据</div>;
  }

  return <div ref={containerRef} className="trend-chart" />;
}
