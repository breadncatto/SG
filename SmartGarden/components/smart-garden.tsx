"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Bell,
  Home,
  BarChart3,
  Settings,
  Thermometer,
  Droplets,
  Sun,
  ArrowUpRight,
  Power,
  ChevronDown,
  Plus,
  AlertTriangle,
  AlertCircle,
  Check,
  ArrowLeft,
  Sprout,
  Beaker,
  Clock,
  Wifi,
  Trash2,
  User,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Table,
  Calendar,
  TrendingUp,
  Activity,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts"

// Types
type AuthState = "welcome" | "login" | "register" | "authenticated"
type SensorType = "temp" | "moisture" | "light" | "waterVolume"

interface Sensor {
  id: number
  type: "Temperature" | "Moisture" | "Light"
  macId: string
  status: "Online" | "Offline"
  connectionStatus?: "connecting" | "online" | "failed"
}

interface Pump {
  id: number
  name: string
  mac: string
  sensors: Sensor[]
  sensorData: {
    temp: number
    moisture: number
    light: number
    waterVolume: number
  }
}

// Mock alerts data
const alerts = [
  { id: 1, message: "High Temp Alert: 42°C in Tomato Garden", time: "2 min ago", unread: true },
  { id: 2, message: "Low Moisture Warning: 30% in Orchid Pump", time: "15 min ago", unread: true },
  { id: 3, message: "Pump 03 turned ON automatically", time: "1 hour ago", unread: false },
  { id: 4, message: "System maintenance scheduled", time: "2 hours ago", unread: false },
]

const waterUsageData = [120, 145, 130, 165, 180, 155, 170, 190, 175, 160, 185, 195]

// Detailed sensor history data for modals
const sensorHistoryData = {
  temp: [24, 26, 28, 30, 29, 27, 28, 31, 30, 28, 27, 26],
  moisture: [55, 58, 62, 60, 65, 68, 70, 65, 62, 60, 63, 65],
  light: [45, 52, 68, 78, 85, 82, 75, 70, 60, 50, 45, 40],
  waterVolume: [2, 3, 4, 3.5, 4.2, 5, 4.8, 5.5, 6, 5.2, 4.8, 5],
}

// Generate mock data based on time filter
const generateChartData = (filter: "Day" | "Week" | "Month", sensorType: SensorType) => {
  const baseData = sensorHistoryData[sensorType]
  
  if (filter === "Day") {
    // 4-hour intervals: 0h, 4h, 8h, 12h, 16h, 20h, 24h
    const labels = ["0h", "4h", "8h", "12h", "16h", "20h", "24h"]
    return labels.map((label, i) => ({
      time: label,
      value: baseData[i % baseData.length] + Math.floor(Math.random() * 5 - 2),
    }))
  } else if (filter === "Week") {
    // Days of week
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    return labels.map((label, i) => ({
      time: label,
      value: baseData[i % baseData.length] + Math.floor(Math.random() * 5 - 2),
    }))
  }
  
  // Month - return 30 days data for calendar heatmap
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    value: Math.floor(Math.random() * 200) + 50,
  }))
}

// Generate month heatmap data for water usage
const generateMonthHeatmapData = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    value: Math.floor(Math.random() * 200) + 50,
  }))
}

