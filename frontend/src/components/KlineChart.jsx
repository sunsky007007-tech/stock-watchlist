import { useEffect, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";

function toChartData(prices) {
  return prices
    .map((item) => ({
      time: item.time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }))
    .sort((a, b) => (a.time < b.time ? -1 : 1));
}

function toVolumeData(prices) {
  return prices
    .map((item) => ({
      time: item.time,
      value: item.volume || 0,
      color: item.close >= item.open ? "#26a69a" : "#ef5350",
    }))
    .sort((a, b) => (a.time < b.time ? -1 : 1));
}

export default function KlineChart({ prices, ticker, years }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !prices?.length) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 520,
      layout: {
        background: { color: "#0f172a" },
        textColor: "#cbd5e1",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#334155" },
      timeScale: { borderColor: "#334155" },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const volumeSeries = chart.addHistogramSeries({
      color: "#64748b",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    candleSeries.setData(toChartData(prices));
    volumeSeries.setData(toVolumeData(prices));
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
  }, [prices, ticker, years]);

  if (!prices?.length) {
    return <div className="chart-empty">暂无 K 线数据</div>;
  }

  return <div ref={containerRef} className="chart-container" />;
}
