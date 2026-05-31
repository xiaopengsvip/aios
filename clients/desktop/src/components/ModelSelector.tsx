import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";

interface Model {
  id: string;
  name: string;
  displayName: any;
  providerName?: string;
  supportsVision?: boolean;
  contextWindow?: number;
}

interface ModelSelectorProps {
  selected: Model | null;
  onSelect: (model: Model) => void;
}

export function ModelSelector({ selected, onSelect }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getModels().then(d => setModels(d.models || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getName = (m: Model) => {
    if (!m.displayName) return m.name;
    if (typeof m.displayName === "string") return m.displayName;
    return m.displayName["zh-CN"] || m.displayName["en-US"] || m.name;
  };

  const filtered = models.filter(m =>
    !search || getName(m).toLowerCase().includes(search.toLowerCase()) || m.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, m) => {
    const key = m.providerName || "其他";
    (acc[key] = acc[key] || []).push(m);
    return acc;
  }, {} as Record<string, Model[]>);

  return (
    <div className="model-selector" ref={ref}>
      <button className="model-button" onClick={() => setOpen(!open)}>
        <span>{selected ? getName(selected) : "选择模型"}</span>
        <span className="arrow">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="model-dropdown">
          <input
            className="model-search"
            placeholder="搜索模型..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div className="model-list">
            {Object.entries(grouped).map(([provider, models]) => (
              <div key={provider}>
                <div className="provider-header">{provider}</div>
                {models.map(m => (
                  <button
                    key={m.id}
                    className={`model-item ${selected?.id === m.id ? "active" : ""}`}
                    onClick={() => { onSelect(m); setOpen(false); }}
                  >
                    <span className="model-name">{getName(m)}</span>
                    <span className="model-meta">
                      {m.supportsVision && "👁 "}
                      {m.contextWindow ? `${Math.round(m.contextWindow / 1000)}K` : ""}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
