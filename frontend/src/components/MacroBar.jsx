import { useEffect, useState } from "react";
import { fetchInterestRates } from "../api.js";

function normalizeRates(data) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.rates)) {
    return data.rates;
  }

  if (typeof data === "object") {
    return Object.entries(data).map(([bank, value]) => {
      if (value && typeof value === "object") {
        return {
          bank: value.bank || value.name || bank,
          rate: value.rate ?? value.value,
          as_of: value.as_of || value.date,
        };
      }

      return { bank, rate: value };
    });
  }

  return [];
}

export default function MacroBar() {
  const [rates, setRates] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchInterestRates();
        if (!cancelled) {
          setRates(normalizeRates(data));
        }
      } catch {
        if (!cancelled) {
          setRates([]);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!rates.length) {
    return null;
  }

  return (
    <div className="macro-bar">
      {rates.slice(0, 4).map((item) => (
        <div key={item.bank} className="macro-item">
          <span>{item.bank}</span>
          <strong>{item.rate != null ? `${Number(item.rate).toFixed(2)}%` : "--"}</strong>
        </div>
      ))}
    </div>
  );
}
