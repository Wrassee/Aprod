import { useState } from "react";
import { CheckCircle, Zap, Settings, Filter, Save, ArrowLeft, ArrowRight } from "lucide-react";

const DEVICES = [
  { id: "hv", label: "Hauptverteilung" },
  { id: "uv1", label: "UV 1 – Aufzugsraum" },
  { id: "uv2", label: "UV 2 – Beleuchtung" },
  { id: "sv", label: "Sicherungsverteiler" },
  { id: "ns1", label: "Netzschalter 1" },
];

const COLS = [
  { key: "biztositek", label: "Biztosíték", short: "Biz.", type: "select", options: ["6A","10A","16A","20A","25A","32A"], group: "Névleges áram" },
  { key: "kismegszakito", label: "Kismegszakító", short: "KM", type: "select", options: ["B6","B10","B16","B20","C16","C25"], group: "Névleges áram" },
  { key: "tipusjelzes", label: "Típusjelzés", short: "Típus", type: "text", group: "" },
  { key: "npe", label: "N-PE", short: "N-PE", type: "text", group: "Szigetelés (MΩ)" },
  { key: "l1pe", label: "L1-PE", short: "L1", type: "text", group: "Szigetelés (MΩ)" },
  { key: "l2pe", label: "L2-PE", short: "L2", type: "text", group: "Szigetelés (MΩ)" },
  { key: "l3pe", label: "L3-PE", short: "L3", type: "text", group: "Szigetelés (MΩ)" },
  { key: "iccLN", label: "L-N", short: "L-N", type: "text", group: "Icc (A)" },
  { key: "iccLPE", label: "L-PE", short: "L-PE", type: "text", group: "Icc (A)" },
  { key: "fiIn", label: "FI In (mA)", short: "In", type: "text", group: "FI" },
  { key: "fiDin", label: "FI ΔIn (ms)", short: "ΔIn", type: "text", group: "FI" },
  { key: "fiTest", label: "FI Teszt", short: "Test", type: "select", options: ["OK","NOK","N/A"], group: "FI" },
];

function getGroups() {
  const map = new Map<string, { start: number; span: number }>();
  COLS.forEach((col, i) => {
    const g = col.group || "–";
    if (!map.has(g)) map.set(g, { start: i, span: 0 });
    map.get(g)!.span++;
  });
  return map;
}

type Measurements = Record<string, Record<string, string>>;

export function DesktopTable() {
  const [measurements, setMeasurements] = useState<Measurements>({});
  const groups = getGroups();

  const update = (deviceId: string, key: string, value: string) => {
    setMeasurements(prev => ({
      ...prev,
      [deviceId]: { ...(prev[deviceId] || {}), [key]: value }
    }));
  };

  const filledDevices = DEVICES.filter(d =>
    Object.values(measurements[d.id] || {}).some(Boolean)
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/20 flex flex-col">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4">
        {[
          { label: "Összes Eszköz", value: DEVICES.length, color: "from-blue-600 to-cyan-500" },
          { label: "Kitöltött", value: filledDevices, color: "from-green-500 to-teal-500" },
          { label: "Kitöltöttség", value: `${Math.round((filledDevices / DEVICES.length) * 100)}%`, color: "from-purple-600 to-fuchsia-500" },
        ].map(s => (
          <div key={s.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.color} p-0.5 shadow-lg`}>
            <div className="bg-white rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-0.5">{s.label}</div>
                <div className={`text-3xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow`}>
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="mx-6 mb-4 rounded-2xl shadow-xl border-2 border-blue-100 overflow-hidden flex-1">
        {/* Card header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-lg">Niedervolt Installációk Mérései</div>
              <div className="text-blue-100 text-xs">Niedervolt szabályzat 14. cikkely</div>
            </div>
          </div>
          <button className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
            <Filter className="h-4 w-4" /> Eszközök ({DEVICES.length})
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50">
                <th rowSpan={2} className="border-r border-blue-200 p-3 text-left font-bold text-blue-800 align-bottom min-w-[180px]">
                  Eszköz / Baugruppe
                </th>
                {Array.from(groups.entries()).map(([name, { span }]) => (
                  <th key={name} colSpan={span} className="border-r border-blue-200 px-3 py-2 text-center font-bold text-blue-700 text-xs border-b border-blue-200">
                    {name === "–" ? "" : name}
                  </th>
                ))}
              </tr>
              <tr className="bg-gradient-to-r from-blue-50 via-sky-50 to-cyan-50">
                {COLS.map(col => (
                  <th key={col.key} className="border-r border-blue-200 px-2 py-2 text-center font-semibold text-blue-700 text-xs whitespace-nowrap">
                    {col.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DEVICES.map((device, index) => {
                const m = measurements[device.id] || {};
                const filled = Object.values(m).filter(Boolean).length;
                return (
                  <tr key={device.id} className="group hover:bg-blue-50/40 transition-colors border-l-4 border-transparent hover:border-blue-400">
                    <td className="border-r border-gray-200 p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-sky-500 px-2 py-0.5 rounded-lg">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-800">{device.label}</span>
                        {filled === COLS.length && (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />
                        )}
                      </div>
                    </td>
                    {COLS.map(col => (
                      <td key={col.key} className="border-r border-gray-200 p-1.5">
                        {col.type === "select" ? (
                          <select
                            className="w-full text-xs border border-blue-200 rounded-lg px-1.5 py-1.5 focus:outline-none focus:border-blue-500 bg-white min-w-[64px]"
                            value={m[col.key] || ""}
                            onChange={e => update(device.id, col.key, e.target.value)}
                          >
                            <option value="">-</option>
                            {col.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            type="text"
                            className="w-full text-xs border border-blue-200 rounded-lg px-1.5 py-1.5 text-center focus:outline-none focus:border-blue-500 bg-white min-w-[52px]"
                            value={m[col.key] || ""}
                            placeholder="-"
                            onChange={e => update(device.id, col.key, e.target.value)}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-6 flex justify-between gap-3">
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-blue-500 text-blue-600 font-semibold hover:bg-blue-50 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Vissza
        </button>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-blue-500 text-blue-600 font-semibold bg-white hover:bg-blue-50 transition-colors">
            <Save className="h-4 w-4" /> Mentés
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all">
            Tovább <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
