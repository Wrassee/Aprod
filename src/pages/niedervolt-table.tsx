import { useEffect, useState } from "react";
import { format } from "date-fns";
import { de, hu } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarIcon, Plus, Trash } from "lucide-react";

import devicesData from "@/data/niedervolt-devices.json"; // helyi JSON import

type Measurement = { [deviceId: string]: string };

export default function NiedervoltTable() {
  const [language, setLanguage] = useState<"hu" | "de">("hu");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [measurements, setMeasurements] = useState<Measurement>({});
  const [customDevices, setCustomDevices] = useState<string[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  // eszközök betöltése a helyi JSON-ból
  const devices = devicesData || [];

  // localStorage-ból betöltés
  useEffect(() => {
    const savedMeasurements = localStorage.getItem("measurements");
    const savedCustomDevices = localStorage.getItem("customDevices");
    if (savedMeasurements) setMeasurements(JSON.parse(savedMeasurements));
    if (savedCustomDevices) setCustomDevices(JSON.parse(savedCustomDevices));
  }, []);

  // localStorage-ba mentés
  useEffect(() => {
    localStorage.setItem("measurements", JSON.stringify(measurements));
    localStorage.setItem("customDevices", JSON.stringify(customDevices));
  }, [measurements, customDevices]);

  const handleMeasurementChange = (deviceId: string, value: string) => {
    setMeasurements((prev) => ({ ...prev, [deviceId]: value }));
  };

  const addCustomDevice = () => {
    if (selectedDevice && !customDevices.includes(selectedDevice)) {
      setCustomDevices((prev) => [...prev, selectedDevice]);
      setSelectedDevice(null);
    }
  };

  const removeCustomDevice = (device: string) => {
    setCustomDevices((prev) => prev.filter((d) => d !== device));
  };

  // statisztikák a progress bar-hoz
  const totalDevices = devices.length + customDevices.length;
  const filledDevices = Object.values(measurements).filter((v) => v !== "").length;
  const progress = totalDevices > 0 ? (filledDevices / totalDevices) * 100 : 0;

  const t = {
    hu: {
      title: "Niedervolt protokoll",
      newProtocol: "Új protokoll",
      admin: "Admin",
      progress: "Kitöltöttség",
      of: "összesen",
      prev: "Előző",
      save: "Mentés",
      next: "Következő",
      addDevice: "Eszköz hozzáadása",
      customDevices: "Egyedi eszközök",
    },
    de: {
      title: "Niedervolt-Protokoll",
      newProtocol: "Neues Protokoll",
      admin: "Admin",
      progress: "Fortschritt",
      of: "insgesamt",
      prev: "Zurück",
      save: "Speichern",
      next: "Weiter",
      addDevice: "Gerät hinzufügen",
      customDevices: "Benutzerdefinierte Geräte",
    },
  }[language];

  return (
    <div className="p-6 space-y-6">
      {/* Felső fejléc */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date
                  ? format(date, "PPP", { locale: language === "hu" ? hu : de })
                  : "Pick a date"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>{t.newProtocol}</Button>
          <Button variant="outline">{t.admin}</Button>
        </div>
      </div>

      {/* Al fejléc: progress bar + számláló */}
      <div className="flex items-center justify-between">
        <div className="w-full">
          <div className="flex justify-between mb-1">
            <span className="text-base font-medium text-blue-700">
              {t.progress}
            </span>
            <span className="text-sm font-medium text-blue-700">
              {filledDevices} / {totalDevices} {t.of}
            </span>
          </div>
          <Progress value={progress} className="w-full h-2.5" />
        </div>
      </div>

      {/* Statisztika kártyák */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalDevices}</div>
            <p>{language === "hu" ? "Összes eszköz" : "Gesamtgeräte"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filledDevices}</div>
            <p>{language === "hu" ? "Kitöltött" : "Ausgefüllt"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{progress.toFixed(0)}%</div>
            <p>{language === "hu" ? "Kitöltöttség" : "Fortschritt"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Táblázat */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200">
          <thead>
            <tr>
              <th className="border px-4 py-2 text-left">
                {language === "hu" ? "Eszköz" : "Gerät"}
              </th>
              <th className="border px-4 py-2 text-left">
                {language === "hu" ? "Mérés" : "Messung"}
              </th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device: any) => (
              <tr key={device.id}>
                <td className="border px-4 py-2">{device.name}</td>
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    value={measurements[device.id] || ""}
                    onChange={(e) =>
                      handleMeasurementChange(device.id, e.target.value)
                    }
                    className="w-full border rounded p-1"
                  />
                </td>
              </tr>
            ))}
            {customDevices.map((device) => (
              <tr key={device}>
                <td className="border px-4 py-2 flex justify-between items-center">
                  {device}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomDevice(device)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </td>
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    value={measurements[device] || ""}
                    onChange={(e) =>
                      handleMeasurementChange(device, e.target.value)
                    }
                    className="w-full border rounded p-1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigációs gombok */}
      <div className="flex justify-between">
        <Button variant="outline">{t.prev}</Button>
        <Button>{t.save}</Button>
        <Button>{t.next}</Button>
      </div>

      {/* Egyedi eszköz hozzáadása */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            {t.addDevice}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.customDevices}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <input
              type="text"
              value={selectedDevice || ""}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full border rounded p-2"
              placeholder={
                language === "hu"
                  ? "Új eszköz neve"
                  : "Name des neuen Geräts"
              }
            />
            <Button onClick={addCustomDevice}>{t.addDevice}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
