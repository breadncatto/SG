import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Thermometer, Droplets, Sun, Activity, ChevronLeft, ChevronRight, Database, Target, TrendingUp, TrendingDown } from "lucide-react"
import { Sensor, SensorType } from "@/types/smart-garden"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from "recharts"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface AnalyticsTabProps {
  sensors: Sensor[]
  selectedSensor: SensorType
  setSelectedSensor: (val: SensorType) => void
  thresholds: any
}

type TimeFilter = "Day" | "Week" | "Month";

export function AnalyticsTab({ sensors, selectedSensor, setSelectedSensor, thresholds }: AnalyticsTabProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Week")
  const [dateOffset, setDateOffset] = useState(0) 
  const [showRawData, setShowRawData] = useState(false)

  const sensorTypeMap: Record<SensorType, string> = {
    temp: "Temperature", moisture: "Moisture", light: "Light", waterVolume: "WaterVolume"
  }
  const currentSensorInfo = sensors.find(s => s.type === sensorTypeMap[selectedSensor])

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    if (timeFilter === "Day") {
      start.setDate(start.getDate() + dateOffset);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + dateOffset);
      end.setHours(23, 59, 59, 999);
    } else if (timeFilter === "Week") {
      start.setDate(start.getDate() + (dateOffset * 7) - start.getDay() + 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setMonth(start.getMonth() + dateOffset, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  }, [timeFilter, dateOffset])

  const filteredRawData = useMemo(() => {
    if (!currentSensorInfo || !currentSensorInfo.historyData) return [];
    return currentSensorInfo.historyData.filter(item => {
      const d = new Date(item.createdAt || item.created_at);
      return d >= dateRange.start && d <= dateRange.end;
    }).sort((a, b) => new Date(a.createdAt || a.created_at).getTime() - new Date(b.createdAt || b.created_at).getTime());
  }, [currentSensorInfo, dateRange])

  const stats = useMemo(() => {
    if (filteredRawData.length === 0) return { max: 0, min: 0, avg: 0, latest: 0, optimal: 0, trend: 0, trendDir: "none" }
    const vals = filteredRawData.map(d => d.value);
    
    const minT = selectedSensor === "temp" ? thresholds.minTemp : (selectedSensor === "moisture" ? thresholds.moistureThreshold : 0);
    const maxT = selectedSensor === "temp" ? thresholds.maxTemp : (selectedSensor === "light" ? thresholds.maxLight : 100);
    
    const optimalCount = vals.filter(v => v >= minT && v <= maxT).length;
    
    const half = Math.floor(vals.length / 2);
    const avgFirst = vals.slice(0, half).reduce((a, b) => a + b, 0) / (half || 1);
    const avgSecond = vals.slice(half).reduce((a, b) => a + b, 0) / (vals.length - half || 1);
    const trendVal = avgSecond - avgFirst;

    return {
      max: Math.max(...vals),
      min: Math.min(...vals),
      avg: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
      latest: vals[vals.length - 1],
      optimal: Math.round((optimalCount / vals.length) * 100),
      trend: Math.abs(trendVal).toFixed(1),
      trendDir: trendVal > 0 ? "up" : (trendVal < 0 ? "down" : "flat")
    }
  }, [filteredRawData, selectedSensor, thresholds])

  const chartData = useMemo(() => {
    if (timeFilter === "Day") {
      const buckets = [0, 4, 8, 12, 16, 20].map(h => ({ time: `${h.toString().padStart(2, '0')}:00`, sum: 0, count: 0, min: 9999, max: -9999 }));
      filteredRawData.forEach(d => {
        const hour = new Date(d.createdAt || d.created_at).getHours();
        const bIdx = Math.floor(hour / 4);
        buckets[bIdx].sum += d.value;
        buckets[bIdx].count += 1;
        if(d.value < buckets[bIdx].min) buckets[bIdx].min = d.value;
        if(d.value > buckets[bIdx].max) buckets[bIdx].max = d.value;
      });
      return buckets.map(b => ({ time: b.time, value: b.count ? parseFloat((b.sum / b.count).toFixed(1)) : null }));
    } 
    else if (timeFilter === "Week") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const buckets = days.map(d => ({ time: d, sum: 0, count: 0 }));
      filteredRawData.forEach(d => {
        let dayIdx = new Date(d.createdAt || d.created_at).getDay() - 1; 
        if (dayIdx === -1) dayIdx = 6;
        buckets[dayIdx].sum += d.value;
        buckets[dayIdx].count += 1;
      });
      return buckets.map(b => ({ time: b.time, value: b.count ? parseFloat((b.sum / b.count).toFixed(1)) : null }));
    }
    const daysInMonth = dateRange.end.getDate();
    const buckets = Array.from({length: daysInMonth}, (_, i) => ({ day: i+1, sum: 0, count: 0, min: 9999, max: -9999 }));
    filteredRawData.forEach(d => {
      const day = new Date(d.createdAt || d.created_at).getDate() - 1;
      buckets[day].sum += d.value;
      buckets[day].count += 1;
      if(d.value < buckets[day].min) buckets[day].min = d.value;
      if(d.value > buckets[day].max) buckets[day].max = d.value;
    });
    return buckets.map(b => ({ day: b.day, avg: b.count ? parseFloat((b.sum / b.count).toFixed(1)) : null, variance: b.count > 1 ? parseFloat((b.max - b.min).toFixed(1)) : 0 }));
  }, [filteredRawData, timeFilter, dateRange])

  const getConfig = () => {
    switch (selectedSensor) {
      case "temp": return { title: "Temperature", color: "#f97316", unit: "°C" }
      case "moisture": return { title: "Moisture", color: "#3b82f6", unit: "%" }
      case "light": return { title: "Light Intensity", color: "#eab308", unit: "lux" }
      default: return { title: "Data", color: "#000", unit: "" }
    }
  }
  const config = getConfig()

  const headerDateText = `${dateRange.start.toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})} - ${dateRange.end.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}`;

  // Custom component cho ô chỉ số
  const StatCard = ({ title, value, unit, icon: Icon, color, infoText, trendSign }: any) => (
    <Card className="rounded-2xl border-0 bg-card p-4 shadow-sm relative">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          {Icon && <Icon className="w-3 h-3" style={{ color: color || 'inherit' }}/>}
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-4 h-4 rounded-full border border-muted-foreground/30 text-muted-foreground flex items-center justify-center text-[10px] font-bold hover:bg-muted focus:outline-none">!</button>
          </PopoverTrigger>
          <PopoverContent className="w-64 text-xs p-3 rounded-xl shadow-lg border border-border bg-popover text-popover-foreground" side="top">
            {infoText}
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-xl font-bold" style={{color: color || 'inherit'}}>
        {trendSign}{value}<span className="text-sm text-muted-foreground ml-1">{unit}</span>
      </p>
    </Card>
  )

  const formatCleanDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground text-lg">Analytics & Trends</h2>
      </div>

      <Tabs value={selectedSensor} onValueChange={(val: any) => setSelectedSensor(val)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 p-1 bg-muted rounded-2xl h-auto">
          <TabsTrigger value="temp" className="rounded-xl py-2">Temp</TabsTrigger>
          <TabsTrigger value="moisture" className="rounded-xl py-2">Moisture</TabsTrigger>
          <TabsTrigger value="light" className="rounded-xl py-2">Light</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          title="Current" value={stats.latest} unit={config.unit} color={config.color}
          infoText="The most recent reading from the sensor. Use this to check real-time conditions."
        />
        <StatCard 
          title="Average" value={stats.avg} unit={config.unit}
          infoText="The average value over the selected period. Helps identify the general baseline of the environment."
        />
        <StatCard 
          title="Maximum" value={stats.max} unit={config.unit} icon={Activity} color="#ef4444"
          infoText="The highest recorded value in this period. Useful for spotting dangerous environmental spikes."
        />
        <StatCard 
          title="Minimum" value={stats.min} unit={config.unit} icon={Activity} color="#3b82f6"
          infoText="The lowest recorded value in this period. Useful for spotting dangerous drops."
        />
        <StatCard 
          title="Optimal Range" value={stats.optimal} unit="%" icon={Target} color="#10b981"
          infoText="Percentage of time the readings stayed within your configured safe limits. A value >80% indicates a very healthy environment for your plants."
        />
        <StatCard 
          title="Trend Analysis" value={stats.trend} unit={config.unit} trendSign={stats.trendDir === "up" ? "+" : (stats.trendDir === "down" ? "-" : "")} 
          icon={stats.trendDir === "up" ? TrendingUp : TrendingDown} color={stats.trendDir === "up" ? "#f97316" : "#3b82f6"}
          infoText="Compares the second half of the period to the first half. A positive number means the values are rising, negative means they are falling."
        />
      </div>

      <div className="bg-card rounded-3xl p-5 shadow-sm space-y-4 border border-border/50">
        <div className="flex items-center justify-between bg-muted/50 p-2 rounded-2xl">
          <Button variant="outline" size="icon" onClick={() => setDateOffset(prev => prev - 1)} className="rounded-full bg-background border-0 shadow-sm h-8 w-8"><ChevronLeft className="w-4 h-4"/></Button>
          <div className="text-center">
            <div className="flex gap-2 mb-1">
              {["Day", "Week", "Month"].map(t => (
                <span key={t} onClick={() => { setTimeFilter(t as TimeFilter); setDateOffset(0); }} className={cn("text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors", timeFilter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>{t}</span>
              ))}
            </div>
            <p className="text-[10px] font-medium text-muted-foreground">{headerDateText}</p>
          </div>
          <Button variant="outline" size="icon" disabled={dateOffset === 0} onClick={() => setDateOffset(prev => prev + 1)} className="rounded-full bg-background border-0 shadow-sm h-8 w-8"><ChevronRight className="w-4 h-4"/></Button>
        </div>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-2">{config.title} History</h3>
          <Button variant="secondary" size="sm" onClick={() => setShowRawData(true)} className="h-7 text-[10px] rounded-lg bg-primary/10 text-primary hover:bg-primary/20"><Database className="w-3 h-3 mr-1" /> Raw Data</Button>
        </div>

        <div className="h-[200px] w-full">
          {timeFilter !== "Month" ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={config.color} stopOpacity={0.4} /><stop offset="95%" stopColor={config.color} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" connectNulls />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-2"><span>Color = Average</span><span>Size = Variance</span></div>
              <div className="grid grid-cols-7 gap-2">
                {chartData.map((d: any, idx: number) => {
                  if (d.avg === null) return <div key={idx} className="aspect-square flex items-center justify-center text-xs text-muted-foreground/30 bg-muted/20 rounded-md">{d.day}</div>;
                  const maxT = config.maxT || 100;
                  const opacity = Math.max(0.2, Math.min(1, d.avg / maxT));
                  const sizeScale = Math.min(1, d.variance / 20); 
                  const pxSize = 8 + (sizeScale * 16); 
                  return (
                    <div key={idx} className="aspect-square relative flex items-center justify-center rounded-md border border-muted/50 bg-card group">
                      <span className="absolute top-1 left-1 text-[8px] text-muted-foreground">{d.day}</span>
                      <div className="rounded-full transition-all" style={{ backgroundColor: config.color, opacity: opacity, width: `${pxSize}px`, height: `${pxSize}px` }} />
                      <div className="absolute hidden group-hover:flex z-10 bottom-full mb-1 bg-foreground text-background text-[10px] p-1.5 rounded flex-col items-center whitespace-nowrap">
                        <span className="font-bold">{d.avg}{config.unit}</span><span className="opacity-70 text-[8px]">Var: {d.variance}{config.unit}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showRawData} onOpenChange={setShowRawData}>
        <DialogContent className="max-w-md mx-4 rounded-3xl max-h-[80vh] flex flex-col bg-card">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-primary"/> Source Data</DialogTitle></DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-2 pr-2 mt-2">
            {filteredRawData.length > 0 ? filteredRawData.map((d: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-muted/50 border border-border/50 rounded-xl text-sm">
                <span className="text-muted-foreground font-medium text-xs">{formatCleanDate(d.createdAt || d.created_at)}</span>
                <span className="font-bold text-foreground">{d.value} {config.unit}</span>
              </div>
            )) : <p className="text-center text-muted-foreground py-10">No data available for this period.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function EmptyStateAnalytics() { return <div className="text-center py-20 text-muted-foreground">No Analytics Data. Add a pump first.</div> }