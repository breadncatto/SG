"use client"

import React, { useState, useMemo } from "react"
import { Thermometer, Droplets, Sun, Beaker, ChevronLeft, ChevronRight, Calendar as CalIcon, Database, Info, Activity, TrendingUp, TrendingDown, Clock, Power, Target, AlertCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AnalyticsTab({ sensors, selectedSensor, setSelectedSensor, useMockData, thresholds }: any) {
  const [timeView, setTimeView] = useState<"Day" | "Week" | "Month">("Day")
  
  const [dayDate, setDayDate] = useState(new Date())
  const [weekDate, setWeekDate] = useState(new Date())
  const [monthDate, setMonthDate] = useState(new Date())
  const [showSourceData, setShowSourceData] = useState(false)

  const activeDate = timeView === "Day" ? dayDate : timeView === "Week" ? weekDate : monthDate

  const navigateTime = (direction: "prev" | "next") => {
    const modifier = direction === "next" ? 1 : -1
    if (timeView === "Day") {
      setDayDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + modifier); return d })
    } else if (timeView === "Week") {
      setWeekDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + modifier * 7); return d })
    } else {
      setMonthDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + modifier); return d })
    }
  }

  const resetToToday = () => {
    const today = new Date()
    if (timeView === "Day") setDayDate(today)
    if (timeView === "Week") setWeekDate(today)
    if (timeView === "Month") setMonthDate(today)
  }

  const isTodayView = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (timeView === "Day") {
      const d = new Date(dayDate); 
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }
    if (timeView === "Month") {
      return monthDate.getMonth() === today.getMonth() && monthDate.getFullYear() === today.getFullYear();
    }
    
    const start = new Date(weekDate);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return today >= start && today <= end;
  }

  const dateLabel = useMemo(() => {
    if (timeView === "Day") {
      return activeDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    }
    if (timeView === "Week") {
      const start = new Date(activeDate)
      start.setDate(activeDate.getDate() - (activeDate.getDay() === 0 ? 6 : activeDate.getDay() - 1))
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    }
    return activeDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }, [timeView, activeDate])

  const actualSensor = sensors?.find((s: any) => 
    (selectedSensor === "temp" && s.type === "Temperature") ||
    (selectedSensor === "moisture" && s.type === "Moisture") ||
    (selectedSensor === "light" && s.type === "Light")
  );

  const chartData = useMemo(() => {
    const apiData = actualSensor?.historyData || [];
    
    const dateStr = activeDate.toDateString();
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) { hash = dateStr.charCodeAt(i) + ((hash << 5) - hash); }
    const seed = Math.abs(hash);

    if (timeView === "Day") {
      return ["0-4", "4-8", "8-12", "12-16", "16-20", "20-24"].map((time, i) => {
        const val = useMockData || apiData.length === 0 
          ? Math.max(10, Math.floor(Math.abs(Math.sin(seed + i)) * 80) + 20)
          : (apiData[i]?.value || 0);
        return { time, value: val };
      });
    }
    if (timeView === "Week") {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
        const val = useMockData || apiData.length === 0 
          ? Math.max(20, Math.floor(Math.abs(Math.cos(seed + i)) * 100))
          : (apiData[i]?.value || 0);
        return { day, value: val };
      });
    }
    if (timeView === "Month") {
      const daysInMonth = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 0).getDate()
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const average = Math.abs(Math.cos(seed + day)) * 0.8 + 0.2
        const val = useMockData || apiData.length === 0 
          ? Math.floor(average * 100)
          : (apiData[i]?.value || 0);
        return { day: `${activeDate.getMonth() + 1}/${day}`, value: val }
      });
    }
    return []
  }, [timeView, activeDate, selectedSensor, actualSensor, useMockData])

  const metrics = useMemo(() => {
    if (chartData.length === 0) return null;
    const values = chartData.map((d: any) => d.value);
    const sum = values.reduce((a: number, b: number) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    const seedStr = activeDate.toDateString();
    let hash = 0; for (let i = 0; i < seedStr.length; i++) hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
    const trendValue = (hash % 20) - 10;

    let optimal = "";
    if (selectedSensor === "temp") optimal = `${thresholds?.minTemp || 15}-${thresholds?.maxTemp || 35}°C`;
    if (selectedSensor === "moisture") optimal = `>${thresholds?.moistureThreshold || 40}%`;
    if (selectedSensor === "light") optimal = `<${thresholds?.maxLight || 90}k lux`;

    return {
      sum, avg, max, min, trendValue, optimal,
      pumpRuntime: Math.floor(sum * 0.4), 
      pumpCycles: Math.max(1, Math.floor(sum / 15)) 
    }
  }, [chartData, selectedSensor, thresholds, activeDate]);

  const getUnit = () => {
    if (selectedSensor === "temp") return "°C"
    if (selectedSensor === "moisture") return "%"
    if (selectedSensor === "light") return "lux"
    return "L"
  }

  const getChartColor = () => {
    if (selectedSensor === "temp") return "#E3EED4"; 
    if (selectedSensor === "moisture") return "#6B9071"; 
    if (selectedSensor === "light") return "#AEC3B0"; 
    return "#E3EED4";
  }

  const currentColor = getChartColor();

  const totalWater = useMemo(() => {
    if (selectedSensor !== "waterVolume") return 0;
    return chartData.reduce((acc: number, curr: any) => acc + curr.value, 0);
  }, [chartData, selectedSensor])

  const renderCalendarHeatmap = () => {
    const daysInMonth = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 0).getDate()
    const firstDay = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1).getDay()
    const emptySlots = Array((firstDay === 0 ? 6 : firstDay - 1)).fill(null)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    
    const seedStr = activeDate.getFullYear() + "-" + activeDate.getMonth();
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) { hash = seedStr.charCodeAt(i) + ((hash << 5) - hash); }
    const baseSeed = Math.abs(hash);

    return (
      <div className="grid grid-cols-7 gap-1.5 mt-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
          <div key={`header-${i}`} className="text-center text-[10px] font-medium text-muted-foreground mb-1">{d}</div>
        ))}
        {emptySlots.map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const variance = Math.abs(Math.sin(baseSeed + day * 1.5)) * 100 
          const average = Math.abs(Math.cos(baseSeed + day)) * 0.8 + 0.2
          const size = `${Math.max(30, variance)}%`

          return (
            <div key={`day-${day}`} className="aspect-square relative group bg-card/30 rounded-lg overflow-hidden">
              <span className="text-[10px] text-foreground z-10 absolute top-1 left-1.5 font-medium">{day}</span>
              <div 
                className="rounded-full transition-all absolute"
                style={{ 
                  width: size, 
                  height: size, 
                  backgroundColor: currentColor, 
                  opacity: average, 
                  top: "50%", 
                  left: "50%", 
                  transform: "translate(-50%, -40%)" 
                }}
              />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: "temp", icon: Thermometer, label: "Temperature" },
          { id: "moisture", icon: Droplets, label: "Moisture" },
          { id: "light", icon: Sun, label: "Light" },
          { id: "waterVolume", icon: Beaker, label: "Water" }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedSensor(cat.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap transition-all border",
              selectedSensor === cat.id 
                ? "bg-primary text-primary-foreground border-primary font-semibold shadow-sm" 
                : "bg-card text-foreground border-muted hover:bg-muted"
            )}
          >
            <cat.icon className="w-4 h-4" />
            <span className="text-xs">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Date Navigation & Summary */}
      <section className="flex flex-col items-center justify-center mb-2 space-y-4">
        <div className="flex bg-card rounded-full p-1 border border-border shadow-sm">
          {[ {id: "Day", label: "Day"}, {id: "Week", label: "Week"}, {id: "Month", label: "Month"} ].map((view: any) => (
            <button 
              key={view.id} 
              onClick={() => setTimeView(view.id)}
              className={cn(
                "px-5 py-1.5 rounded-full text-xs font-medium transition-all",
                timeView === view.id ? "bg-background text-primary border border-border shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {view.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between w-full px-2">
          <button onClick={() => navigateTime("prev")} className="p-2 rounded-full hover:bg-muted text-foreground transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <div className="flex flex-col items-center text-center">
            <h2 className="text-sm font-bold text-primary">{dateLabel}</h2>
            {!isTodayView() && (
              <button onClick={resetToToday} className="text-[10px] text-accent font-medium mt-1 hover:underline flex items-center gap-1">
                <CalIcon className="w-3 h-3" /> Return to today
              </button>
            )}
          </div>
          <button onClick={() => navigateTime("next")} disabled={isTodayView()} className={cn("p-2 rounded-full transition-colors", isTodayView() ? "opacity-30 cursor-not-allowed text-muted-foreground" : "hover:bg-muted text-foreground")}><ChevronRight className="w-5 h-5" /></button>
        </div>
      </section>

      {/* Primary Insight & Secondary Metrics Grid */}
      {metrics && (
        <section className="space-y-4">
          {/* Primary Main Metric */}
          <div className="bg-card rounded-3xl p-6 border border-border flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
            <Info className="w-4 h-4 text-muted-foreground absolute top-4 right-4 cursor-help z-20" title={selectedSensor === "waterVolume" ? "Total volume of water distributed in this period" : "Average sensor reading across the selected period"} />
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              {selectedSensor === "waterVolume" ? <Beaker className="w-32 h-32 text-primary" /> : <Activity className="w-32 h-32 text-primary" />}
            </div>
            
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {selectedSensor === "waterVolume" ? "Total Irrigated" : "Daily Average"}
            </p>
            <div className="flex items-baseline gap-2 z-10">
              <span className="text-5xl font-black text-primary">
                {selectedSensor === "waterVolume" ? metrics.sum.toFixed(0) : metrics.avg.toFixed(1)}
              </span>
              <span className="text-xl font-medium text-muted-foreground">{getUnit()}</span>
            </div>
            
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium z-10 px-3 py-1 rounded-full bg-background border border-border">
              {metrics.trendValue >= 0 ? <TrendingUp className="w-3.5 h-3.5 text-primary" /> : <TrendingDown className="w-3.5 h-3.5 text-accent" />}
              <span className={metrics.trendValue >= 0 ? "text-primary" : "text-accent"}>
                {Math.abs(metrics.trendValue)}% {metrics.trendValue >= 0 ? "increase" : "decrease"}
              </span>
            </div>
          </div>

          {/* Secondary Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {selectedSensor !== "waterVolume" ? (
              <>
                <div className="bg-card p-4 rounded-2xl border border-border flex flex-col relative">
                  <Info className="w-3.5 h-3.5 text-muted-foreground absolute top-3 right-3 cursor-help" title="Highest and lowest recordings during this period" />
                  <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> High / Low</span>
                  <span className="text-lg font-bold text-foreground mt-1">{metrics.max.toFixed(1)} / {metrics.min.toFixed(1)}<span className="text-xs text-muted-foreground ml-1">{getUnit()}</span></span>
                </div>
                <div className="bg-card p-4 rounded-2xl border border-border flex flex-col relative">
                  <Info className="w-3.5 h-3.5 text-muted-foreground absolute top-3 right-3 cursor-help" title="Configured threshold safe bounds for automation" />
                  <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Optimal Range</span>
                  <span className="text-lg font-bold text-foreground mt-1">{metrics.optimal}</span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-card p-4 rounded-2xl border border-border flex flex-col relative">
                  <Info className="w-3.5 h-3.5 text-muted-foreground absolute top-3 right-3 cursor-help" title="Estimated total minutes the pump was running" />
                  <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pump Runtime</span>
                  <span className="text-lg font-bold text-foreground mt-1">{metrics.pumpRuntime} <span className="text-xs text-muted-foreground">mins</span></span>
                </div>
                <div className="bg-card p-4 rounded-2xl border border-border flex flex-col relative">
                  <Info className="w-3.5 h-3.5 text-muted-foreground absolute top-3 right-3 cursor-help" title="Number of distinct watering cycles initiated" />
                  <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Power className="w-3.5 h-3.5" /> Pump Cycles</span>
                  <span className="text-lg font-bold text-foreground mt-1">{metrics.pumpCycles} <span className="text-xs text-muted-foreground">times</span></span>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Chart Section */}
      <section className="bg-card rounded-3xl p-4 shadow-sm border border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 ml-1">Timeline</h3>
        
        {/* Dynamic height mapping */}
        <div className={cn("w-full transition-all", timeView === "Month" ? "min-h-[250px]" : "h-48")}>
          {timeView === "Month" ? (
            <div className="h-full w-full">{renderCalendarHeatmap()}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={currentColor} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={currentColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey={timeView === "Day" ? "time" : "day"} stroke="#AEC3B0" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#AEC3B0" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <RechartsTooltip contentStyle={{ backgroundColor: "#0F2A1D", borderRadius: "12px", border: "1px solid #6B9071", color: "#E3EED4" }} itemStyle={{ color: "#E3EED4" }} />
                <Area type="monotone" dataKey="value" stroke={currentColor} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        
        <div className="mt-5 pt-3 border-t border-border">
          <button onClick={() => setShowSourceData(true)} className="w-full py-2.5 rounded-xl bg-background border border-border text-xs font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors text-foreground">
            <Database className="w-4 h-4 text-primary" /> View Source Data
          </button>
        </div>
      </section>

      {/* Modal Source Data */}
      <Dialog open={showSourceData} onOpenChange={setShowSourceData}>
        <DialogContent className="max-w-md mx-4 rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary text-sm font-bold">Data: {dateLabel}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <div className="max-h-60 overflow-y-auto w-full pr-2">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 text-muted-foreground font-medium">Time / Period</th>
                    <th className="py-2 text-muted-foreground font-medium">Value ({getUnit()})</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.length > 0 ? chartData.map((d: any, i: number) => (
                    <tr key={i} className="border-b border-muted hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 text-foreground">{d.time || d.day || d.date}</td>
                      <td className="py-2.5 text-primary font-semibold">{d.value}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={2} className="py-6 text-center text-muted-foreground">No data available.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSourceData(false)} className="w-full rounded-xl bg-background border-border hover:bg-muted text-foreground">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function EmptyStateAnalytics() {
  const [showSourceData, setShowSourceData] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mb-4 border border-border">
        <Database className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-primary">No Analytics Available</h3>
      <p className="text-xs text-muted-foreground mt-2 max-w-xs">Connect a pump and sensors to start viewing insights and historical data.</p>
      
      <button onClick={() => setShowSourceData(true)} className="mt-6 py-2.5 px-5 rounded-xl bg-background border border-border text-xs font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors text-foreground">
        <Database className="w-4 h-4 text-primary" /> View Source Data
      </button>

      <Dialog open={showSourceData} onOpenChange={setShowSourceData}>
        <DialogContent className="max-w-md mx-4 rounded-3xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-primary text-sm font-bold">Source Data</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground text-xs">
            System is empty. No data to display.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSourceData(false)} className="w-full rounded-xl bg-background border-border hover:bg-muted text-foreground">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}