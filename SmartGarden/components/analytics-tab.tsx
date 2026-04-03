"use client"

import React, { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Beaker, TrendingUp, Clock, Activity, Thermometer, Droplets, Sun, AlertTriangle, Table, BarChart3 } from "lucide-react"
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Bar, LabelList, LineChart, ReferenceLine, Line } from "recharts"
import { cn } from "@/lib/utils"
import { SensorType } from "@/types/smart-garden"
import { sensorHistoryData } from "@/lib/mock-data"

export function AnalyticsTab({ timeFilter, setTimeFilter, waterUsageData, sensorData, selectedSensor, setSelectedSensor, thresholds }: any) {
  const [showSourceData, setShowSourceData] = useState(false)
  const [dayOffset, setDayOffset] = useState(0)
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  
  const getCurrentOffset = () => timeFilter === "Day" ? dayOffset : timeFilter === "Week" ? weekOffset : monthOffset
  const setCurrentOffset = (delta: number) => {
    if (timeFilter === "Day") setDayOffset(p => p + delta)
    else if (timeFilter === "Week") setWeekOffset(p => p + delta)
    else setMonthOffset(p => p + delta)
  }
  const resetCurrentOffset = () => {
    if (timeFilter === "Day") setDayOffset(0)
    else if (timeFilter === "Week") setWeekOffset(0)
    else setMonthOffset(0)
  }
  const currentOffset = getCurrentOffset()
  
  const englishDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const englishMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  
  const getDateContextLabel = () => {
    const today = new Date()
    if (timeFilter === "Day") {
      const targetDate = new Date(today); targetDate.setDate(today.getDate() + currentOffset)
      return `${englishDays[targetDate.getDay()]}, ${englishMonths[targetDate.getMonth()]} ${targetDate.getDate()}`
    } else if (timeFilter === "Week") {
      const targetDate = new Date(today); targetDate.setDate(today.getDate() + (currentOffset * 7))
      const dayOfWeek = targetDate.getDay(); const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = new Date(targetDate); monday.setDate(targetDate.getDate() + mondayOffset)
      const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
      return `${englishMonths[monday.getMonth()]} ${monday.getDate()} - ${englishMonths[sunday.getMonth()]} ${sunday.getDate()}`
    } else {
      const targetDate = new Date(today); targetDate.setMonth(today.getMonth() + currentOffset)
      return `${englishMonths[targetDate.getMonth()]} ${targetDate.getFullYear()}`
    }
  }
  
  const chartData = useMemo(() => {
    const baseData = sensorHistoryData[selectedSensor as keyof typeof sensorHistoryData] || []
    const seed = currentOffset * 100
    if (timeFilter === "Day") return ["0h", "4h", "8h", "12h", "16h", "20h", "24h"].map((time, i) => ({ time, value: baseData[i % baseData.length] + ((seed + i * 3) % 10) - 5 }))
    if (timeFilter === "Week") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((time, i) => ({ time, value: baseData[i % baseData.length] + ((seed + i * 7) % 12) - 6 }))
    return Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 50 + ((seed + i * 11) % 150) }))
  }, [timeFilter, selectedSensor, currentOffset])
  
  const waterBarData = useMemo(() => {
    const seed = currentOffset * 100
    if (timeFilter === "Day") return waterUsageData.slice(0, 7).map((val: number, i: number) => ({ time: `${i * 4}h`, value: val + ((seed + i * 5) % 20) - 10 }))
    if (timeFilter === "Week") return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((time, i) => ({ time, value: waterUsageData[i % waterUsageData.length] + ((seed + i * 8) % 30) - 15 }))
    return Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 50 + ((seed + i * 13) % 150) }))
  }, [timeFilter, waterUsageData, currentOffset])
  
  const getThresholdLines = () => {
    switch (selectedSensor) {
      case "temp": return { min: thresholds.minTemp, max: thresholds.maxTemp }
      case "moisture": return { min: thresholds.moistureThreshold, max: 100 }
      case "light": return { min: 0, max: thresholds.maxLight }
      default: return { min: 0, max: 100 }
    }
  }
  const thresholdLines = getThresholdLines()
  const getUnit = () => selectedSensor === "temp" ? "°C" : selectedSensor === "waterVolume" ? "L" : "%"
  const getSensorLabel = () => selectedSensor === "temp" ? "Temperature" : selectedSensor === "moisture" ? "Soil Moisture" : selectedSensor === "light" ? "Light Intensity" : "Water Volume"

  const getSummaryInsights = () => {
    const isDay = timeFilter === "Day"; const isMonth = timeFilter === "Month"
    if (selectedSensor === "waterVolume") {
      const data = waterBarData as { time?: string; day?: number; value: number }[]
      const totalVolume = data.reduce((a, b) => a + Math.max(0, b.value), 0)
      if (isDay) {
        const peakHour = data.reduce((max, curr, i) => curr.value > (data[max]?.value || 0) ? i : max, 0)
        const peakValue = Math.max(...data.map(d => d.value))
        return { items: [{ icon: Beaker, value: `${totalVolume}L`, label: "Daily Total" }, { icon: TrendingUp, value: `${peakValue}L`, label: "Peak Usage" }, { icon: Clock, value: `${peakHour * 4}h`, label: "Peak Hour" }] }
      } else {
        const avgDaily = Math.round(totalVolume / (isMonth ? 30 : 7)); const pumpCycles = Math.floor(totalVolume / 20)
        return { items: [{ icon: Beaker, value: `${totalVolume}L`, label: isMonth ? "Monthly Total" : "Weekly Total" }, { icon: Activity, value: `${avgDaily}L`, label: "Daily Avg" }, { icon: TrendingUp, value: `${pumpCycles}`, label: "Pump Cycles" }] }
      }
    }
    const values = (chartData as { value: number }[]).map(d => d.value)
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    const max = Math.max(...values)
    let outOfRangeCount = 0
    values.forEach(v => {
      if (selectedSensor === "temp" && (v < thresholds.minTemp || v > thresholds.maxTemp)) outOfRangeCount++
      if (selectedSensor === "moisture" && v < thresholds.moistureThreshold) outOfRangeCount++
      if (selectedSensor === "light" && v > thresholds.maxLight) outOfRangeCount++
    })
    const unit = getUnit(); const sensorIcon = selectedSensor === "temp" ? Thermometer : selectedSensor === "moisture" ? Droplets : Sun
    return {
      items: [
        { icon: sensorIcon, value: `${avg}${unit}`, label: isDay ? "Daily Avg" : isMonth ? "Monthly Avg" : "Weekly Avg" },
        { icon: TrendingUp, value: `${max}${unit}`, label: isDay ? "Peak Today" : "Highest" },
        { icon: AlertTriangle, value: `${isDay ? outOfRangeCount * 4 + "h" : outOfRangeCount + " days"}`, label: "Out of Range" },
      ]
    }
  }

  const summaryInsights = getSummaryInsights()
  const isWaterSelected = selectedSensor === "waterVolume"
  
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {["Day", "Week", "Month"].map((filter) => (
          <button key={filter} onClick={() => setTimeFilter(filter as "Day" | "Week" | "Month")} className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all", timeFilter === filter ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground shadow-sm")}>{filter}</button>
        ))}
      </div>
      <section className="bg-card rounded-3xl p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">Select Data Type</h2>
        <div className="grid grid-cols-4 gap-2">
          {[{ id: "temp" as SensorType, icon: Thermometer, label: "Temp" }, { id: "moisture" as SensorType, icon: Droplets, label: "Moisture" }, { id: "light" as SensorType, icon: Sun, label: "Light" }, { id: "waterVolume" as SensorType, icon: Beaker, label: "Water" }].map((sensor) => (
            <button key={sensor.id} onClick={() => setSelectedSensor(sensor.id)} className={cn("flex flex-col items-center gap-2 p-3 rounded-xl transition-all", selectedSensor === sensor.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}><sensor.icon className="w-5 h-5" /><span className="text-xs font-medium">{sensor.label}</span></button>
          ))}
        </div>
      </section>
      <section className="bg-card rounded-3xl p-5 shadow-sm">
        
        {/* TIME NAVIGATION HEADER */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentOffset(-1)} className="p-2 rounded-full hover:bg-muted"><ChevronLeft className="w-5 h-5 text-muted-foreground" /></button>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-medium text-foreground">{getDateContextLabel()}</span>
            {currentOffset !== 0 && <button onClick={resetCurrentOffset} className="text-xs text-primary hover:underline">Today</button>}
          </div>
          {}
          <button 
            onClick={() => setCurrentOffset(1)} 
            disabled={currentOffset >= 0}
            className={cn("p-2 rounded-full transition-all", currentOffset >= 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-muted")}
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div><h2 className="font-semibold text-foreground">{getSensorLabel()}</h2><p className="text-sm text-muted-foreground">{timeFilter === "Day" ? "Hourly data" : timeFilter === "Week" ? "Daily data" : "Monthly overview"}</p></div>
          <div className="text-right"><p className="text-2xl font-bold text-primary">{sensorData[selectedSensor]}{getUnit()}</p><p className="text-xs text-muted-foreground">Current</p></div>
        </div>
        {!showSourceData ? (
          <>
            {timeFilter !== "Month" ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  {isWaterSelected ? (
                    <BarChart data={waterBarData as { time: string; value: number }[]} margin={{ top: 25, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} padding={{ left: 20, right: 20 }} />
                      <YAxis width={40} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} domain={["dataMin - 10", "dataMax + 10"]} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}><LabelList dataKey="value" position="top" className="text-[10px] fill-slate-500 font-medium" /></Bar>
                    </BarChart>
                  ) : (
                    <LineChart data={chartData as { time: string; value: number }[]} margin={{ top: 25, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} padding={{ left: 20, right: 20 }} />
                      <YAxis width={40} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={{ stroke: "hsl(var(--border))" }} domain={["dataMin - 5", "dataMax + 5"]} />
                      <ReferenceLine y={thresholdLines.max} stroke="hsl(var(--destructive))" strokeDasharray="5 5" />
                      <ReferenceLine y={thresholdLines.min} stroke="hsl(var(--primary))" strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }} activeDot={{ r: 6, fill: "hsl(var(--primary))" }} isAnimationActive={false}>
                        <LabelList dataKey="value" position="top" offset={10} className="text-[10px] fill-slate-500 font-medium" />
                      </Line>
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <CalendarHeatmap data={isWaterSelected ? (waterBarData as { day: number; value: number }[]) : (chartData as { day: number; value: number }[])} />
            )}
          </>
        ) : (
          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card"><tr className="border-b border-border"><th className="text-left py-2 px-3 text-muted-foreground font-medium">{timeFilter === "Month" ? "Day" : "Time"}</th><th className="text-right py-2 px-3 text-muted-foreground font-medium">Value ({getUnit()})</th></tr></thead>
              <tbody>
                {(isWaterSelected ? waterBarData : chartData as { time?: string; day?: number; value: number }[]).map((item, i) => (
                  <tr key={i} className="border-b border-border/50"><td className="py-2 px-3 text-foreground">{timeFilter === "Month" ? `Day ${(item as { day: number }).day}` : (item as { time: string }).time}</td><td className="py-2 px-3 text-right text-foreground font-medium">{item.value}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <button onClick={() => setShowSourceData(!showSourceData)} className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"><Table className="w-4 h-4" />{showSourceData ? "View Chart" : "View Source Data"}</button>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">{getSensorLabel()} Summary</h2>
        <div className="grid grid-cols-3 gap-3">
          {summaryInsights.items.map((item, index) => (
            <div key={index} className="bg-card rounded-2xl p-4 shadow-sm text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2"><item.icon className="w-5 h-5 text-primary" /></div>
              <p className="text-xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function CalendarHeatmap({ data }: { data: { day: number; value: number }[] }) {
  const maxValue = Math.max(...data.map(d => d.value))
  const getIntensity = (value: number) => {
    const ratio = value / maxValue
    if (ratio < 0.25) return "bg-primary/20"
    if (ratio < 0.5) return "bg-primary/40"
    if (ratio < 0.75) return "bg-primary/60"
    return "bg-primary"
  }
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (<div key={i} className="text-xs text-muted-foreground text-center font-medium py-1">{day}</div>))}
      {Array.from({ length: 3 }, (_, i) => (<div key={`empty-${i}`} className="aspect-square" />))}
      {data.map((item) => (
        <div key={item.day} className={cn("aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors", getIntensity(item.value), item.value > maxValue * 0.5 ? "text-primary-foreground" : "text-foreground")} title={`Day ${item.day}: ${item.value}L`}>{item.day}</div>
      ))}
    </div>
  )
}

export function EmptyStateAnalytics() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6"><BarChart3 className="w-12 h-12 text-muted-foreground" /></div>
      <h2 className="text-lg font-semibold text-foreground mb-2 text-center">No Analytics Available</h2>
      <p className="text-muted-foreground text-center max-w-xs">Please add a pump on the Home screen to view analytics.</p>
    </div>
  )
}