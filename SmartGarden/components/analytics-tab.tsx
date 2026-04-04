import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Thermometer, Droplets, Sun, Activity, ChevronLeft, ChevronRight, Database, Target, TrendingUp, TrendingDown } from "lucide-react"
import { Sensor, SensorType } from "@/types/smart-garden"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, BarChart, Bar } from "recharts"
import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AnalyticsTabProps {
  sensors: Sensor[]
  selectedSensor: SensorType
  setSelectedSensor: (val: SensorType) => void
  thresholds: any
}

type TimeFilter = "Day" | "Week" | "Month";

export function AnalyticsTab({ sensors, selectedSensor, setSelectedSensor, thresholds }: AnalyticsTabProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Week")
  const [dateOffset, setDateOffset] = useState(0) // 0 = Current, -1 = Previous, etc.
  const [showRawData, setShowRawData] = useState(false)

  const sensorTypeMap: Record<SensorType, string> = {
    temp: "Temperature", moisture: "Moisture", light: "Light", waterVolume: "WaterVolume"
  }
  const currentSensorInfo = sensors.find(s => s.type === sensorTypeMap[selectedSensor])

  // --- LOGIC LỌC THỜI GIAN THẬT TẾ ---
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    if (timeFilter === "Day") {
      start.setDate(start.getDate() + dateOffset);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() + dateOffset);
      end.setHours(23, 59, 59, 999);
    } else if (timeFilter === "Week") {
      start.setDate(start.getDate() + (dateOffset * 7) - start.getDay() + 1); // Monday
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6); // Sunday
      end.setHours(23, 59, 59, 999);
    } else {
      start.setMonth(start.getMonth() + dateOffset, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0); // Last day of month
      end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  }, [timeFilter, dateOffset])

  // Dữ liệu thô đã lọc theo khoảng thời gian
  const filteredRawData = useMemo(() => {
    if (!currentSensorInfo || !currentSensorInfo.historyData) return [];
    return currentSensorInfo.historyData.filter(item => {
      const d = new Date(item.createdAt || item.created_at);
      return d >= dateRange.start && d <= dateRange.end;
    }).sort((a, b) => new Date(a.createdAt || a.created_at).getTime() - new Date(b.createdAt || b.created_at).getTime());
  }, [currentSensorInfo, dateRange])

  // --- TÍNH TOÁN 6 Ô SUMMARY ---
  const stats = useMemo(() => {
    if (filteredRawData.length === 0) return { max: 0, min: 0, avg: 0, latest: 0, optimal: 0, trend: 0, trendDir: "none" }
    const vals = filteredRawData.map(d => d.value);
    
    const minT = selectedSensor === "temp" ? thresholds.minTemp : (selectedSensor === "moisture" ? thresholds.moistureThreshold : 0);
    const maxT = selectedSensor === "temp" ? thresholds.maxTemp : (selectedSensor === "light" ? thresholds.maxLight : 100);
    
    const optimalCount = vals.filter(v => v >= minT && v <= maxT).length;
    
    // Trend: Avg nửa sau - Avg nửa đầu
    const half = Math.floor(vals.length / 2);
    const firstHalf = vals.slice(0, half);
    const secondHalf = vals.slice(half);
    const avgFirst = firstHalf.length ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : vals[0];
    const avgSecond = secondHalf.length ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : vals[vals.length - 1];
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

  // --- XỬ LÝ DỮ LIỆU CHO CHART THEO TRỤC X YÊU CẦU ---
  const chartData = useMemo(() => {
    if (timeFilter === "Day") {
      // Nhóm theo mỗi 4 giờ (0, 4, 8, 12, 16, 20)
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
      // Nhóm theo Thứ
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const buckets = days.map(d => ({ time: d, sum: 0, count: 0 }));
      filteredRawData.forEach(d => {
        let dayIdx = new Date(d.createdAt || d.created_at).getDay() - 1; // 0=Mon, 6=Sun
        if (dayIdx === -1) dayIdx = 6;
        buckets[dayIdx].sum += d.value;
        buckets[dayIdx].count += 1;
      });
      return buckets.map(b => ({ time: b.time, value: b.count ? parseFloat((b.sum / b.count).toFixed(1)) : null }));
    }
    // Riêng cho Tháng sẽ dùng Bubble Grid nên trả về mảng nhóm theo từng ngày
    const daysInMonth = dateRange.end.getDate();
    const buckets = Array.from({length: daysInMonth}, (_, i) => ({ day: i+1, sum: 0, count: 0, min: 9999, max: -9999 }));
    filteredRawData.forEach(d => {
      const day = new Date(d.createdAt || d.created_at).getDate() - 1;
      buckets[day].sum += d.value;
      buckets[day].count += 1;
      if(d.value < buckets[day].min) buckets[day].min = d.value;
      if(d.value > buckets[day].max) buckets[day].max = d.value;
    });
    return buckets.map(b => ({
      day: b.day, 
      avg: b.count ? parseFloat((b.sum / b.count).toFixed(1)) : null,
      variance: b.count > 1 ? parseFloat((b.max - b.min).toFixed(1)) : 0
    }));
  }, [filteredRawData, timeFilter, dateRange])

  const getConfig = () => {
    switch (selectedSensor) {
      case "temp": return { title: "Temperature", icon: Thermometer, color: "#f97316", unit: "°C" }
      case "moisture": return { title: "Moisture", icon: Droplets, color: "#3b82f6", unit: "%" }
      case "light": return { title: "Light", icon: Sun, color: "#eab308", unit: "lx" }
      case "waterVolume": return { title: "Water Used", icon: Droplets, color: "#0ea5e9", unit: "L" }
      default: return { title: "", icon: Activity, color: "#000", unit: "" }
    }
  }
  const config = getConfig()

  // Format Header Text
  const headerDateText = `${dateRange.start.toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})} - ${dateRange.end.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}`;

  return (
    <div className="space-y-6 animate-in fade-in pb-8">
      
      {/* TIME NAVIGATION */}
      <div className="flex items-center justify-between bg-card p-2 rounded-2xl shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setDateOffset(prev => prev - 1)} className="rounded-full"><ChevronLeft className="w-5 h-5"/></Button>
        <div className="text-center">
          <div className="flex gap-1 bg-muted p-1 rounded-lg mb-1">
            {["Day", "Week", "Month"].map(t => (
              <button key={t} onClick={() => { setTimeFilter(t as TimeFilter); setDateOffset(0); }} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${timeFilter === t ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>{t}</button>
            ))}
          </div>
          <span className="text-xs font-medium text-muted-foreground">{headerDateText}</span>
        </div>
        <Button variant="ghost" size="icon" disabled={dateOffset === 0} onClick={() => setDateOffset(prev => prev + 1)} className="rounded-full"><ChevronRight className="w-5 h-5"/></Button>
      </div>

      <Tabs value={selectedSensor} onValueChange={(val: any) => setSelectedSensor(val)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 p-1 bg-muted rounded-2xl h-auto">
          <TabsTrigger value="temp" className="rounded-xl py-2">Temp</TabsTrigger>
          <TabsTrigger value="moisture" className="rounded-xl py-2">Moist</TabsTrigger>
          <TabsTrigger value="light" className="rounded-xl py-2">Light</TabsTrigger>
          <TabsTrigger value="waterVolume" className="rounded-xl py-2 text-xs">Water</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 6 SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="rounded-2xl border-0 bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Current</p>
          <p className="text-2xl font-bold" style={{color: config.color}}>{stats.latest}<span className="text-sm text-muted-foreground ml-1">{config.unit}</span></p>
        </Card>
        <Card className="rounded-2xl border-0 bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium mb-1">Average</p>
          <p className="text-2xl font-bold">{stats.avg}<span className="text-sm text-muted-foreground ml-1">{config.unit}</span></p>
        </Card>
        <Card className="rounded-2xl border-0 bg-card p-4 shadow-sm flex justify-between items-center">
          <div><p className="text-xs text-muted-foreground font-medium mb-1">Maximum</p><p className="text-lg font-bold">{stats.max}{config.unit}</p></div>
        </Card>
        <Card className="rounded-2xl border-0 bg-card p-4 shadow-sm flex justify-between items-center">
          <div><p className="text-xs text-muted-foreground font-medium mb-1">Minimum</p><p className="text-lg font-bold">{stats.min}{config.unit}</p></div>
        </Card>
        
        {/* NEW: Optimal Range */}
        <Card className="rounded-2xl border-0 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-1 mb-1"><Target className="w-3 h-3 text-emerald-500"/><p className="text-xs text-muted-foreground font-medium">Optimal Range</p></div>
          <p className="text-lg font-bold text-emerald-600">{stats.optimal}%</p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-1">Time within configured limits</p>
        </Card>
        
        {/* NEW: Trend Analysis */}
        <Card className="rounded-2xl border-0 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-1 mb-1">
            {stats.trendDir === "up" ? <TrendingUp className="w-3 h-3 text-orange-500"/> : <TrendingDown className="w-3 h-3 text-blue-500"/>}
            <p className="text-xs text-muted-foreground font-medium">Trend Analysis</p>
          </div>
          <p className="text-lg font-bold">{stats.trendDir === "up" ? "+" : "-"}{stats.trend}{config.unit}</p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-1">Difference between period halves</p>
        </Card>
      </div>

      {/* CHART SECTION */}
      <Card className="rounded-3xl border-0 shadow-sm bg-card overflow-hidden">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <config.icon className="w-4 h-4" style={{ color: config.color }} /> {config.title} Chart
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowRawData(true)} className="h-7 text-xs flex items-center gap-1 px-2 bg-muted/50 rounded-lg text-primary">
            <Database className="w-3 h-3" /> Raw Data
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          
          {timeFilter !== "Month" ? (
            // DAY & WEEK VIEW (Area Chart)
            <div className="h-[200px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={config.color} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground)/0.1)" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
                  <Area type="monotone" dataKey="value" stroke={config.color} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            // MONTH VIEW (Custom Bubble Calendar)
            <div className="mt-4">
              <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-2">
                <span>Color = Average Value</span>
                <span>Size = Fluctuation (Max-Min)</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {chartData.map((d: any, idx: number) => {
                  if (d.avg === null) return <div key={idx} className="aspect-square flex items-center justify-center text-xs text-muted-foreground/30 bg-muted/20 rounded-md">{d.day}</div>;
                  
                  // Calculate opacity based on avg (relative to limits)
                  const maxT = config.maxT || 100;
                  const opacity = Math.max(0.2, Math.min(1, d.avg / maxT));
                  // Calculate size based on variance (0 to 1)
                  const sizeScale = Math.min(1, d.variance / 20); // Assume 20 unit swing is max
                  const pxSize = 8 + (sizeScale * 16); // Bubble size between 8px and 24px

                  return (
                    <div key={idx} className="aspect-square relative flex items-center justify-center rounded-md border border-muted/50 bg-card group">
                      <span className="absolute top-1 left-1 text-[8px] text-muted-foreground">{d.day}</span>
                      <div 
                        className="rounded-full transition-all" 
                        style={{ backgroundColor: config.color, opacity: opacity, width: `${pxSize}px`, height: `${pxSize}px` }}
                      />
                      {/* Tooltip on hover */}
                      <div className="absolute hidden group-hover:flex z-10 bottom-full mb-1 bg-foreground text-background text-[10px] p-1.5 rounded flex-col items-center whitespace-nowrap">
                        <span className="font-bold">{d.avg}{config.unit}</span>
                        <span className="opacity-70 text-[8px]">Var: {d.variance}{config.unit}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RAW DATA DIALOG */}
      <Dialog open={showRawData} onOpenChange={setShowRawData}>
        <DialogContent className="max-w-md mx-4 rounded-3xl max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Database className="w-5 h-5 text-primary"/> Source Data Log</DialogTitle></DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-2 pr-2">
            {filteredRawData.length > 0 ? filteredRawData.map((d: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-3 bg-muted rounded-xl text-sm">
                <span className="text-muted-foreground">{new Date(d.createdAt || d.created_at).toLocaleString()}</span>
                <span className="font-bold">{d.value} {config.unit}</span>
              </div>
            )) : <p className="text-center text-muted-foreground py-10">No data available for this period.</p>}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
export function EmptyStateAnalytics() { return ( <div className="text-center py-20 text-muted-foreground">No Analytics Data. Add a pump first.</div> ) }