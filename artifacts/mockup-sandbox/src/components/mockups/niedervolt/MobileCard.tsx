import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle, Zap, Settings } from "lucide-react";

const DEVICES = [
  { id: "hv", label: "Hauptverteilung" },
  { id: "uv1", label: "UV 1 – Aufzugsraum" },
  { id: "uv2", label: "UV 2 – Beleuchtung" },
  { id: "sv", label: "Sicherungsverteiler" },
];

const FIELDS = [
  { key: "biztositek", label: "Biztosíték", group: "Névleges áram", type: "select", options: ["6A", "10A", "16A", "20A", "25A", "32A"] },
  { key: "kismegszakito", label: "Kismegszakító", group: "Névleges áram", type: "select", options: ["B6", "B10", "B16", "B20", "C16", "C25"] },
  { key: "tipusjelzes", label: "Típusjelzés", group: "", type: "text" },
  { key: "npe", label: "N-PE (MΩ)", group: "Szigetelés", type: "text" },
  { key: "l1pe", label: "L1-PE (MΩ)", group: "Szigetelés", type: "text" },
  { key: "l2pe", label: "L2-PE (MΩ)", group: "Szigetelés", type: "text" },
  { key: "l3pe", label: "L3-PE (MΩ)", group: "Szigetelés", type: "text" },
  { key: "iccLN", label: "L-N (A)", group: "Rövidzárás", type: "text" },
  { key: "iccLPE", label: "L-PE (A)", group: "Rövidzárás", type: "text" },
  { key: "fiIn", label: "FI In (mA)", type: "text" },
  { key: "fiDin", label: "FI ΔIn (ms)", type: "text" },
  { key: "fiTest", label: "FI Teszt", type: "select", options: ["OK", "NOK", "N/A"] },
];

type FieldValues = Record<string, string>;

function groupFields(fields: typeof FIELDS) {
  const groups: { name: string; fields: typeof FIELDS }[] = [];
  const seen = new Set<string>();
  for (const f of fields) {
    const g = f.group || "";
    if (!seen.has(g)) {
      seen.add(g);
      groups.push({ name: g, fields: [] });
    }
    groups[groups.length - 1].fields.push(f);
  }
  return groups;
}

function DeviceCard({ device, index }: { device: typeof DEVICES[0]; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const [values, setValues] = useState<FieldValues>({});
  const filled = Object.values(values).filter(Boolean).length;
  const total = FIELDS.length;
  const percent = Math.round((filled / total) * 100);
  const groups = groupFields(FIELDS);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-blue-100 overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
      >
        <div className="flex items-center gap-2.5">
          <span className="bg-white/20 text-white font-bold text-xs rounded-lg px-2 py-1">{index + 1}</span>
          <span className="font-semibold text-sm">{device.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs text-blue-100">{filled}/{total} mező</div>
            <div className="h-1.5 w-16 bg-white/20 rounded-full mt-0.5 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          {percent === 100
            ? <CheckCircle className="h-5 w-5 text-green-300 flex-shrink-0" />
            : open ? <ChevronUp className="h-5 w-5 opacity-70" /> : <ChevronDown className="h-5 w-5 opacity-70" />
          }
        </div>
      </button>

      {/* Card body */}
      {open && (
        <div className="px-4 pb-4 pt-3 space-y-4">
          {groups.map(group => (
            <div key={group.name}>
              {group.name && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1 bg-blue-100" />
                  <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">{group.name}</span>
                  <div className="h-px flex-1 bg-blue-100" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                {group.fields.map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">{field.label}</label>
                    {field.type === "select" ? (
                      <select
                        className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                        value={values[field.key] || ""}
                        onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                      >
                        <option value="">–</option>
                        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-gray-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                        value={values[field.key] || ""}
                        placeholder="–"
                        onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MobileCard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-cyan-50/30 p-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-4 pt-10 pb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">Niedervolt Mérések</h1>
            <p className="text-blue-100 text-xs">4 eszköz • art. 14</p>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: "Összes", value: "4", icon: Settings },
            { label: "Kitöltött", value: "1", icon: CheckCircle },
            { label: "Haladás", value: "25%", icon: Zap },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-xl p-2.5 text-center backdrop-blur-sm">
              <div className="text-white font-bold text-xl">{s.value}</div>
              <div className="text-blue-100 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Device cards */}
      <div className="px-3 py-4 space-y-3">
        {DEVICES.map((device, i) => (
          <DeviceCard key={device.id} device={device} index={i} />
        ))}
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 px-3 pb-4 pt-2 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent">
        <div className="flex gap-2">
          <button className="flex-1 py-3 rounded-xl border-2 border-blue-500 text-blue-600 font-semibold text-sm">← Vissza</button>
          <button className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm shadow-lg">Mentés & Tovább →</button>
        </div>
      </div>
    </div>
  );
}
