"use client"

import React from "react"
import { Wifi, Thermometer, Sun, Droplets, Beaker, Power, Plus, Loader2, Trash2, AlertTriangle, ArrowUpRight, Sprout, History } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { SensorType, Sensor } from "@/types/smart-garden"

export function DashboardTab({ 
  sensorData, mode, onModeSwitch, isPumpOn, onPowerToggle, onSensorClick, 
  thresholds, sensors, onAddSensor, onDeleteSensor, allSensorsConnected, 
  pumpLogs, 
  onNavigateToLogs 
}: any) {
  const recentLogs = [...(pumpLogs || [])]
    .sort((a, b) => {
      const timeA = new Date(a.timestamp || a.createdAt || 0).getTime();
      const timeB = new Date(b.timestamp || b.createdAt || 0).getTime();
      return timeB - timeA;
    })
    .slice(0, 3);
  const hasTemp = sensors.some((s: Sensor) => s.type === "Temperature")
  const hasMoisture = sensors.some((s: Sensor) => s.type === "Moisture")
  const hasLight = sensors.some((s: Sensor) => s.type === "Light")
  const hasSensors = sensors.length > 0

  const isTempCritical = hasTemp && sensorData.temp > thresholds.maxTemp
  const isMoistureCritical = hasMoisture && sensorData.moisture < thresholds.moistureThreshold
  const isLightCritical = hasLight && sensorData.light > thresholds.maxLight

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Sensor Readings</h2>
        <div className="grid grid-cols-2 gap-3">
          {!hasSensors && (
            <div className="col-span-2 bg-card rounded-3xl p-6 shadow-sm border-2 border-dashed border-border text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3 mx-auto"><Wifi className="w-6 h-6 text-muted-foreground" /></div>
              <p className="text-foreground font-medium mb-1">No sensors connected yet</p>
              <p className="text-sm text-muted-foreground">Add sensors below to start monitoring.</p>
            </div>
          )}
          {hasTemp && <SensorCard icon={Thermometer} label="Temperature" value={sensorData.temp} unit="°C" onClick={() => onSensorClick("temp")} isCritical={isTempCritical} />}
          {hasLight && <SensorCard icon={Sun} label="Light Intensity" value={sensorData.light} unit="lx" onClick={() => onSensorClick("light")} isCritical={isLightCritical} />}
          {hasMoisture && (
            <div className={cn(hasTemp && hasLight ? "col-span-2" : hasTemp || hasLight ? "" : "col-span-2")}>
              <SensorCard icon={Droplets} label="Soil Moisture" value={sensorData.moisture} unit="%" variant="primary" onClick={() => onSensorClick("moisture")} isCritical={isMoistureCritical} />
            </div>
          )}
          <div className="col-span-2"><SensorCard icon={Beaker} label="Today's Water Volume" value={sensorData.waterVolume} unit="L" onClick={() => onSensorClick("waterVolume")} /></div>
        </div>
      </section>

      <section className="bg-card rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <span className="text-foreground font-semibold">Pump Control</span>
          <div className="flex bg-muted rounded-full p-1">
            {["AUTO", "MANUAL"].map((m) => (
              <button 
                key={m} 
                onClick={() => { if (mode !== m) onModeSwitch(m) }} 
                className={cn("px-4 py-2 rounded-full text-xs font-bold transition-all", 
                  mode === m ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className={cn("flex items-center justify-between p-4 rounded-2xl border transition-all", 
          isPumpOn ? "bg-primary/5 border-primary/20" : "bg-muted/50 border-transparent"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-all", 
              isPumpOn ? "bg-primary shadow-lg shadow-primary/20" : "bg-muted-foreground/20")
            }>
              <Power className={cn("w-6 h-6", isPumpOn ? "text-primary-foreground" : "text-muted-foreground")} />
            </div>
            <p className="font-bold text-sm text-foreground">
              {isPumpOn ? "Running" : "Stopped"}
            </p>
          </div>
          <Switch 
            checked={isPumpOn} 
            onCheckedChange={(checked) => { if (mode === "MANUAL") onPowerToggle(checked) }} 
            disabled={mode === "AUTO"} 
            className="scale-125" 
          />
        </div>
      </section>

      {/* pump log */}
      {/* recent activity log */}
      <section className="bg-card rounded-3xl p-5 shadow-sm border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground text-sm tracking-wide flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Recent Activity
          </h2>
          {/* tab log btn */}
          <button 
            onClick={onNavigateToLogs}
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md transition-colors hover:bg-primary/20"
          >
            See All
          </button>
        </div>

        <div className="space-y-3">
          {pumpLogs && pumpLogs.length > 0 ? (
            [...pumpLogs]
              .sort((a, b) => {
                const timeA = new Date(a.timestamp || a.createdAt || a.created_at || 0).getTime();
                const timeB = new Date(b.timestamp || b.createdAt || b.created_at || 0).getTime();
                return timeB - timeA; 
              })
              .slice(0, 3) 
              .map((log: any, index: number) => {
                let actionText = log.action;
                if (actionText === 'ON') actionText = 'Pump turned ON';
                if (actionText === 'OFF') actionText = 'Pump turned OFF';
                if (!actionText) actionText = log.isTurnOn ? 'Pump turned ON' : 'Pump turned OFF';

                const logMode = log.mode || (log.isAuto ? 'AUTO' : 'MANUAL') || 'MANUAL';
                const isSuccess = log.status === 'Success' || log.status === 'SUCCESS' || (log.success !== false && log.status !== 'Failed');
                const timeString = log.timestamp || log.createdAt || log.created_at;

                return (
                  <div key={index} className="flex flex-col p-3 bg-muted/50 rounded-2xl border border-border/50 text-xs transition-colors hover:bg-muted">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold flex items-center gap-1.5 text-foreground">
                        <span className={cn("w-2 h-2 rounded-full", 
                          actionText.includes('ON') ? "bg-primary" : "bg-muted-foreground"
                        )} />
                        {actionText}
                      </span>
                      <span className="text-muted-foreground font-medium">
                        {timeString ? new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Unknown time'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Mode: <span className="font-medium text-foreground">{logMode}</span>
                      </span>
                      <span className={cn("font-medium px-2 py-0.5 rounded-full text-[10px]", 
                        isSuccess ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                      )}>
                        {isSuccess ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  </div>
                )
              })
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <History className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No recent pump activities recorded.</p>
            </div>
          )}
        </div>
      </section>


      <section className="bg-card rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">Device Status</h2>
          {!allSensorsConnected && (
            <button onClick={onAddSensor} className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </button>
          )}
        </div>
        <div className="space-y-3">
          {sensors.filter((s: Sensor) => !s.type.toLowerCase().includes("water")).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No sensors added yet</p>
          ) : (
            sensors
              .filter((s: Sensor) => !s.type.toLowerCase().includes("water"))
              .map((sensor: Sensor) => (
              <div 
                key={sensor.id} 
                className={cn(
                  "flex items-center justify-between py-2 transition-all duration-300", 
                  sensor.connectionStatus === "connecting" && "opacity-50 pointer-events-none grayscale-[30%]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    {sensor.type === "Temperature" && <Thermometer className="w-4 h-4 text-primary" />}
                    {sensor.type === "Moisture" && <Droplets className="w-4 h-4 text-primary" />}
                    {sensor.type === "Light" && <Sun className="w-4 h-4 text-primary" />}
                  </div>
                  <div>
                    <span className="text-foreground text-sm font-medium">{sensor.type} Sensor</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {sensor.connectionStatus === "connecting" ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-sm font-medium text-primary">Pending...</span>
                    </div>
                  ) : sensor.connectionStatus === "failed" ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="text-sm font-medium text-destructive">Failed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={cn("w-2 h-2 rounded-full", sensor.status === "Online" ? "bg-green-500" : "bg-destructive")} />
                      <span className={cn("text-sm font-medium", sensor.status === "Online" ? "text-green-600" : "text-destructive")}>{sensor.status}</span>
                    </div>
                  )}
                  <button onClick={() => onDeleteSensor(sensor)} className="p-1.5 rounded-lg hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function SensorCard({ icon: Icon, label, value, unit, variant = "default", onClick, isCritical = false }: any) {
  return (
    <button onClick={onClick} className={cn("w-full text-left rounded-3xl p-5 shadow-sm relative overflow-hidden group transition-shadow", isCritical ? "bg-red-50" : variant === "primary" ? "bg-primary text-primary-foreground" : "bg-card text-foreground")}>
      {isCritical && <div className="absolute top-3 right-3"><AlertTriangle className="w-5 h-5 text-destructive animate-pulse" /></div>}
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isCritical ? "bg-red-100" : variant === "primary" ? "bg-primary-foreground/20" : "bg-muted")}><Icon className={cn("w-5 h-5", isCritical ? "text-destructive" : variant === "primary" ? "text-primary-foreground" : "text-primary")} /></div>
        {!isCritical && <ArrowUpRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100", variant === "primary" ? "text-primary-foreground/70" : "text-muted-foreground")} />}
      </div>
      <p className={cn("text-3xl font-bold", isCritical ? "text-destructive" : variant === "primary" ? "text-primary-foreground" : "text-foreground")}>{value}<span className="text-lg font-normal ml-1">{unit}</span></p>
      <p className={cn("text-sm mt-1", isCritical ? "text-destructive/70" : variant === "primary" ? "text-primary-foreground/70" : "text-muted-foreground")}>{label}</p>
    </button>
  )
}

export function EmptyState({ onAddPump }: { onAddPump: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-6"><Sprout className="w-16 h-16 text-primary" /></div>
      <h2 className="text-xl font-semibold text-foreground mb-2 text-center">You haven't added any pumps yet</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-xs">Add your first pump to start monitoring your garden</p>
      <Button onClick={onAddPump} className="px-8 py-6 rounded-2xl bg-primary text-primary-foreground text-lg font-medium"><Plus className="w-5 h-5 mr-2" />Add Your First Pump</Button>
    </div>
  )
}