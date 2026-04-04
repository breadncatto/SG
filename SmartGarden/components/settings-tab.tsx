"use client"

import React, { useState, useEffect } from "react"
import { Check, Plus, Settings, Trash2, AlertTriangle, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface SettingsTabProps {
  thresholds: any
  onSaveThresholds: (thresholds: any) => void
  onAddPump: () => void
  onDeletePump: () => void
  useMockData: boolean
  setUseMockData: (val: boolean) => void
}

export function SettingsTab({ thresholds, onSaveThresholds, onAddPump, onDeletePump, useMockData, setUseMockData }: SettingsTabProps) {
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      
      {/* 1. THRESHOLD CONFIGURATION */}
      <section className="bg-card rounded-3xl p-5 shadow-sm border border-border/50">
        <h2 className="font-semibold text-foreground mb-4">Threshold Configuration</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Min Temp (°C)</label>
              <Input type="number" value={localThresholds.minTemp} onChange={(e) => setLocalThresholds({ ...localThresholds, minTemp: +e.target.value })} className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Max Temp (°C)</label>
              <Input type="number" value={localThresholds.maxTemp} onChange={(e) => setLocalThresholds({ ...localThresholds, maxTemp: +e.target.value })} className="rounded-xl" />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Moisture Threshold (%)</label>
            <Input type="number" value={localThresholds.moistureThreshold} onChange={(e) => setLocalThresholds({ ...localThresholds, moistureThreshold: +e.target.value })} className="rounded-xl" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Max Light (lux)</label>
            <Input type="number" value={localThresholds.maxLight} onChange={(e) => setLocalThresholds({ ...localThresholds, maxLight: +e.target.value })} className="rounded-xl" />
          </div>
          <Button onClick={handleSave} className={cn("w-full rounded-xl transition-all mt-2", saved ? "bg-primary/80 text-primary-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
            {saved ? <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Saved!</span> : "Save Configuration"}
          </Button>
        </div>
      </section>

      {/* 2. DEVELOPER OPTIONS (MOCK TOGGLE) */}
      <section className="bg-card rounded-3xl p-5 shadow-sm border-l-4 border-l-amber-500">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-500" /> Developer Options
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Use Mock Data for Analytics</span>
          <button 
            onClick={() => setUseMockData(!useMockData)}
            className={cn("w-12 h-6 rounded-full transition-colors relative", useMockData ? "bg-amber-500" : "bg-muted")}
          >
            <div className={cn("w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform", useMockData ? "translate-x-6" : "translate-x-0.5")} />
          </button>
        </div>
      </section>

      {/* 3. DEVICE MANAGEMENT */}
      <section className="bg-card rounded-3xl p-5 shadow-sm border border-border/50">
        <h2 className="font-semibold text-foreground mb-4">Device Management</h2>
        <div className="space-y-3">
          <Button variant="outline" onClick={onAddPump} className="w-full rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-colors">
            <Plus className="w-4 h-4 mr-2" />Add New Pump
          </Button>
          
          <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="w-full rounded-xl border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors">
            <Trash2 className="w-4 h-4 mr-2" />Delete This Pump
          </Button>
        </div>
      </section>

      {/* 4. ABOUT */}
      <section className="bg-card rounded-3xl p-5 shadow-sm border border-border/50">
        <h2 className="font-semibold text-foreground mb-2">About Smart Garden</h2>
        <p className="text-sm text-muted-foreground">Version 1.0.0 - IoT Pump Management System for smart agriculture and gardening.</p>
      </section>

      {/* DIALOG XÁC NHẬN XÓA BƠM */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Delete Pump
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            Are you sure you want to delete this pump and all its sensors? This action cannot be undone and will erase all associated logs.
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={() => { onDeletePump(); setShowDeleteConfirm(false); }} className="rounded-xl">
              Yes, Delete It
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
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <Settings className="w-12 h-12 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2 text-center">No Pump Selected</h2>
      <p className="text-muted-foreground text-center mb-8 max-w-xs">Add a pump to configure thresholds.</p>
      <Button variant="outline" onClick={onAddPump} className="rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-colors">
        <Plus className="w-4 h-4 mr-2" />Add New Pump
      </Button>
    </div>
  )
}