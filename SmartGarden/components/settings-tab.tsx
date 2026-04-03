"use client"

import React, { useState, useEffect } from "react"
import { Check, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function SettingsTab({ thresholds, onSaveThresholds, onAddPump }: any) {
  const [localThresholds, setLocalThresholds] = useState(thresholds)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLocalThresholds(thresholds)
  }, [thresholds])

  const handleSave = () => {
    onSaveThresholds(localThresholds)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <section className="bg-card rounded-3xl p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">Threshold Configuration</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm text-muted-foreground mb-2 block">Min Temp (°C)</label><Input type="number" value={localThresholds.minTemp} onChange={(e) => setLocalThresholds({ ...localThresholds, minTemp: +e.target.value })} className="rounded-xl" /></div>
            <div><label className="text-sm text-muted-foreground mb-2 block">Max Temp (°C)</label><Input type="number" value={localThresholds.maxTemp} onChange={(e) => setLocalThresholds({ ...localThresholds, maxTemp: +e.target.value })} className="rounded-xl" /></div>
          </div>
          <div><label className="text-sm text-muted-foreground mb-2 block">Moisture Threshold (%)</label><Input type="number" value={localThresholds.moistureThreshold} onChange={(e) => setLocalThresholds({ ...localThresholds, moistureThreshold: +e.target.value })} className="rounded-xl" /></div>
          <div><label className="text-sm text-muted-foreground mb-2 block">Max Light (%)</label><Input type="number" value={localThresholds.maxLight} onChange={(e) => setLocalThresholds({ ...localThresholds, maxLight: +e.target.value })} className="rounded-xl" /></div>
          <Button onClick={handleSave} className={cn("w-full rounded-xl transition-all", saved ? "bg-primary/80 text-primary-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
            {saved ? <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Saved!</span> : "Save Configuration"}
          </Button>
        </div>
      </section>
      <section className="bg-card rounded-3xl p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">Device Management</h2>
        <Button variant="outline" onClick={onAddPump} className="w-full rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-colors"><Plus className="w-4 h-4 mr-2" />Add New Pump</Button>
      </section>
      <section className="bg-card rounded-3xl p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-2">About Smart Garden</h2>
        <p className="text-sm text-muted-foreground">Version 1.0.0 - IoT Pump Management System for smart agriculture and gardening.</p>
      </section>
    </div>
  )
}

export function EmptyStateSettings({ onAddPump }: { onAddPump: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6"><Settings className="w-12 h-12 text-muted-foreground" /></div>
      <h2 className="text-lg font-semibold text-foreground mb-2 text-center">No Pump Selected</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-xs">Add a pump to configure thresholds.</p>
      <Button variant="outline" onClick={onAddPump} className="rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-colors"><Plus className="w-4 h-4 mr-2" />Add New Pump</Button>
    </div>
  )
}