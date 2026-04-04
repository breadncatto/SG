"use client"

import React, { useState, useEffect } from "react"
import { Check, Plus, Settings, Trash2, Minus, Thermometer, Droplets, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface SettingsTabProps {
  thresholds: any
  onSaveThresholds: (thresholds: any) => void
  onAddPump: () => void
  onDeletePump: () => void
}

const NumberInput = ({ value, onChange, label, unit }: any) => {
  return (
    <div className="flex justify-between items-center">
      <label className="text-sm text-muted-foreground block">{label}</label>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/50" onClick={() => onChange(Number(value) - 1)}>
          <Minus className="w-4 h-4" />
        </Button>
        <div className="relative">
          <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-20 text-center font-semibold rounded-xl pr-6 h-9 border-border/50 bg-muted/30" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{unit}</span>
        </div>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border/50" onClick={() => onChange(Number(value) + 1)}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export function SettingsTab({ thresholds, onSaveThresholds, onAddPump, onDeletePump }: SettingsTabProps) {
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
    <div className="space-y-6">
      <section className="bg-card rounded-3xl p-5 shadow-sm border border-border/50">
        <h2 className="font-semibold text-foreground mb-4">Threshold Configuration</h2>
        <div className="space-y-5">
          <NumberInput label="Min Temp" unit="°C" value={localThresholds.minTemp} onChange={(v: number) => setLocalThresholds({ ...localThresholds, minTemp: v })} />
          <NumberInput label="Max Temp" unit="°C" value={localThresholds.maxTemp} onChange={(v: number) => setLocalThresholds({ ...localThresholds, maxTemp: v })} />
          <NumberInput label="Moisture Threshold" unit="%" value={localThresholds.moistureThreshold} onChange={(v: number) => setLocalThresholds({ ...localThresholds, moistureThreshold: v })} />
          <NumberInput label="Max Light" unit="lx" value={localThresholds.maxLight} onChange={(v: number) => setLocalThresholds({ ...localThresholds, maxLight: v })} />
          
          <Button onClick={handleSave} className={cn("w-full rounded-xl transition-all", saved ? "bg-primary/80 text-primary-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
            {saved ? <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Saved!</span> : "Save Configuration"}
          </Button>
        </div>
      </section>

      <section className="bg-card rounded-3xl p-5 shadow-sm border border-border/50">
        <h2 className="font-semibold text-foreground mb-4">Device Management</h2>
        <div className="space-y-3">
          <Button variant="outline" onClick={onAddPump} className="w-full rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-colors"><Plus className="w-4 h-4 mr-2" />Add New Pump</Button>
          <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"><Trash2 className="w-4 h-4 mr-2" />Delete This Pump</Button>
        </div>
      </section>

      <section className="bg-card rounded-3xl p-5 shadow-sm border border-border/50">
        <h2 className="font-semibold text-foreground mb-2">About Smart Garden</h2>
        <p className="text-sm text-muted-foreground">Version 1.0.0 - IoT Pump Management System for smart agriculture and gardening.</p>
      </section>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md mx-4 rounded-3xl"><DialogHeader><DialogTitle className="text-destructive flex items-center gap-2">Delete Pump</DialogTitle></DialogHeader>
          <div className="text-sm text-muted-foreground">Are you sure? This action will permanently erase the pump and all connected sensors.</div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={() => { onDeletePump(); setShowDeleteConfirm(false); }} className="rounded-xl">Yes, Delete It</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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