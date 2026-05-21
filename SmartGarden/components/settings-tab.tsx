"use client"

import React, { useState, useEffect } from "react"
import { Wifi, Check, Plus, Settings, Trash2, AlertTriangle, Thermometer, Droplets, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function SettingsTab({ 
  thresholds, 
  onSaveThresholds, 
  onAddPump, 
  onDeletePump, 
  sensors, 
  onAddSensor, 
  onDeleteSensor 
}: any) {
  const [localThresholds, setLocalThresholds] = useState(thresholds)
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    setLocalThresholds(thresholds)
  }, [thresholds])

  const handleSave = () => {
    onSaveThresholds(localThresholds)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="bg-card rounded-3xl p-5 shadow-sm border border-border">
        <h2 className="font-semibold text-foreground mb-4 text-sm tracking-wide">Threshold Configuration</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Min Temp (°C)</label>
              <Input type="number" value={localThresholds.minTemp} onChange={(e) => setLocalThresholds({ ...localThresholds, minTemp: +e.target.value })} className="rounded-xl bg-background border-border text-foreground focus-visible:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Max Temp (°C)</label>
              <Input type="number" value={localThresholds.maxTemp} onChange={(e) => setLocalThresholds({ ...localThresholds, maxTemp: +e.target.value })} className="rounded-xl bg-background border-border text-foreground focus-visible:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Moisture Threshold (%)</label>
            <Input type="number" value={localThresholds.moistureThreshold} onChange={(e) => setLocalThresholds({ ...localThresholds, moistureThreshold: +e.target.value })} className="rounded-xl bg-background border-border text-foreground focus-visible:ring-ring" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Max Light (lx)</label>
            <Input type="number" value={localThresholds.maxLight} onChange={(e) => setLocalThresholds({ ...localThresholds, maxLight: +e.target.value })} className="rounded-xl bg-background border-border text-foreground focus-visible:ring-ring" />
          </div>

          
          
          {/* new added fields*/}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Area (m²)</label>
            <Input 
              type="number" 
              value={localThresholds.area || ''} 
              onChange={(e) => setLocalThresholds({ ...localThresholds, area: +e.target.value })} 
              className="rounded-xl bg-background border-border text-foreground focus-visible:ring-ring" 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Field Capacity</label>
              <Input 
                type="number" 
                value={localThresholds.fieldCapacity || ''} 
                onChange={(e) => setLocalThresholds({ ...localThresholds, fieldCapacity: +e.target.value })} 
                className="rounded-xl bg-background border-border text-foreground focus-visible:ring-ring" 
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Root Depth (m)</label>
              <Input 
                type="number" 
                value={localThresholds.rootDepth || ''} 
                onChange={(e) => setLocalThresholds({ ...localThresholds, rootDepth: +e.target.value })} 
                className="rounded-xl bg-background border-border text-foreground focus-visible:ring-ring" 
              />
            </div>
          </div>

          <Button onClick={handleSave} className={cn("w-full rounded-xl transition-all font-semibold mt-2", saved ? "bg-[#6B9071] text-[#0F2A1D]" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
            {saved ? <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Saved!</span> : "Save Configuration"}
          </Button>
        </div>
      </section>

      {/* sensor config */}
      <section className="bg-card rounded-3xl p-5 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wifi className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground text-sm tracking-wide">Connected Devices</h2>
          </div>
          <Button onClick={onAddSensor} size="sm" variant="secondary" className="rounded-xl h-8 text-xs font-semibold px-3">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Sensor
          </Button>
        </div>

        <div className="space-y-3">
          {!sensors || sensors.filter((s: any) => s.type !== "waterVolume").length === 0 ? (
            <div className="text-center py-6 bg-muted/30 rounded-2xl border border-dashed border-border/60">
              <p className="text-xs text-muted-foreground">No physical sensors added to this pump yet.</p>
            </div>
          ) : (
            sensors
              .filter((s: any) => s.type !== "waterVolume")
              .map((sensor: any) => (
              <div key={sensor.id} className="flex items-center justify-between p-3.5 bg-background rounded-2xl border border-border/60 shadow-sm group hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                    {sensor.type === 'Temperature' && <Thermometer className="w-4 h-4 text-primary" />}
                    {sensor.type === 'Moisture' && <Droplets className="w-4 h-4 text-primary" />}
                    {sensor.type === 'Light' && <Sun className="w-4 h-4 text-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{sensor.type} Sensor</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">ID: {sensor.connectId || sensor.id}</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => onDeleteSensor(sensor)} 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="bg-card rounded-3xl p-5 shadow-sm border border-border">
        <h2 className="font-semibold text-foreground mb-4 text-sm tracking-wide">Device Management</h2>
        <div className="space-y-3">
          <Button variant="outline" onClick={onAddPump} className="w-full rounded-xl border-dashed border-2 border-border text-foreground hover:border-primary hover:text-primary transition-colors bg-transparent">
            <Plus className="w-4 h-4 mr-2" />Add New Pump
          </Button>
          
          <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="w-full rounded-xl border-[#cc0000]/50 text-[#cc0000] hover:bg-[#cc0000] hover:text-white transition-colors bg-transparent">
            <Trash2 className="w-4 h-4 mr-2" />Delete This Pump
          </Button>
        </div>
      </section>

      <section className="bg-card rounded-3xl p-5 shadow-sm border border-border">
        <h2 className="font-semibold text-foreground mb-2 text-sm tracking-wide">About Smart Garden</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">Version 1.0.0 - IoT Pump Management System for smart agriculture and gardening.</p>
      </section>

      {/* delete modal conferm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md mx-4 rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#cc0000] text-sm font-bold">
              <AlertTriangle className="w-4 h-4" /> Delete Pump
            </DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground py-2 leading-relaxed">
            Are you sure you want to delete this pump and all its sensors? This action cannot be undone.
          </div>
          <DialogFooter className="mt-2 flex flex-row gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl flex-1 bg-background border-border text-foreground hover:bg-muted">Cancel</Button>
            <Button variant="destructive" onClick={() => { onDeletePump(); setShowDeleteConfirm(false); }} className="rounded-xl flex-1 bg-[#cc0000] hover:bg-[#aa0000] text-white font-semibold">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    
  )
}

export function EmptyStateSettings({ onAddPump }: { onAddPump: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="w-20 h-20 rounded-full bg-background border border-border flex items-center justify-center mb-6"><Settings className="w-8 h-8 text-muted-foreground" /></div>
      <h2 className="text-base font-semibold text-foreground mb-2 text-center">No Pump Selected</h2>
      <p className="text-xs text-muted-foreground text-center mb-8 max-w-xs">Add a pump to configure thresholds.</p>
      <Button variant="outline" onClick={onAddPump} className="rounded-xl border-dashed border-2 border-border text-foreground hover:border-primary hover:text-primary transition-colors bg-background">
        <Plus className="w-4 h-4 mr-2" />Add New Pump
      </Button>
    </div>
  )
}