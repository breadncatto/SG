"use client"

import React, { useState, useMemo } from "react"
import { Thermometer, Droplets, Sun, Beaker, ChevronLeft, ChevronRight, Calendar as CalIcon, Database, Info, Activity, TrendingUp, TrendingDown, Clock, Power, Target, AlertCircle, Timer, Zap } from "lucide-react"
import { XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Helper component for rendering individual metric cards
const MetricCard = ({ id, icon, title, value, unit, tooltip, valueColor = "text-foreground", activeTooltip, setActiveTooltip }: any) => {
  const isActive = activeTooltip === id;
  return (
    <div className="bg-card p-4 rounded-2xl border border-border flex flex-col relative">
      <div 
        className="absolute right-2 top-2 z-20 cursor-pointer p-2"
        onClick={(e) => { e.stopPropagation(); setActiveTooltip(isActive ? null : id); }}
      >
        <Info className={cn("w-4 h-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
      </div>
      {isActive && (
        <div 
          className="absolute right-0 top-12 w-48 bg-popover border border-border p-3 rounded-xl text-xs text-popover-foreground z-50 shadow-xl font-medium leading-relaxed animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {tooltip}
        </div>
      )}
      <span className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1.5 uppercase tracking-wider pr-6">
        {React.cloneElement(icon, { className: cn("w-3.5 h-3.5", icon.props.className) })}
        {title}
      </span>
      <span className={cn("text-xl font-black mt-1", valueColor)}>
        {value} <span className="text-[10px] font-medium text-muted-foreground ml-0.5">{unit}</span>
      </span>
    </div>
  );
};

export function AnalyticsTab({ sensors, selectedSensor, setSelectedSensor, thresholds }: any) {
  const [timeView, setTimeView] = useState<"Day" | "Week" | "Month">("Day")
  const [dayDate, setDayDate] = useState(new Date())
  const [weekDate, setWeekDate] = useState(new Date())
  const [monthDate, setMonthDate] = useState(new Date())
  const [showSourceData, setShowSourceData] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)

  const activeDate = timeView === "Day" ? dayDate : timeView === "Week" ? weekDate : monthDate
  const today = new Date()

  // --- Navigation Logic ---
  const navigateTime = (direction: "prev" | "next") => {
    setActiveTooltip(null);
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
    setActiveTooltip(null);
    if (timeView === "Day") setDayDate(new Date())
    if (timeView === "Week") setWeekDate(new Date())
    if (timeView === "Month") setMonthDate(new Date())
  }

  const isTodayView = () => {
    const t = new Date(today); t.setHours(0, 0, 0, 0);
    if (timeView === "Day") { const d = new Date(dayDate); d.setHours(0, 0, 0, 0); return d.getTime() === t.getTime(); }
    if (timeView === "Month") { return monthDate.getMonth() === t.getMonth() && monthDate.getFullYear() === t.getFullYear(); }
    const start = new Date(weekDate); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - (start.getDay() === 0 ? 6 : start.getDay() - 1));
    const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
    return t >= start && t <= end;
  }

  const canGoNext = () => {
    if (isTodayView()) return false;
    const t = new Date(); t.setHours(0, 0, 0, 0);
    if (timeView === "Day") { const nextDay = new Date(dayDate); nextDay.setDate(nextDay.getDate() + 1); nextDay.setHours(0,0,0,0); return nextDay <= t; }
    if (timeView === "Week") {
      const nextWeekStart = new Date(weekDate); nextWeekStart.setDate(nextWeekStart.getDate() + 7 - (nextWeekStart.getDay() === 0 ? 6 : nextWeekStart.getDay() - 1)); nextWeekStart.setHours(0,0,0,0);
      return nextWeekStart <= t;
    }
    if (timeView === "Month") {
      const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1); const currentMonth = new Date(t.getFullYear(), t.getMonth(), 1);
      return nextMonth <= currentMonth;
    }
    return true;
  }

  const dateLabel = useMemo(() => {
    if (timeView === "Day") return activeDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
    if (timeView === "Week") {
      const start = new Date(activeDate); start.setDate(activeDate.getDate() - (activeDate.getDay() === 0 ? 6 : activeDate.getDay() - 1))
      const end = new Date(start); end.setDate(start.getDate() + 6)
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    }
    return activeDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  }, [timeView, activeDate])

  const actualSensor = useMemo(() => {
    if (selectedSensor === "waterVolume") return sensors?.find((s:any) => s.type === "waterVolume" || s.id === "water_volume_id") || { historyData: [] };
    return sensors?.find((s: any) => 
      (selectedSensor === "temp" && s.type === "Temperature") ||
      (selectedSensor === "moisture" && s.type === "Moisture") ||
      (selectedSensor === "light" && s.type === "Light")
    );
  }, [sensors, selectedSensor]);

  const isWater = selectedSensor === "waterVolume";
  
  // Real API Data Parser
  const chartData = useMemo(() => {
    const apiData = actualSensor?.historyData || [];
    
    // Helper to calculate aggregate sum/avg
    const aggregate = (dataList: any[]) => {
      if (!dataList || dataList.length === 0) return 0;
      const sum = dataList.reduce((acc, curr) => acc + (isWater ? (curr.waterVolume || curr.water_volume || curr.value || 0) : (curr.value || 0)), 0);
      return isWater ? sum : sum / dataList.length;
    };

    if (timeView === "Day") {
      const dayStr = activeDate.toLocaleDateString();
      const dayData = apiData.filter((d:any) => new Date(d.createdAt || d.created_at).toLocaleDateString() === dayStr);
      
      return ["0-4", "4-8", "8-12", "12-16", "16-20", "20-24"].map((time, i) => {
        const startHour = i * 4; const endHour = startHour + 3;
        const slotData = dayData.filter((d:any) => {
          const h = new Date(d.createdAt || d.created_at).getHours();
          return h >= startHour && h <= endHour;
        });
        return { time, value: Number(aggregate(slotData).toFixed(1)) };
      });
    }

    if (timeView === "Week") {
      const startOfWeek = new Date(activeDate); startOfWeek.setDate(activeDate.getDate() - (activeDate.getDay() === 0 ? 6 : activeDate.getDay() - 1)); startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23,59,59,999);
      const weekData = apiData.filter((d:any) => {
        const date = new Date(d.createdAt || d.created_at); return date >= startOfWeek && date <= endOfWeek;
      });

      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
        const slotData = weekData.filter((d:any) => {
          const targetDay = i === 6 ? 0 : i + 1; // 0 is Sun
          return new Date(d.createdAt || d.created_at).getDay() === targetDay;
        });
        return { day, value: Number(aggregate(slotData).toFixed(1)) };
      });
    }

    if (timeView === "Month") {
      const month = activeDate.getMonth(); const year = activeDate.getFullYear();
      const monthData = apiData.filter((d:any) => {
        const date = new Date(d.createdAt || d.created_at);
        return date.getMonth() === month && date.getFullYear() === year;
      });
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const slotData = monthData.filter((d:any) => new Date(d.createdAt || d.created_at).getDate() === day);
        return { day: `${day}`, value: Number(aggregate(slotData).toFixed(1)) };
      });
    }
    return []
  }, [timeView, activeDate, selectedSensor, actualSensor, isWater]);

  // Real Metrics & Trend Calculations
  const metrics = useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    const values = chartData.map((d: any) => d.value);
    const sum = values.reduce((a: number, b: number) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    let optimal = ""; let minBound = 0, maxBound = 100;
    if (selectedSensor === "temp") { optimal = `${thresholds?.minTemp || 15}-${thresholds?.maxTemp || 35}°C`; minBound = thresholds?.minTemp || 15; maxBound = thresholds?.maxTemp || 35; }
    if (selectedSensor === "moisture") { optimal = `>${thresholds?.moistureThreshold || 40}%`; minBound = thresholds?.moistureThreshold || 40; maxBound = 100; }
    if (selectedSensor === "light") { optimal = `<${thresholds?.maxLight || 90}k lux`; minBound = 0; maxBound = thresholds?.maxLight || 90; }

    let optimalCount = 0;
    values.forEach((v: number) => { if (v >= minBound && v <= maxBound && v > 0) optimalCount++; });
    const nonZeroValues = values.filter(v => v > 0).length;
    const optimalPercentage = nonZeroValues > 0 ? Math.round((optimalCount / nonZeroValues) * 100) : 100;
    
    const outOfBoundItems = nonZeroValues - optimalCount;
    const hoursPerItem = timeView === "Day" ? 4 : timeView === "Week" ? 24 : 24;
    const outOfBoundHours = outOfBoundItems * hoursPerItem;

    // Period over Period Trend Calculation
    const apiData = actualSensor?.historyData || [];
    let prevSum = 0, prevAvg = 0, trendValue = 0;

    if (apiData.length > 0) {
       let pData = [];
       if (timeView === "Day") {
          const prevDay = new Date(activeDate); prevDay.setDate(prevDay.getDate() - 1);
          const prevStr = prevDay.toLocaleDateString();
          pData = apiData.filter((d:any) => new Date(d.createdAt || d.created_at).toLocaleDateString() === prevStr);
       } else if (timeView === "Week") {
          const prevWeekStart = new Date(activeDate); prevWeekStart.setDate(prevWeekStart.getDate() - (prevWeekStart.getDay() === 0 ? 6 : prevWeekStart.getDay() - 1) - 7); prevWeekStart.setHours(0,0,0,0);
          const prevWeekEnd = new Date(prevWeekStart); prevWeekEnd.setDate(prevWeekStart.getDate() + 6); prevWeekEnd.setHours(23,59,59,999);
          pData = apiData.filter((d:any) => { const date = new Date(d.createdAt || d.created_at); return date >= prevWeekStart && date <= prevWeekEnd; });
       } else if (timeView === "Month") {
          const prevMonth = new Date(activeDate.getFullYear(), activeDate.getMonth() - 1, 1);
          pData = apiData.filter((d:any) => { const date = new Date(d.createdAt || d.created_at); return date.getMonth() === prevMonth.getMonth() && date.getFullYear() === prevMonth.getFullYear(); });
       }

       prevSum = pData.reduce((acc:any, curr:any) => acc + (isWater ? (curr.waterVolume || curr.water_volume || curr.value || 0) : (curr.value || 0)), 0);
       prevAvg = pData.length ? prevSum / pData.length : 0;

       const currentVal = isWater ? sum : avg;
       const previousVal = isWater ? prevSum : prevAvg;

       if (previousVal > 0) { trendValue = Math.round(((currentVal - previousVal) / previousVal) * 100); } 
       else if (currentVal > 0) { trendValue = 100; }
    }

    let dropRate = 0; let estTime = 0;
    if (selectedSensor === "moisture" && timeView === "Day" && values.length > 2) {
      const activeValues = values.filter(v => v > 0);
      if(activeValues.length >= 2) {
        const lastVal = activeValues[activeValues.length - 1];
        const prevVal = activeValues[activeValues.length - 2];
        dropRate = (prevVal - lastVal) / 4; 
        if (dropRate > 0 && lastVal > minBound) { estTime = (lastVal - minBound) / dropRate; }
      }
    }

    // Pump count estimation if real data does not contain distinct IDs
    const pumpCycles = isWater ? values.filter(v => v > 0).length : 0;

    return {
      sum, avg, max, min, trendValue, optimal, pumpCycles, optimalPercentage, outOfBoundHours,
      dropRate: dropRate.toFixed(1), estTime: estTime.toFixed(1)
    }
  }, [chartData, selectedSensor, thresholds, activeDate, timeView, actualSensor, isWater]);

  const getUnit = () => { if (selectedSensor === "temp") return "°C"; if (selectedSensor === "moisture") return "%"; if (selectedSensor === "light") return "lux"; return "L" }
  const getAvgLabel = () => { if (isWater) return "Total Water Usage"; if (timeView === "Day") return "Daily Average"; if (timeView === "Week") return "Weekly Average"; return "Monthly Average"; }
  const getChartColor = () => { if (selectedSensor === "temp") return "#EAB308"; if (selectedSensor === "moisture") return "#3B82F6"; if (selectedSensor === "light") return "#FDBA74"; return "#3B82F6"; }

  const currentColor = getChartColor();

  const renderCalendarHeatmap = () => {
    const daysInMonth = new Date(activeDate.getFullYear(), activeDate.getMonth() + 1, 0).getDate()
    const firstDay = new Date(activeDate.getFullYear(), activeDate.getMonth(), 1).getDay()
    const emptySlots = Array((firstDay === 0 ? 6 : firstDay - 1)).fill(null)
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const maxDataValue = Math.max(...chartData.map((d: any) => d.value), 1);

    return (
      <div className="grid grid-cols-7 gap-2 mt-2 px-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (<div key={`header-${i}`} className="text-center text-[10px] font-medium text-muted-foreground mb-2">{d}</div>))}
        {emptySlots.map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const valStr = chartData[day - 1]?.value || 0;
          const valNum = Number(valStr);
          const sizePct = maxDataValue > 0 ? Math.max(15, (valNum / maxDataValue) * 85) : 15;

          return (
            <div key={`day-${day}`} className="aspect-square flex flex-col items-center justify-center relative bg-card rounded-lg border border-border/40 group overflow-hidden">
              <span className="text-[10px] text-foreground z-20 absolute top-1 left-1.5 font-semibold opacity-70 group-hover:opacity-100 transition-opacity">{day}</span>
              {valNum > 0 && (
                <div className="rounded-full transition-all duration-300 shadow-sm" style={{ width: `${sizePct}%`, height: `${sizePct}%`, backgroundColor: currentColor, opacity: 0.9 }} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500" onClick={() => setActiveTooltip(null)}>
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[{ id: "temp", icon: Thermometer, label: "Temperature" }, { id: "moisture", icon: Droplets, label: "Moisture" }, { id: "light", icon: Sun, label: "Light" }, { id: "waterVolume", icon: Beaker, label: "Water" }].map(cat => (
          <button key={cat.id} onClick={() => { setSelectedSensor(cat.id); setActiveTooltip(null); }} className={cn("flex items-center gap-1.5 px-3 py-2 rounded-full whitespace-nowrap transition-all border", selectedSensor === cat.id ? "bg-primary text-primary-foreground border-primary font-semibold shadow-md" : "bg-card text-foreground border-border hover:bg-muted")}>
            <cat.icon className="w-4 h-4" /> <span className="text-xs">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Date Navigation */}
      <section className="flex flex-col items-center justify-center mb-2 space-y-4">
        <div className="flex bg-card rounded-full p-1 border border-border shadow-sm">
          {[{id: "Day", label: "Day"}, {id: "Week", label: "Week"}, {id: "Month", label: "Month"}].map((view: any) => (
            <button key={view.id} onClick={() => { setTimeView(view.id); setActiveTooltip(null); }} className={cn("px-5 py-1.5 rounded-full text-xs font-medium transition-all", timeView === view.id ? "bg-muted text-foreground border border-border/50 shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground")}>{view.label}</button>
          ))}
        </div>
        <div className="flex items-center justify-between w-full px-2">
          <button onClick={() => navigateTime("prev")} className="p-2 rounded-full hover:bg-muted text-foreground transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <div className="flex flex-col items-center text-center">
            <h2 className="text-sm font-bold text-foreground">{dateLabel}</h2>
            {!isTodayView() && (<button onClick={resetToToday} className="text-[10px] text-primary font-bold mt-1 hover:underline flex items-center gap-1"><CalIcon className="w-3 h-3" /> Return to today</button>)}
          </div>
          <button onClick={() => navigateTime("next")} disabled={!canGoNext()} className={cn("p-2 rounded-full transition-colors", !canGoNext() ? "opacity-30 cursor-not-allowed text-muted-foreground" : "hover:bg-muted text-foreground")}><ChevronRight className="w-5 h-5" /></button>
        </div>
      </section>

      {/* Analytics Data Grid */}
      {metrics && (
        <section className="space-y-4">
          <div className="bg-card rounded-3xl p-6 border border-border flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
            <div className="absolute right-3 top-3 z-20 cursor-pointer p-2" onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === "hero" ? null : "hero"); }}>
              <Info className={cn("w-5 h-5 transition-colors", activeTooltip === "hero" ? "text-primary" : "text-muted-foreground")} />
            </div>
            {activeTooltip === "hero" && (
              <div className="absolute right-4 top-12 w-48 bg-popover border border-border p-3 rounded-xl text-xs text-popover-foreground z-50 shadow-xl font-medium leading-relaxed text-center animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                {isWater ? "Total volume of water distributed across the entire selected period." : `Average sensor reading calculated across the selected ${timeView.toLowerCase()}.`}
              </div>
            )}
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none" style={{color: currentColor}}>{isWater ? <Beaker className="w-32 h-32" /> : <Activity className="w-32 h-32" />}</div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 z-10">{getAvgLabel()}</p>
            <div className="flex items-baseline gap-1.5 z-10">
              <span className="text-[40px] leading-none font-black text-foreground">{isWater ? metrics.sum.toFixed(0) : metrics.avg.toFixed(1)}</span>
              <span className="text-base font-medium text-muted-foreground">{getUnit()}</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs font-bold z-10 bg-background/60 px-3 py-1.5 rounded-full border border-border/50">
              {metrics.trendValue > 0 ? <TrendingUp className="w-3.5 h-3.5 text-destructive" /> : <TrendingDown className="w-3.5 h-3.5 text-primary" />}
              <span className={metrics.trendValue > 0 ? "text-destructive" : "text-primary"}>{Math.abs(metrics.trendValue)}% vs prev {timeView.toLowerCase()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!isWater ? (
              <>
                <MetricCard id="highLow" activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} icon={<AlertCircle />} title="High / Low" value={`${metrics.max.toFixed(1)} / ${metrics.min.toFixed(1)}`} unit={getUnit()} tooltip="The highest and lowest values recorded during this specific time period." />
                <MetricCard id="optimal" activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} icon={<Target />} title="Optimal Range" value={metrics.optimal} unit="" tooltip="The safe system boundaries configured in your settings. Staying within this range means the plant is healthy." />
                <MetricCard id="timeOpt" activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} icon={<Activity />} title="Time Optimal" value={`${metrics.optimalPercentage}`} unit="%" tooltip="The percentage of time the environment was perfectly maintained within your configured optimal range." />
                
                {selectedSensor === "moisture" && timeView === "Day" ? (
                  <MetricCard id="nextWater" activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} icon={<Zap />} title="Next Watering" value={`${metrics.estTime}`} unit="hrs" tooltip="Predictive estimate of when the auto-pump will trigger next, based on the current soil drop rate." />
                ) : (
                  <MetricCard id="outBound" activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} icon={<Clock />} title="Out of Bounds" value={`${metrics.outOfBoundHours}`} unit="hrs" tooltip="Total estimated duration where the metric dropped below or spiked above the optimal safe boundaries." />
                )}
              </>
            ) : (
              <>
                <MetricCard id="avgVol" activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} icon={<Droplets />} title="Avg Cycle Vol" value={metrics.pumpCycles > 0 ? (metrics.sum / metrics.pumpCycles).toFixed(1) : "0"} unit="L" tooltip="The average amount of water distributed each time the pump is activated." />
                <MetricCard id="pumpCycle" activeTooltip={activeTooltip} setActiveTooltip={setActiveTooltip} icon={<Power />} title="Pump Cycles" value={`${metrics.pumpCycles}`} unit="times" tooltip="Total count of independent pumping sessions triggered during this period." />
              </>
            )}
          </div>
        </section>
      )}

      {/* Chart Section */}
      <section className="bg-card rounded-3xl p-4 shadow-sm border border-border mt-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 ml-1">Timeline</h3>
        <div className={cn("w-full transition-all", timeView === "Month" ? "min-h-[250px]" : "h-48")}>
          {timeView === "Month" ? (<div className="h-full w-full">{renderCalendarHeatmap()}</div>) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={currentColor} stopOpacity={0.6}/><stop offset="95%" stopColor={currentColor} stopOpacity={0}/></linearGradient></defs>
                <XAxis dataKey={timeView === "Day" ? "time" : "day"} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <RechartsTooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "12px", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }} itemStyle={{ color: currentColor, fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="value" stroke={currentColor} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-5 pt-3 border-t border-border">
          <button onClick={(e) => { e.stopPropagation(); setShowSourceData(true); }} className="w-full py-2.5 rounded-xl bg-muted/50 border border-border text-xs font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors text-foreground">
            <Database className="w-4 h-4 text-primary" /> View Source Data
          </button>
        </div>
      </section>

      {/* Source Data Modal */}
      <Dialog open={showSourceData} onOpenChange={setShowSourceData}>
        <DialogContent className="max-w-md mx-4 rounded-3xl bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground text-sm font-bold">Data: {dateLabel}</DialogTitle></DialogHeader>
          <div className="py-2"><div className="max-h-60 overflow-y-auto w-full pr-2">
            <table className="w-full text-xs text-left border-collapse">
              <thead><tr className="border-b border-border"><th className="py-2 text-muted-foreground font-medium">Time / Period</th><th className="py-2 text-muted-foreground font-medium">Value ({getUnit()})</th></tr></thead>
              <tbody>
                {chartData.length > 0 ? chartData.map((d: any, i: number) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/30 transition-colors"><td className="py-2.5 text-foreground">{d.time || d.day || d.date}</td><td className="py-2.5 text-foreground font-semibold" style={{color: currentColor}}>{d.value}</td></tr>
                )) : (<tr><td colSpan={2} className="py-6 text-center text-muted-foreground">No data available.</td></tr>)}
              </tbody>
            </table>
          </div></div>
          <DialogFooter><Button variant="outline" onClick={() => setShowSourceData(false)} className="w-full rounded-xl bg-background border-border hover:bg-muted text-foreground">Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function EmptyStateAnalytics() {
  const [showSourceData, setShowSourceData] = useState(false)
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mb-4 border border-border"><Database className="w-6 h-6 text-muted-foreground" /></div>
      <h3 className="text-base font-semibold text-foreground">No Analytics Available</h3>
      <p className="text-xs text-muted-foreground mt-2 max-w-xs">Connect a pump and sensors to start viewing insights and historical data.</p>
      <button onClick={() => setShowSourceData(true)} className="mt-6 py-2.5 px-5 rounded-xl bg-background border border-border text-xs font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors text-foreground"><Database className="w-4 h-4 text-primary" /> View Source Data</button>
      <Dialog open={showSourceData} onOpenChange={setShowSourceData}>
        <DialogContent className="max-w-md mx-4 rounded-3xl bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground text-sm font-bold">Source Data</DialogTitle></DialogHeader>
          <div className="py-8 text-center text-muted-foreground text-xs">System is empty. No data to display.</div>
          <DialogFooter><Button variant="outline" onClick={() => setShowSourceData(false)} className="w-full rounded-xl bg-background border-border hover:bg-muted text-foreground">Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}