export function SmartGarden() {
  const [authState, setAuthState] = useState<AuthState>("welcome")
  const [pumps, setPumps] = useState<Pump[]>([])
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null)
  const [activeTab, setActiveTab] = useState<"home" | "analytics" | "settings">("home")
  const [isPumpDropdownOpen, setIsPumpDropdownOpen] = useState(false)
  const [mode, setMode] = useState<"AUTO" | "MANUAL">("MANUAL")
  const [isPumpOn, setIsPumpOn] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [showAddPump, setShowAddPump] = useState(false)
  const [showAddSensor, setShowAddSensor] = useState(false)
  const [timeFilter, setTimeFilter] = useState<"Day" | "Week" | "Month">("Week")
  const [newPumpName, setNewPumpName] = useState("")
  const [newPumpMac, setNewPumpMac] = useState("")
  const [newSensorType, setNewSensorType] = useState<"Temperature" | "Moisture" | "Light">("Temperature")
  const [newSensorMac, setNewSensorMac] = useState("")
  
  // Modal states
  const [showModeConfirm, setShowModeConfirm] = useState(false)
  const [showPowerConfirm, setShowPowerConfirm] = useState(false)
  const [pendingPowerState, setPendingPowerState] = useState(false)
  const [showSensorDetail, setShowSensorDetail] = useState(false)
  const [selectedSensor, setSelectedSensor] = useState<SensorType | null>(null)
  const [sensorTimeFilter, setSensorTimeFilter] = useState<"Day" | "Week" | "Month">("Week")
  const [toast, setToast] = useState<{ message: string; visible: boolean; type?: "success" | "error" }>({ message: "", visible: false })
  
  // Profile states
  const [showProfile, setShowProfile] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Delete sensor states
  const [showDeleteSensor, setShowDeleteSensor] = useState(false)
  const [sensorToDelete, setSensorToDelete] = useState<Sensor | null>(null)
  
  // Auth form states
  const [loginForm, setLoginForm] = useState({ username: "", password: "", rememberMe: false })
  const [registerForm, setRegisterForm] = useState({ fullName: "", username: "", password: "", confirmPassword: "" })
  
  // Thresholds state
  const [thresholds, setThresholds] = useState({
    minTemp: 15,
    maxTemp: 35,
    moistureThreshold: 40,
    maxLight: 90,
  })

  // Async loading states
  const [isAddingPump, setIsAddingPump] = useState(false)
  const [isAddingSensor, setIsAddingSensor] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Analytics selected sensor for deep-linking
  const [analyticsSensor, setAnalyticsSensor] = useState<SensorType>("temp")

  const hasPumps = pumps.length > 0
  const sensorData = selectedPump?.sensorData || { temp: 0, moisture: 0, light: 0, waterVolume: 0 }
  const unreadAlerts = alerts.filter((a) => a.unread).length

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, visible: true, type })
    setTimeout(() => setToast({ message: "", visible: false }), 3000)
  }

  const handleModeSwitch = () => {
    if (mode === "AUTO") {
      setShowModeConfirm(true)
    } else {
      setMode("AUTO")
    }
  }

  const confirmModeSwitch = () => {
    setMode("MANUAL")
    setShowModeConfirm(false)
    showToast("Switched to MANUAL mode successfully")
  }

  const handlePowerToggle = (newState: boolean) => {
    setPendingPowerState(newState)
    setShowPowerConfirm(true)
  }

  const confirmPowerToggle = () => {
    setIsPumpOn(pendingPowerState)
    setShowPowerConfirm(false)
    showToast(`Pump ${pendingPowerState ? "turned ON" : "turned OFF"} successfully`)
  }

  // Deep-linking: click sensor card -> go to analytics with that sensor selected
  const handleSensorClick = (sensor: SensorType) => {
    setAnalyticsSensor(sensor)
    setActiveTab("analytics")
  }

  const handleAddPump = async () => {
    if (!newPumpName.trim() || !newPumpMac.trim()) return
    
    setIsAddingPump(true)
    setAddError(null)
    
    // Simulate async connection (1.5s)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Simulate failure if MAC ID is "fail"
    if (newPumpMac.trim().toLowerCase() === "fail") {
      setIsAddingPump(false)
      setAddError("Failed to connect to device. Please check the MAC ID and try again.")
      return
    }
    
    const newPump: Pump = {
      id: Date.now(),
      name: newPumpName.trim(),
      mac: newPumpMac.trim(),
      sensors: [],
      sensorData: {
        temp: 0,
        moisture: 0,
        light: 0,
        waterVolume: 0,
      },
    }
    
    setPumps((prev) => [...prev, newPump])
    setSelectedPump(newPump)
    setShowAddPump(false)
    setNewPumpName("")
    setNewPumpMac("")
    setIsAddingPump(false)
    showToast("Device connected successfully!")
  }

  const handleAddSensor = () => {
    if (!newSensorMac.trim() || !selectedPump) return
    
    // Capture the current selected sensor type before closing modal (use fallback if needed)
    const sensorTypeToAdd = availableSensorTypes.includes(newSensorType) ? newSensorType : availableSensorTypes[0]
    if (!sensorTypeToAdd) return
    const macIdToAdd = newSensorMac.trim()
    const sensorId = Date.now()
    
    // Create sensor with "connecting" status
    const newSensor: Sensor = {
      id: sensorId,
      type: sensorTypeToAdd,
      macId: macIdToAdd,
      status: "Offline",
      connectionStatus: "connecting",
    }
    
    // Add sensor immediately to state and close modal (non-blocking)
    const updatedPump = {
      ...selectedPump,
      sensors: [...selectedPump.sensors, newSensor],
    }
    
    setPumps((prev) => prev.map((p) => (p.id === selectedPump.id ? updatedPump : p)))
    setSelectedPump(updatedPump)
    
    // Close modal immediately and reset form
    setShowAddSensor(false)
    setNewSensorMac("")
    setNewSensorType("Temperature")
    
    // Simulate async connection (1.5s) after modal is closed
    setTimeout(() => {
      const isFailure = macIdToAdd.toLowerCase() === "fail"
      const sensorTypeKey = sensorTypeToAdd === "Temperature" ? "temp" : sensorTypeToAdd === "Moisture" ? "moisture" : "light"
      const mockValues = {
        temp: Math.floor(Math.random() * 15) + 20,
        moisture: Math.floor(Math.random() * 40) + 40,
        light: Math.floor(Math.random() * 50) + 30,
      }
      
      setPumps((prev) => {
        return prev.map((p) => {
          if (p.id !== selectedPump.id) return p
          
          const updatedSensors = p.sensors.map((s) => {
            if (s.id !== sensorId) return s
            return {
              ...s,
              status: isFailure ? "Offline" as const : "Online" as const,
              connectionStatus: isFailure ? "failed" as const : "online" as const,
            }
          })
          
          return {
            ...p,
            sensors: updatedSensors,
            sensorData: isFailure ? p.sensorData : {
              ...p.sensorData,
              [sensorTypeKey]: mockValues[sensorTypeKey as keyof typeof mockValues],
            },
          }
        })
      })
      
      // Also update selectedPump
      setSelectedPump((prev) => {
        if (!prev || prev.id !== selectedPump.id) return prev
        
        const updatedSensors = prev.sensors.map((s) => {
          if (s.id !== sensorId) return s
          return {
            ...s,
            status: isFailure ? "Offline" as const : "Online" as const,
            connectionStatus: isFailure ? "failed" as const : "online" as const,
          }
        })
        
        return {
          ...prev,
          sensors: updatedSensors,
          sensorData: isFailure ? prev.sensorData : {
            ...prev.sensorData,
            [sensorTypeKey]: mockValues[sensorTypeKey as keyof typeof mockValues],
          },
        }
      })
      
      if (isFailure) {
        showToast("Failed to connect sensor. Please remove and try again.", "error")
      } else {
        showToast("Device connected successfully!")
      }
    }, 1500)
  }

  const handleDeleteSensor = (sensor: Sensor) => {
    setSensorToDelete(sensor)
    setShowDeleteSensor(true)
  }

  const confirmDeleteSensor = () => {
    if (!sensorToDelete || !selectedPump) return
    
    const sensorTypeKey = sensorToDelete.type === "Temperature" ? "temp" : sensorToDelete.type === "Moisture" ? "moisture" : "light"
    
    const updatedPump = {
      ...selectedPump,
      sensors: selectedPump.sensors.filter((s) => s.id !== sensorToDelete.id),
      sensorData: {
        ...selectedPump.sensorData,
        [sensorTypeKey]: 0,
      },
    }
    
    setPumps((prev) => prev.map((p) => (p.id === selectedPump.id ? updatedPump : p)))
    setSelectedPump(updatedPump)
    setShowDeleteSensor(false)
    setSensorToDelete(null)
    showToast("Sensor removed successfully")
  }

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) return
    if (passwordForm.new !== passwordForm.confirm) return
    
    setPasswordForm({ current: "", new: "", confirm: "" })
    setShowChangePassword(false)
    showToast("Password changed successfully!")
  }

  const handleLogout = () => {
    setAuthState("welcome")
    setShowProfile(false)
    setPumps([])
    setSelectedPump(null)
    setActiveTab("home")
    showToast("Logged out successfully!")
  }

  // Get available sensor types for the selected pump
  const getAvailableSensorTypes = () => {
    if (!selectedPump) return ["Temperature", "Moisture", "Light"] as const
    const connectedTypes = selectedPump.sensors.map((s) => s.type)
    return (["Temperature", "Moisture", "Light"] as const).filter((type) => !connectedTypes.includes(type))
  }

  const availableSensorTypes = getAvailableSensorTypes()
  const allSensorsConnected = availableSensorTypes.length === 0

  // Reset sensor type when modal opens to first available type
  useEffect(() => {
    if (showAddSensor && availableSensorTypes.length > 0) {
      setNewSensorType(availableSensorTypes[0])
    }
  }, [showAddSensor, availableSensorTypes])

  // Auth screens
  if (authState !== "authenticated") {
    return (
      <div className="max-w-md mx-auto min-h-screen relative overflow-hidden bg-background flex flex-col">
        {authState === "welcome" && (
          <WelcomeScreen
            onLogin={() => setAuthState("login")}
            onRegister={() => setAuthState("register")}
          />
        )}
        {authState === "login" && (
          <LoginScreen
            form={loginForm}
            setForm={setLoginForm}
            onBack={() => setAuthState("welcome")}
            onLogin={() => setAuthState("authenticated")}
            onSwitchToRegister={() => setAuthState("register")}
          />
        )}
        {authState === "register" && (
          <RegisterScreen
            form={registerForm}
            setForm={setRegisterForm}
            onBack={() => setAuthState("welcome")}
            onRegister={() => setAuthState("authenticated")}
            onSwitchToLogin={() => setAuthState("login")}
          />
        )}
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto min-h-screen relative overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground text-sm">Hello,</p>
            <h1 className="text-xl font-semibold text-foreground">Farm Manager</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAlerts(true)}
              className="relative p-2 rounded-full bg-card shadow-sm hover:shadow-md transition-shadow"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadAlerts}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-sm hover:shadow-md transition-shadow"
            >
              FM
            </button>
          </div>
        </div>

        {/* Pump Selector - Only show if hasPumps */}
        {hasPumps && selectedPump && (
          <div className="relative">
            <button
              onClick={() => setIsPumpDropdownOpen(!isPumpDropdownOpen)}
              className="w-full flex items-center justify-between p-4 bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-foreground">{selectedPump.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedPump.mac}</p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  isPumpDropdownOpen && "rotate-180"
                )}
              />
            </button>

            {isPumpDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-lg z-20 overflow-hidden border border-border">
                {pumps.map((pump) => (
                  <button
                    key={pump.id}
                    onClick={() => {
                      setSelectedPump(pump)
                      setIsPumpDropdownOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors text-left",
                      selectedPump.id === pump.id && "bg-accent"
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Droplets className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{pump.name}</p>
                      <p className="text-xs text-muted-foreground">{pump.mac}</p>
                    </div>
                    {selectedPump.id === pump.id && (
                      <Check className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-5 pb-24">
        {activeTab === "home" && (
          hasPumps && selectedPump ? (
            <DashboardTab
              sensorData={sensorData}
              mode={mode}
              onModeSwitch={handleModeSwitch}
              isPumpOn={isPumpOn}
              onPowerToggle={handlePowerToggle}
              onSensorClick={handleSensorClick}
              thresholds={thresholds}
              sensors={selectedPump.sensors}
              onAddSensor={() => setShowAddSensor(true)}
              onDeleteSensor={handleDeleteSensor}
              allSensorsConnected={allSensorsConnected}
            />
          ) : (
            <EmptyState onAddPump={() => setShowAddPump(true)} />
          )
        )}
        {activeTab === "analytics" && (
          hasPumps ? (
            <AnalyticsTab
              timeFilter={timeFilter}
              setTimeFilter={setTimeFilter}
              waterUsageData={waterUsageData}
              sensorData={sensorData}
              selectedSensor={analyticsSensor}
              setSelectedSensor={setAnalyticsSensor}
              thresholds={thresholds}
            />
          ) : (
            <EmptyStateAnalytics />
          )
        )}
        {activeTab === "settings" && (
          hasPumps ? (
            <SettingsTab
              thresholds={thresholds}
              setThresholds={setThresholds}
              onAddPump={() => setShowAddPump(true)}
            />
          ) : (
            <EmptyStateSettings onAddPump={() => setShowAddPump(true)} />
          )
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-foreground px-6 py-3 rounded-full shadow-lg">
        {[
          { id: "home" as const, icon: Home, label: "Home" },
          { id: "analytics" as const, icon: BarChart3, label: "Stats" },
          { id: "settings" as const, icon: Settings, label: "Config" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted hover:text-card"
            )}
          >
            <tab.icon className="w-5 h-5" />
            {activeTab === tab.id && (
              <span className="text-sm font-medium">{tab.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Toast Notification */}
      <div
        className={cn(
          "fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all duration-300 z-50",
          toast.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
          toast.type === "error" ? "bg-destructive text-destructive-foreground" : "bg-foreground text-card"
        )}
      >
        {toast.type === "error" ? (
          <AlertCircle className="w-4 h-4" />
        ) : (
          <Check className="w-4 h-4 text-primary" />
        )}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>

      {/* Alerts Modal */}
      <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Alerts
            </DialogTitle>
            <DialogDescription className="sr-only">
              View recent alerts and notifications for your garden
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "p-4 rounded-2xl border transition-colors",
                  alert.unread
                    ? "bg-destructive/10 border-destructive/20"
                    : "bg-muted border-border"
                )}
              >
                <p className="text-sm text-foreground">{alert.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Pump Modal */}
      <Dialog open={showAddPump} onOpenChange={(open) => {
        setShowAddPump(open)
        if (!open) {
          setAddError(null)
          setIsAddingPump(false)
        }
      }}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add New Pump
            </DialogTitle>
            <DialogDescription className="sr-only">
              Enter the details for your new pump device
            </DialogDescription>
          </DialogHeader>
          
          {/* Error Banner */}
          {addError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{addError}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Pump Name
              </label>
              <Input
                placeholder="e.g., Rose Garden Pump"
                value={newPumpName}
                onChange={(e) => setNewPumpName(e.target.value)}
                className="rounded-xl"
                disabled={isAddingPump}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Device MAC ID
              </label>
              <Input
                placeholder="e.g., AA:BB:CC:DD:EE:FF"
                value={newPumpMac}
                onChange={(e) => setNewPumpMac(e.target.value)}
                className="rounded-xl"
                disabled={isAddingPump}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddPump(false)}
              className="rounded-xl"
              disabled={isAddingPump}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddPump}
              disabled={!newPumpName.trim() || !newPumpMac.trim() || isAddingPump}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isAddingPump ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Add Pump"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sensor Modal */}
      <Dialog open={showAddSensor} onOpenChange={(open) => {
        setShowAddSensor(open)
        if (!open) {
          // Reset modal state when closing
          setNewSensorMac("")
          setNewSensorType(availableSensorTypes[0] || "Temperature")
        }
      }}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Add New Sensor
            </DialogTitle>
            <DialogDescription className="sr-only">
              Add a sensor device to your pump
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Sensor Type
              </label>
              <Select 
                value={availableSensorTypes.includes(newSensorType) ? newSensorType : (availableSensorTypes[0] || "")} 
                onValueChange={(value: "Temperature" | "Moisture" | "Light") => setNewSensorType(value)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select sensor type" />
                </SelectTrigger>
                <SelectContent>
                  {availableSensorTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Device MAC ID
              </label>
              <Input
                placeholder="e.g., AA:BB:CC:DD:EE:FF"
                value={newSensorMac}
                onChange={(e) => setNewSensorMac(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddSensor(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSensor}
              disabled={!newSensorMac.trim()}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Add Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mode Confirmation Modal */}
      <Dialog open={showModeConfirm} onOpenChange={setShowModeConfirm}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirm Mode Switch
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Are you sure? This action will override the automated threshold controls.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModeConfirm(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmModeSwitch}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Power Toggle Confirmation Modal */}
      <Dialog open={showPowerConfirm} onOpenChange={setShowPowerConfirm}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Power className="w-5 h-5 text-primary" />
              Confirm Pump Action
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Confirm action to toggle the water pump?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPowerConfirm(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPowerToggle}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sensor Detail Modal */}
      <Dialog open={showSensorDetail} onOpenChange={setShowSensorDetail}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSensor === "temp" && <Thermometer className="w-5 h-5 text-primary" />}
              {selectedSensor === "moisture" && <Droplets className="w-5 h-5 text-primary" />}
              {selectedSensor === "light" && <Sun className="w-5 h-5 text-primary" />}
              {selectedSensor === "waterVolume" && <Beaker className="w-5 h-5 text-primary" />}
              {selectedSensor === "temp" && "Temperature Details"}
              {selectedSensor === "moisture" && "Soil Moisture Details"}
              {selectedSensor === "light" && "Light Intensity Details"}
              {selectedSensor === "waterVolume" && "Water Volume Details"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              View historical data and trends for this sensor
            </DialogDescription>
          </DialogHeader>
          
          {/* Time Filter Pills */}
          <div className="flex gap-2 mb-4">
            {["Day", "Week", "Month"].map((filter) => (
              <button
                key={filter}
                onClick={() => setSensorTimeFilter(filter as "Day" | "Week" | "Month")}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                  sensorTimeFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Line Chart */}
          <SensorLineChart
            data={selectedSensor ? sensorHistoryData[selectedSensor] : []}
            thresholdMin={selectedSensor === "temp" ? thresholds.minTemp : selectedSensor === "moisture" ? thresholds.moistureThreshold : 0}
            thresholdMax={selectedSensor === "temp" ? thresholds.maxTemp : selectedSensor === "light" ? thresholds.maxLight : 100}
            unit={selectedSensor === "temp" ? "°C" : selectedSensor === "waterVolume" ? "L" : "%"}
            showThresholds={selectedSensor === "temp" || selectedSensor === "moisture" || selectedSensor === "light"}
          />

          <p className="text-xs text-muted-foreground text-center mt-2">
            Data retention: Last 3 months
          </p>
        </DialogContent>
      </Dialog>

      {/* Delete Sensor Confirmation Modal */}
      <Dialog open={showDeleteSensor} onOpenChange={setShowDeleteSensor}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Remove Sensor
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Are you sure you want to remove this sensor? You will need to pair it again to receive data.
            </DialogDescription>
          </DialogHeader>
          {sensorToDelete && (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center">
                {sensorToDelete.type === "Temperature" && <Thermometer className="w-5 h-5 text-primary" />}
                {sensorToDelete.type === "Moisture" && <Droplets className="w-5 h-5 text-primary" />}
                {sensorToDelete.type === "Light" && <Sun className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <p className="font-medium text-foreground">{sensorToDelete.type} Sensor</p>
                <p className="text-xs text-muted-foreground">{sensorToDelete.macId}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteSensor(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteSensor}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile
            </DialogTitle>
            <DialogDescription className="sr-only">
              Manage your account settings
            </DialogDescription>
          </DialogHeader>
          
          {!showChangePassword ? (
            <div className="space-y-4">
              {/* User Avatar */}
              <div className="flex flex-col items-center py-4">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl mb-3">
                  FM
                </div>
                <h3 className="text-lg font-semibold text-foreground">Farm Manager</h3>
                <p className="text-sm text-muted-foreground">@admin_farm</p>
              </div>
              
              {/* User Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <span className="text-sm text-muted-foreground">Full Name</span>
                  <span className="text-sm font-medium text-foreground">Farm Manager</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <span className="text-sm text-muted-foreground">Username</span>
                  <span className="text-sm font-medium text-foreground">admin_farm</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium text-foreground">manager@smartgarden.com</span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowChangePassword(true)}
                  className="w-full rounded-xl py-5 justify-start gap-3"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full rounded-xl py-5 justify-start gap-3 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setShowChangePassword(false)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Profile
              </button>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">New Password</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Confirm New Password</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleChangePassword}
                disabled={!passwordForm.current || !passwordForm.new || !passwordForm.confirm || passwordForm.new !== passwordForm.confirm}
                className="w-full rounded-xl py-5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save Password
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Welcome Screen Component
function WelcomeScreen({
  onLogin,
  onRegister,
}: {
  onLogin: () => void
  onRegister: () => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8">
      <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8">
        <Sprout className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2 text-balance text-center">Welcome to Smart Garden</h1>
      <p className="text-muted-foreground text-center mb-12 text-pretty">
        Manage your water pumps and monitor agricultural sensors with ease
      </p>
      <div className="w-full space-y-3">
        <Button
          onClick={onLogin}
          className="w-full py-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-medium"
        >
          Login
        </Button>
        <Button
          onClick={onRegister}
          variant="outline"
          className="w-full py-6 rounded-2xl text-lg font-medium border-2"
        >
          Register
        </Button>
      </div>
    </div>
  )
}

// Login Screen Component
function LoginScreen({
  form,
  setForm,
  onBack,
  onLogin,
  onSwitchToRegister,
}: {
  form: { username: string; password: string; rememberMe: boolean }
  setForm: (form: { username: string; password: string; rememberMe: boolean }) => void
  onBack: () => void
  onLogin: () => void
  onSwitchToRegister: () => void
}) {
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})
  const [touched, setTouched] = useState<{ username?: boolean; password?: boolean }>({})
  const [showPassword, setShowPassword] = useState(false)

  const validateField = (field: "username" | "password", value: string) => {
    if (!value.trim()) {
      return "This field is required"
    }
    if (field === "username" && value.trim().toLowerCase() === "admin") {
      return "This username is not allowed"
    }
    return undefined
  }

  const handleBlur = (field: "username" | "password") => {
    setTouched({ ...touched, [field]: true })
    const error = validateField(field, form[field])
    setErrors({ ...errors, [field]: error })
  }

  const handleSubmit = () => {
    const usernameError = validateField("username", form.username)
    const passwordError = validateField("password", form.password)
    
    setErrors({ username: usernameError, password: passwordError })
    setTouched({ username: true, password: true })
    
    if (!usernameError && !passwordError) {
      onLogin()
    }
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-6">
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center hover:shadow-md transition-shadow mb-8"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>
      
      <h1 className="text-2xl font-bold text-foreground mb-2">Welcome back</h1>
      <p className="text-muted-foreground mb-8">Sign in to continue</p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Username</label>
          <Input
            placeholder="Enter your username"
            value={form.username}
            onChange={(e) => {
              setForm({ ...form, username: e.target.value })
              if (touched.username) {
                setErrors({ ...errors, username: validateField("username", e.target.value) })
              }
            }}
            onBlur={() => handleBlur("username")}
            className={cn("rounded-xl py-6", touched.username && errors.username && "border-destructive focus-visible:ring-destructive")}
          />
          {touched.username && errors.username && (
            <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.username}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value })
                if (touched.password) {
                  setErrors({ ...errors, password: validateField("password", e.target.value) })
                }
              }}
              onBlur={() => handleBlur("password")}
              className={cn("rounded-xl py-6 pr-10", touched.password && errors.password && "border-destructive focus-visible:ring-destructive")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {touched.password && errors.password && (
            <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setForm({ ...form, rememberMe: !form.rememberMe })}
            className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
              form.rememberMe ? "bg-primary border-primary" : "border-muted-foreground"
            )}
          >
            {form.rememberMe && <Check className="w-3 h-3 text-primary-foreground" />}
          </button>
          <span className="text-sm text-muted-foreground">Remember me</span>
        </div>
      </div>

      <div className="pb-8">
        <Button
          onClick={handleSubmit}
          className="w-full py-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-medium mb-4"
        >
          Login
        </Button>
        <p className="text-center text-muted-foreground">
          {"Don't have an account? "}
          <button onClick={onSwitchToRegister} className="text-primary font-medium">
            Register
          </button>
        </p>
      </div>
    </div>
  )
}

// Register Screen Component
function RegisterScreen({
  form,
  setForm,
  onBack,
  onRegister,
  onSwitchToLogin,
}: {
  form: { fullName: string; username: string; password: string; confirmPassword: string }
  setForm: (form: { fullName: string; username: string; password: string; confirmPassword: string }) => void
  onBack: () => void
  onRegister: () => void
  onSwitchToLogin: () => void
}) {
  const [errors, setErrors] = useState<{ fullName?: string; username?: string; password?: string; confirmPassword?: string }>({})
  const [touched, setTouched] = useState<{ fullName?: boolean; username?: boolean; password?: boolean; confirmPassword?: boolean }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateField = (field: keyof typeof form, value: string) => {
    if (!value.trim()) {
      return "This field is required"
    }
    if (field === "username" && value.trim().toLowerCase() === "admin") {
      return "Username already exists. Please choose another."
    }
    if (field === "confirmPassword" && value !== form.password) {
      return "Passwords do not match"
    }
    if (field === "password" && value.length < 6) {
      return "Password must be at least 6 characters"
    }
    return undefined
  }

  const handleBlur = (field: keyof typeof form) => {
    setTouched({ ...touched, [field]: true })
    const error = validateField(field, form[field])
    setErrors({ ...errors, [field]: error })
  }

  const handleSubmit = () => {
    setServerError(null)
    
    const fullNameError = validateField("fullName", form.fullName)
    const usernameError = validateField("username", form.username)
    const passwordError = validateField("password", form.password)
    const confirmPasswordError = validateField("confirmPassword", form.confirmPassword)
    
    setErrors({
      fullName: fullNameError,
      username: usernameError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
    })
    setTouched({ fullName: true, username: true, password: true, confirmPassword: true })
    
    // Mock server error for "admin" username
    if (form.username.trim().toLowerCase() === "admin") {
      setServerError("Username already exists. Please choose another.")
      return
    }
    
    if (!fullNameError && !usernameError && !passwordError && !confirmPasswordError) {
      onRegister()
    }
  }

  return (
    <div className="flex-1 flex flex-col px-6 pt-6">
      <button
        onClick={onBack}
        className="w-10 h-10 rounded-full bg-card shadow-sm flex items-center justify-center hover:shadow-md transition-shadow mb-8"
      >
        <ArrowLeft className="w-5 h-5 text-foreground" />
      </button>
      
      <h1 className="text-2xl font-bold text-foreground mb-2">Create account</h1>
      <p className="text-muted-foreground mb-8">Sign up to get started</p>

      {/* Server Error Banner */}
      {serverError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <div className="space-y-4 flex-1">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Full Name</label>
          <Input
            placeholder="Enter your full name"
            value={form.fullName}
            onChange={(e) => {
              setForm({ ...form, fullName: e.target.value })
              if (touched.fullName) {
                setErrors({ ...errors, fullName: validateField("fullName", e.target.value) })
              }
            }}
            onBlur={() => handleBlur("fullName")}
            className={cn("rounded-xl py-6", touched.fullName && errors.fullName && "border-destructive focus-visible:ring-destructive")}
          />
          {touched.fullName && errors.fullName && (
            <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.fullName}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Username</label>
          <Input
            placeholder="Choose a username"
            value={form.username}
            onChange={(e) => {
              setForm({ ...form, username: e.target.value })
              setServerError(null)
              if (touched.username) {
                setErrors({ ...errors, username: validateField("username", e.target.value) })
              }
            }}
            onBlur={() => handleBlur("username")}
            className={cn("rounded-xl py-6", (touched.username && errors.username) && "border-destructive focus-visible:ring-destructive")}
          />
          {touched.username && errors.username && (
            <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.username}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value })
                if (touched.password) {
                  setErrors({ ...errors, password: validateField("password", e.target.value) })
                }
              }}
              onBlur={() => handleBlur("password")}
              className={cn("rounded-xl py-6 pr-10", touched.password && errors.password && "border-destructive focus-visible:ring-destructive")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {touched.password && errors.password && (
            <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password}
            </p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Confirm Password</label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={(e) => {
                setForm({ ...form, confirmPassword: e.target.value })
                if (touched.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: validateField("confirmPassword", e.target.value) })
                }
              }}
              onBlur={() => handleBlur("confirmPassword")}
              className={cn("rounded-xl py-6 pr-10", touched.confirmPassword && errors.confirmPassword && "border-destructive focus-visible:ring-destructive")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {touched.confirmPassword && errors.confirmPassword && (
            <p className="text-sm text-destructive mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.confirmPassword}
            </p>
          )}
        </div>
      </div>

      <div className="pb-8">
        <Button
          onClick={handleSubmit}
          className="w-full py-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-medium mb-4"
        >
          Sign Up
        </Button>
        <p className="text-center text-muted-foreground">
          Already have an account?{" "}
          <button onClick={onSwitchToLogin} className="text-primary font-medium">
            Login
          </button>
        </p>
      </div>
    </div>
  )
}

// Empty State Component (Home)
function EmptyState({ onAddPump }: { onAddPump: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Sprout className="w-16 h-16 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
        {"You haven't added any pumps yet"}
      </h2>
      <p className="text-muted-foreground text-center mb-8 max-w-xs">
        Add your first pump to start monitoring your garden
      </p>
      <Button
        onClick={onAddPump}
        className="px-8 py-6 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-medium"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add Your First Pump
      </Button>
    </div>
  )
}

// Empty State Component (Analytics)
function EmptyStateAnalytics() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <BarChart3 className="w-12 h-12 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2 text-center">
        No Analytics Available
      </h2>
      <p className="text-muted-foreground text-center max-w-xs">
        Please add a pump on the Home screen to view analytics.
      </p>
    </div>
  )
}

// Empty State Component (Settings)
function EmptyStateSettings({ onAddPump }: { onAddPump: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
        <Settings className="w-12 h-12 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2 text-center">
        No Pump Selected
      </h2>
      <p className="text-muted-foreground text-center mb-8 max-w-xs">
        Add a pump to configure thresholds.
      </p>
      <Button
        variant="outline"
        onClick={onAddPump}
        className="rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-colors"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add New Pump
      </Button>
    </div>
  )
}

// Dashboard Tab Component
function DashboardTab({
  sensorData,
  mode,
  onModeSwitch,
  isPumpOn,
  onPowerToggle,
  onSensorClick,
  thresholds,
  sensors,
  onAddSensor,
  onDeleteSensor,
  allSensorsConnected,
}: {
  sensorData: { temp: number; moisture: number; light: number; waterVolume: number }
  mode: "AUTO" | "MANUAL"
  onModeSwitch: () => void
  isPumpOn: boolean
  onPowerToggle: (newState: boolean) => void
  onSensorClick: (sensor: SensorType) => void
  thresholds: { minTemp: number; maxTemp: number; moistureThreshold: number; maxLight: number }
  sensors: Sensor[]
  onAddSensor: () => void
  onDeleteSensor: (sensor: Sensor) => void
  allSensorsConnected: boolean
}) {
  const hasTemp = sensors.some(s => s.type === "Temperature")
  const hasMoisture = sensors.some(s => s.type === "Moisture")
  const hasLight = sensors.some(s => s.type === "Light")
  const hasSensors = sensors.length > 0

  // Check for critical alerts
  const isTempCritical = hasTemp && sensorData.temp > 38
  const isMoistureCritical = hasMoisture && sensorData.moisture < 30

  return (
    <div className="space-y-6">
      {/* Sensor Grid */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Sensor Readings</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* No Sensors Placeholder */}
          {!hasSensors && (
            <div className="col-span-2 bg-card rounded-3xl p-6 shadow-sm border-2 border-dashed border-border">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Wifi className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium mb-1">No sensors connected yet</p>
                <p className="text-sm text-muted-foreground">
                  Add sensors below to start monitoring.
                </p>
              </div>
            </div>
          )}

          {/* Temperature Card - Only show if sensor exists */}
          {hasTemp && (
            <SensorCard
              icon={Thermometer}
              label="Temperature"
              value={sensorData.temp}
              unit="°C"
              variant="default"
              onClick={() => onSensorClick("temp")}
              isCritical={isTempCritical}
            />
          )}
          
          {/* Light Card - Only show if sensor exists */}
          {hasLight && (
            <SensorCard
              icon={Sun}
              label="Light Intensity"
              value={sensorData.light}
              unit="%"
              variant="default"
              onClick={() => onSensorClick("light")}
            />
          )}
          
          {/* Moisture Card - Only show if sensor exists */}
          {hasMoisture && (
            <div className={cn(hasTemp && hasLight ? "col-span-2" : hasTemp || hasLight ? "" : "col-span-2")}>
              <SensorCard
                icon={Droplets}
                label="Soil Moisture"
                value={sensorData.moisture}
                unit="%"
                variant="primary"
                onClick={() => onSensorClick("moisture")}
                isCritical={isMoistureCritical}
              />
            </div>
          )}

          {/* Water Volume Card - Always visible, shows 0 L when no watering */}
          <div className="col-span-2">
            <SensorCard
              icon={Beaker}
              label="Today's Water Volume"
              value={sensorData.waterVolume}
              unit="L"
              variant="default"
              onClick={() => onSensorClick("waterVolume")}
            />
          </div>
        </div>
      </section>

      {/* Control Section */}
      <section className="bg-card rounded-3xl p-5 shadow-sm">
        <h2 className="text-sm font-medium text-muted-foreground mb-4">Pump Control</h2>
        
        {/* Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-foreground font-medium">Mode</span>
          <div className="flex bg-muted rounded-full p-1">
            {["AUTO", "MANUAL"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  if (mode !== m) {
                    if (m === "MANUAL") {
                      onModeSwitch()
                    } else {
                      // Switching to AUTO doesn't need confirmation
                      onModeSwitch()
                    }
                  }
                }}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  mode === m
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Power Toggle */}
        <div
          className={cn(
            "flex items-center justify-between p-4 rounded-2xl transition-all",
            mode === "AUTO" ? "opacity-50" : "opacity-100",
            isPumpOn ? "bg-primary/10" : "bg-muted"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                isPumpOn ? "bg-primary" : "bg-muted-foreground/20"
              )}
            >
              <Power
                className={cn(
                  "w-6 h-6",
                  isPumpOn ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
            </div>
            <div>
              <p className="font-medium text-foreground">Pump Motor</p>
              <p className="text-sm text-muted-foreground">
                {mode === "AUTO" ? "Auto-controlled" : isPumpOn ? "Running" : "Stopped"}
              </p>
            </div>
          </div>
          <Switch
            checked={isPumpOn}
            onCheckedChange={(checked) => {
              if (mode === "MANUAL") {
                onPowerToggle(checked)
              }
            }}
            disabled={mode === "AUTO"}
            className="data-[state=checked]:bg-primary scale-125"
          />
        </div>
      </section>

      {/* Device Status */}
      <section className="bg-card rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">Device Status</h2>
          {!allSensorsConnected && (
            <button
              onClick={onAddSensor}
              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4 text-primary" />
            </button>
          )}
        </div>
        <div className="space-y-3">
          {sensors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No sensors added yet
            </p>
          ) : (
            sensors.map((sensor) => (
              <div
                key={sensor.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    {sensor.type === "Temperature" && <Thermometer className="w-4 h-4 text-primary" />}
                    {sensor.type === "Moisture" && <Droplets className="w-4 h-4 text-primary" />}
                    {sensor.type === "Light" && <Sun className="w-4 h-4 text-primary" />}
                  </div>
                  <div>
                    <span className="text-foreground text-sm">{sensor.type} Sensor</span>
                    <p className="text-xs text-muted-foreground">{sensor.macId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Connection status indicator */}
                  {sensor.connectionStatus === "connecting" ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-sm font-medium text-primary">Connecting...</span>
                    </div>
                  ) : sensor.connectionStatus === "failed" ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="text-sm font-medium text-destructive">Failed</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        sensor.status === "Online" ? "bg-green-500" : "bg-destructive"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        sensor.status === "Online" ? "text-green-600" : "text-destructive"
                      )}>{sensor.status}</span>
                    </div>
                  )}
                  <button
                    onClick={() => onDeleteSensor(sensor)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
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

// Sensor Card Component
function SensorCard({
  icon: Icon,
  label,
  value,
  unit,
  variant = "default",
  onClick,
  isCritical = false,
}: {
  icon: React.ElementType
  label: string
  value: number
  unit: string
  variant?: "default" | "primary"
  onClick?: () => void
  isCritical?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow",
        isCritical
          ? "bg-red-50 dark:bg-red-950/30"
          : variant === "primary"
            ? "bg-primary text-primary-foreground"
            : "bg-card text-foreground"
      )}
    >
      {/* Blinking Alert Icon for Critical State */}
      {isCritical && (
        <div className="absolute top-3 right-3">
          <AlertTriangle className="w-5 h-5 text-destructive animate-pulse" />
        </div>
      )}
      
      <div className="flex items-start justify-between mb-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isCritical
              ? "bg-red-100 dark:bg-red-900/50"
              : variant === "primary" 
                ? "bg-primary-foreground/20" 
                : "bg-muted"
          )}
        >
          <Icon
            className={cn(
              "w-5 h-5",
              isCritical
                ? "text-destructive"
                : variant === "primary" 
                  ? "text-primary-foreground" 
                  : "text-primary"
            )}
          />
        </div>
        {!isCritical && (
          <ArrowUpRight
            className={cn(
              "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
              variant === "primary" ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          />
        )}
      </div>
      <p
        className={cn(
          "text-3xl font-bold",
          isCritical
            ? "text-destructive"
            : variant === "primary" 
              ? "text-primary-foreground" 
              : "text-foreground"
        )}
      >
        {value}
        <span className="text-lg font-normal ml-1">{unit}</span>
      </p>
      <p
        className={cn(
          "text-sm mt-1",
          isCritical
            ? "text-destructive/70"
            : variant === "primary" 
              ? "text-primary-foreground/70" 
              : "text-muted-foreground"
        )}
      >
        {label}
      </p>
    </button>
  )
}

// Sensor Line Chart Component
function SensorLineChart({
  data,
  thresholdMin,
  thresholdMax,
  unit,
  showThresholds = true,
}: {
  data: number[]
  thresholdMin: number
  thresholdMax: number
  unit: string
  showThresholds?: boolean
}) {
  const maxValue = Math.max(...data, thresholdMax) * 1.1
  const minValue = Math.min(...data, thresholdMin) * 0.9

  const getY = (value: number) => {
    const range = maxValue - minValue
    return 100 - ((value - minValue) / range) * 100
  }

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = getY(value)
    return `${x},${y}`
  }).join(" ")

  return (
    <div className="bg-muted rounded-2xl p-4 relative">
      <svg viewBox="0 0 100 60" className="w-full h-40" preserveAspectRatio="none">
        {/* Threshold Lines */}
        {showThresholds && (
          <>
            <line
              x1="0"
              y1={getY(thresholdMax)}
              x2="100"
              y2={getY(thresholdMax)}
              stroke="currentColor"
              strokeWidth="0.3"
              strokeDasharray="2"
              className="text-destructive"
            />
            <line
              x1="0"
              y1={getY(thresholdMin)}
              x2="100"
              y2={getY(thresholdMin)}
              stroke="currentColor"
              strokeWidth="0.3"
              strokeDasharray="2"
              className="text-primary"
            />
          </>
        )}
        
        {/* Line Chart */}
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          points={points}
          className="text-primary"
        />
        
        {/* Data Points */}
        {data.map((value, i) => {
          const x = (i / (data.length - 1)) * 100
          const y = getY(value)
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1.5"
              fill="currentColor"
              className="text-primary"
            />
          )
        })}
      </svg>

      {/* Legend */}
      {showThresholds && (
        <div className="flex items-center justify-center gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-destructive rounded" />
            <span className="text-muted-foreground">Max threshold</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-primary rounded" />
            <span className="text-muted-foreground">Min threshold</span>
          </div>
        </div>
      )}

      {/* Current Value */}
      <div className="absolute top-4 right-4 bg-card px-3 py-1.5 rounded-lg shadow-sm">
        <span className="text-lg font-bold text-foreground">{data[data.length - 1]}{unit}</span>
      </div>
    </div>
  )
}

// Calendar Heatmap Component for Month view
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
      {/* Day labels */}
      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
        <div key={i} className="text-xs text-muted-foreground text-center font-medium py-1">
          {day}
        </div>
      ))}
      
      {/* Empty cells for first day offset (assuming month starts on different days) */}
      {Array.from({ length: 3 }, (_, i) => (
        <div key={`empty-${i}`} className="aspect-square" />
      ))}
      
      {/* Day cells */}
      {data.map((item) => (
        <div
          key={item.day}
          className={cn(
            "aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors",
            getIntensity(item.value),
            item.value > maxValue * 0.5 ? "text-primary-foreground" : "text-foreground"
          )}
          title={`Day ${item.day}: ${item.value}L`}
        >
          {item.day}
        </div>
      ))}
    </div>
  )
}

// Analytics Tab Component (Revamped with Recharts)
function AnalyticsTab({
  timeFilter,
  setTimeFilter,
  waterUsageData,
  sensorData,
  selectedSensor,
  setSelectedSensor,
  thresholds,
}: {
  timeFilter: "Day" | "Week" | "Month"
  setTimeFilter: (filter: "Day" | "Week" | "Month") => void
  waterUsageData: number[]
  sensorData: { temp: number; moisture: number; light: number; waterVolume: number }
  selectedSensor: SensorType
  setSelectedSensor: (sensor: SensorType) => void
  thresholds: { minTemp: number; maxTemp: number; moistureThreshold: number; maxLight: number }
}) {
  const [showSourceData, setShowSourceData] = useState(false)
  
  // Memoize chart data to prevent re-render jitter
  const chartData = useMemo(() => {
    const baseData = sensorHistoryData[selectedSensor]
    
    if (timeFilter === "Day") {
      const labels = ["0h", "4h", "8h", "12h", "16h", "20h", "24h"]
      return labels.map((label, i) => ({
        time: label,
        value: baseData[i % baseData.length] + Math.floor(Math.random() * 5 - 2),
      }))
    } else if (timeFilter === "Week") {
      const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      return labels.map((label, i) => ({
        time: label,
        value: baseData[i % baseData.length] + Math.floor(Math.random() * 5 - 2),
      }))
    }
    
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      value: Math.floor(Math.random() * 200) + 50,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, selectedSensor])
  
  // Memoize water usage bar chart data
  const waterBarData = useMemo(() => {
    if (timeFilter === "Day") {
      return waterUsageData.slice(0, 7).map((value, i) => ({
        time: `${i * 4}h`,
        value,
      }))
    } else if (timeFilter === "Week") {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => ({
        time: day,
        value: waterUsageData[i % waterUsageData.length],
      }))
    }
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      value: Math.floor(Math.random() * 200) + 50,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter])
  
  // Get thresholds for selected sensor
  const getThresholdLines = () => {
    switch (selectedSensor) {
      case "temp":
        return { min: thresholds.minTemp, max: thresholds.maxTemp }
      case "moisture":
        return { min: thresholds.moistureThreshold, max: 100 }
      case "light":
        return { min: 0, max: thresholds.maxLight }
      default:
        return { min: 0, max: 100 }
    }
  }
  
  const thresholdLines = getThresholdLines()
  
  // Get unit for selected sensor
  const getUnit = () => {
    switch (selectedSensor) {
      case "temp": return "°C"
      case "moisture": return "%"
      case "light": return "%"
      case "waterVolume": return "L"
      default: return ""
    }
  }

  // Get label for selected sensor
  const getSensorLabel = () => {
    switch (selectedSensor) {
      case "temp": return "Temperature"
      case "moisture": return "Soil Moisture"
      case "light": return "Light Intensity"
      case "waterVolume": return "Water Volume"
      default: return ""
    }
  }

  // Get dynamic date context label
  const getDateContextLabel = () => {
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" }
    
    if (timeFilter === "Day") {
      return `Today, ${today.toLocaleDateString("en-US", options)}`
    } else if (timeFilter === "Week") {
      return "Current Week"
    } else {
      return today.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    }
  }

  // Calculate contextual summary insights
  const getSummaryInsights = () => {
    if (selectedSensor === "waterVolume") {
      const totalVolume = waterUsageData.reduce((a, b) => a + b, 0)
      const avgDailyVolume = Math.round(totalVolume / 7)
      const pumpCycles = Math.floor(totalVolume / 20) // Assume 20L per cycle
      return {
        items: [
          { icon: Beaker, value: `${totalVolume}L`, label: "Total Volume" },
          { icon: Activity, value: `${avgDailyVolume}L`, label: "Avg Daily" },
          { icon: TrendingUp, value: `${pumpCycles}`, label: "Pump Cycles" },
        ]
      }
    }
    
    // For Temp/Moisture/Light sensors
    const values = (chartData as { time?: string; value: number }[]).map(d => d.value)
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    const max = Math.max(...values)
    
    // Calculate time out of optimal range
    let outOfRangeCount = 0
    values.forEach(v => {
      if (selectedSensor === "temp" && (v < thresholds.minTemp || v > thresholds.maxTemp)) outOfRangeCount++
      if (selectedSensor === "moisture" && v < thresholds.moistureThreshold) outOfRangeCount++
      if (selectedSensor === "light" && v > thresholds.maxLight) outOfRangeCount++
    })
    const outOfRangeHours = timeFilter === "Day" ? outOfRangeCount * 4 : outOfRangeCount * 24
    
    const unit = getUnit()
    const sensorIcon = selectedSensor === "temp" ? Thermometer : selectedSensor === "moisture" ? Droplets : Sun
    
    return {
      items: [
        { icon: sensorIcon, value: `${avg}${unit}`, label: "Average" },
        { icon: TrendingUp, value: `${max}${unit}`, label: "Highest" },
        { icon: AlertTriangle, value: `${outOfRangeHours}h`, label: "Out of Range" },
      ]
    }
  }

  const summaryInsights = getSummaryInsights()
  const isWaterSelected = selectedSensor === "waterVolume"
  
  return (
    <div className="space-y-6">
      {/* Time Filter */}
      <div className="flex gap-2">
        {["Day", "Week", "Month"].map((filter) => (
          <button
            key={filter}
            onClick={() => setTimeFilter(filter as "Day" | "Week" | "Month")}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              timeFilter === filter
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground shadow-sm"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Sensor Selector */}
      <section className="bg-card rounded-3xl p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">Select Data Type</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "temp" as SensorType, icon: Thermometer, label: "Temp" },
            { id: "moisture" as SensorType, icon: Droplets, label: "Moisture" },
            { id: "light" as SensorType, icon: Sun, label: "Light" },
            { id: "waterVolume" as SensorType, icon: Beaker, label: "Water" },
          ].map((sensor) => (
            <button
              key={sensor.id}
              onClick={() => setSelectedSensor(sensor.id)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                selectedSensor === sensor.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <sensor.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{sensor.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Main Chart Section - Contextual based on selected sensor */}
      <section className="bg-card rounded-3xl p-5 shadow-sm">
        {/* Date Context Label */}
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{getDateContextLabel()}</span>
        </div>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-foreground">{getSensorLabel()}</h2>
            <p className="text-sm text-muted-foreground">
              {timeFilter === "Day" ? "Hourly data" : timeFilter === "Week" ? "Daily data" : "Monthly overview"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {sensorData[selectedSensor]}{getUnit()}
            </p>
            <p className="text-xs text-muted-foreground">Current</p>
          </div>
        </div>
        
        {!showSourceData ? (
          <>
            {timeFilter !== "Month" ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  {isWaterSelected ? (
                    <BarChart 
                      data={waterBarData as { time: string; value: number }[]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                        formatter={(value: number) => [`${value}L`, "Water Used"]}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <LineChart 
                      data={chartData as { time: string; value: number }[]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        axisLine={{ stroke: "hsl(var(--border))" }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px"
                        }}
                        formatter={(value: number) => [`${value}${getUnit()}`, getSensorLabel()]}
                      />
                      <ReferenceLine 
                        y={thresholdLines.max} 
                        stroke="hsl(var(--destructive))" 
                        strokeDasharray="5 5" 
                        label={{ value: "Max", fontSize: 10, fill: "hsl(var(--destructive))" }}
                      />
                      <ReferenceLine 
                        y={thresholdLines.min} 
                        stroke="hsl(var(--primary))" 
                        strokeDasharray="5 5" 
                        label={{ value: "Min", fontSize: 10, fill: "hsl(var(--primary))" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                      />
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
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                    {timeFilter === "Month" ? "Day" : "Time"}
                  </th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                    Value ({getUnit()})
                  </th>
                </tr>
              </thead>
              <tbody>
                {(isWaterSelected ? waterBarData : chartData as { time?: string; day?: number; value: number }[]).map((item, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 px-3 text-foreground">
                      {timeFilter === "Month" ? `Day ${(item as { day: number }).day}` : (item as { time: string }).time}
                    </td>
                    <td className="py-2 px-3 text-right text-foreground font-medium">
                      {item.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <button
          onClick={() => setShowSourceData(!showSourceData)}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Table className="w-4 h-4" />
          {showSourceData ? "View Chart" : "View Source Data"}
        </button>
      </section>

      {/* Contextual Summary Insights */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          {isWaterSelected ? "Water Usage Summary" : `${getSensorLabel()} Summary`}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {summaryInsights.items.map((item, index) => (
            <div key={index} className="bg-card rounded-2xl p-4 shadow-sm text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xl font-bold text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// Settings Tab Component
function SettingsTab({
  thresholds,
  setThresholds,
  onAddPump,
}: {
  thresholds: {
    minTemp: number
    maxTemp: number
    moistureThreshold: number
    maxLight: number
  }
  setThresholds: (thresholds: {
    minTemp: number
    maxTemp: number
    moistureThreshold: number
    maxLight: number
  }) => void
  onAddPump: () => void
}) {
  const [localThresholds, setLocalThresholds] = useState(thresholds)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setThresholds(localThresholds)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Threshold Form */}
      <section className="bg-card rounded-3xl p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">Threshold Configuration</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Min Temp (°C)
              </label>
              <Input
                type="number"
                value={localThresholds.minTemp}
                onChange={(e) =>
                  setLocalThresholds({ ...localThresholds, minTemp: +e.target.value })
                }
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Max Temp (°C)
              </label>
              <Input
                type="number"
                value={localThresholds.maxTemp}
                onChange={(e) =>
                  setLocalThresholds({ ...localThresholds, maxTemp: +e.target.value })
                }
                className="rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Moisture Threshold (%)
            </label>
            <Input
              type="number"
              value={localThresholds.moistureThreshold}
              onChange={(e) =>
                setLocalThresholds({
                  ...localThresholds,
                  moistureThreshold: +e.target.value,
                })
              }
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Max Light (%)
            </label>
            <Input
              type="number"
              value={localThresholds.maxLight}
              onChange={(e) =>
                setLocalThresholds({ ...localThresholds, maxLight: +e.target.value })
              }
              className="rounded-xl"
            />
          </div>
          <Button
            onClick={handleSave}
            className={cn(
              "w-full rounded-xl transition-all",
              saved
                ? "bg-primary/80 text-primary-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {saved ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Saved!
              </span>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </div>
      </section>

      {/* Add New Device */}
      <section className="bg-card rounded-3xl p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">Device Management</h2>
        <Button
          variant="outline"
          onClick={onAddPump}
          className="w-full rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Pump
        </Button>
      </section>

      {/* About */}
      <section className="bg-card rounded-3xl p-5 shadow-sm">
        <h2 className="font-semibold text-foreground mb-2">About Smart Garden</h2>
        <p className="text-sm text-muted-foreground">
          Version 1.0.0 - IoT Pump Management System for smart agriculture and gardening.
        </p>
      </section>
    </div>
  )
}
