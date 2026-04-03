"use client"

import React, { useState, useEffect } from "react"
import { Bell, Home, BarChart3, Settings, Droplets, ChevronDown, Check, Plus, AlertCircle, AlertTriangle, Loader2, User, Lock, LogOut, ArrowLeft, Eye, EyeOff, Power } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { AuthState, SensorType, Sensor, Pump } from "@/types/smart-garden"
import { alerts, waterUsageData } from "@/lib/mock-data"

import { WelcomeScreen, LoginScreen, RegisterScreen } from "./auth-screens"
import { DashboardTab, EmptyState } from "./dashboard-tab"
import { AnalyticsTab, EmptyStateAnalytics } from "./analytics-tab"
import { SettingsTab, EmptyStateSettings } from "./settings-tab"

const API_BASE_URL = "https://mac4tpet6z.ap-southeast-1.awsapprunner.com"

const DEFAULT_THRESHOLDS = { minTemp: 15, maxTemp: 35, moistureThreshold: 40, maxLight: 90 }

const MOCK_PUMP: Pump = {
  id: 999,
  name: "Vườn Test (Offline)",
  mac: "AA:BB:CC:DD:EE:FF",
  sensors: [
    { id: 1, type: "Temperature", macId: "T-01", status: "Online" },
    { id: 2, type: "Moisture", macId: "M-01", status: "Online" },
    { id: 3, type: "Light", macId: "L-01", status: "Online" }
  ],
  sensorData: { temp: 28, moisture: 65, light: 75, waterVolume: 45 },
  thresholds: { ...DEFAULT_THRESHOLDS }
}

export function SmartGarden() {
  const [authState, setAuthState] = useState<AuthState>("authenticated")
  const [currentUser, setCurrentUser] = useState<any>({ id: 999, fullName: "Dev Offline", userName: "dev_test", email: "dev@smartgarden.com" })
  const [pumps, setPumps] = useState<Pump[]>([MOCK_PUMP])
  const [selectedPump, setSelectedPump] = useState<Pump | null>(MOCK_PUMP)
  /*const [authState, setAuthState] = useState<AuthState>("welcome")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [pumps, setPumps] = useState<Pump[]>([])
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null) */
  
  const [isLoadingPumps, setIsLoadingPumps] = useState(false)
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
  
  const [showModeConfirm, setShowModeConfirm] = useState(false)
  const [showPowerConfirm, setShowPowerConfirm] = useState(false)
  const [pendingPowerState, setPendingPowerState] = useState(false)
  const [analyticsSensor, setAnalyticsSensor] = useState<SensorType>("temp")
  const [toast, setToast] = useState<{ message: string; visible: boolean; type?: "success" | "error" }>({ message: "", visible: false })
  
  const [showProfile, setShowProfile] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [loginForm, setLoginForm] = useState({ username: "", password: "", rememberMe: false })
  const [registerForm, setRegisterForm] = useState({ fullName: "", email: "", username: "", password: "", confirmPassword: "" })
  const [isAddingPump, setIsAddingPump] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const hasPumps = pumps.length > 0
  const sensorData = selectedPump?.sensorData || { temp: 0, moisture: 0, light: 0, waterVolume: 0 }
  const currentThresholds = selectedPump?.thresholds || DEFAULT_THRESHOLDS
  const unreadAlerts = alerts.filter((a) => a.unread).length

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, visible: true, type })
    setTimeout(() => setToast({ message: "", visible: false }), 3000)
  }

  const fetchUserPumps = async (userId: number) => {
    setIsLoadingPumps(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/pump/user/${userId}`)
      if (response.ok) {
        const data = await response.json()
        const formattedPumps: Pump[] = data.map((p: any) => ({
          id: p.id || p.pumpId,
          name: p.name || `Pump ${p.id}`,
          mac: p.mac || "N/A",
          sensors: [],
          sensorData: { temp: 0, moisture: 0, light: 0, waterVolume: 0 },
          thresholds: { ...DEFAULT_THRESHOLDS }
        }))
        setPumps(formattedPumps)
        if (formattedPumps.length > 0) setSelectedPump(formattedPumps[0])
      }
    } catch (error) {
      showToast("Offline Mode: Backend is not reachable.", "error")
    } finally {
      setIsLoadingPumps(false)
    }
  }

  useEffect(() => {
    const fetchPumpDetails = async (pumpId: number) => {
      if (pumpId === 999) return; 
      try {
        const deviceRes = await fetch(`${API_BASE_URL}/api/device/by-pump?pumpId=${pumpId}`)
        if (deviceRes.ok) {
          const devices = await deviceRes.json()
          const sensors = devices.map((d: any) => ({
            id: d.id,
            type: d.type === "TEMPERATURE" ? "Temperature" : d.type === "MOISTURE" ? "Moisture" : "Light",
            macId: d.connectId?.toString() || "N/A",
            status: "Online"
          }))
          
          let temp = 0, moisture = 0, light = 0
          for (const d of devices) {
            try {
              const dataRes = await fetch(`${API_BASE_URL}/api/sensor/data/${d.id}`)
              if (dataRes.ok) {
                const sensorVal = await dataRes.json()
                const val = Array.isArray(sensorVal) ? sensorVal[0]?.value : sensorVal.value
                if (d.type === "TEMPERATURE") temp = val || 0
                if (d.type === "MOISTURE") moisture = val || 0
                if (d.type === "LIGHT") light = val || 0
              }
            } catch (e) {}
          }
          
          setPumps(prev => prev.map(p => p.id === pumpId ? { ...p, sensors, sensorData: { ...p.sensorData, temp, moisture, light } } : p))
          setSelectedPump(prev => prev?.id === pumpId ? { ...prev, sensors, sensorData: { ...prev.sensorData, temp, moisture, light } } : prev)
        }
      } catch (error) {}
    }
    if (selectedPump) fetchPumpDetails(selectedPump.id)
  }, [selectedPump?.id])

  const handleUpdateThresholds = (newThresholds: any) => {
    if (!selectedPump) return
    const updatedPump = { ...selectedPump, thresholds: newThresholds }
    setPumps(prev => prev.map(p => p.id === selectedPump.id ? updatedPump : p))
    setSelectedPump(updatedPump)
  }

  const handleModeSwitch = () => { if (mode === "AUTO") setShowModeConfirm(true); else setMode("AUTO") }
  const confirmModeSwitch = () => { setMode("MANUAL"); setShowModeConfirm(false); showToast("Switched to MANUAL mode successfully") }
  const handlePowerToggle = (newState: boolean) => { setPendingPowerState(newState); setShowPowerConfirm(true) }
  const confirmPowerToggle = () => { setIsPumpOn(pendingPowerState); setShowPowerConfirm(false); showToast(`Pump ${pendingPowerState ? "turned ON" : "turned OFF"} successfully`) }
  const handleSensorClick = (sensor: SensorType) => { setAnalyticsSensor(sensor); setActiveTab("analytics") }

  const handleAddPump = async () => {
    if (!newPumpName.trim() || !newPumpMac.trim()) return
    setIsAddingPump(true); setAddError(null)
    await new Promise(resolve => setTimeout(resolve, 1500))
    if (newPumpMac.trim().toLowerCase() === "fail") {
      setIsAddingPump(false); setAddError("Failed to connect to device.")
      return
    }
    const newPump: Pump = { id: Date.now(), name: newPumpName.trim(), mac: newPumpMac.trim(), sensors: [], sensorData: { temp: 0, moisture: 0, light: 0, waterVolume: 0 }, thresholds: { ...DEFAULT_THRESHOLDS } }
    setPumps((prev) => [...prev, newPump]); setSelectedPump(newPump); setShowAddPump(false); setNewPumpName(""); setNewPumpMac(""); setIsAddingPump(false)
    showToast("Device connected successfully!")
  }

  const handleAddSensor = () => {
    if (!newSensorMac.trim() || !selectedPump) return
    const sensorTypeToAdd = availableSensorTypes.includes(newSensorType) ? newSensorType : availableSensorTypes[0]
    if (!sensorTypeToAdd) return
    const macIdToAdd = newSensorMac.trim(); const sensorId = Date.now()
    
    const newSensor: Sensor = { id: sensorId, type: sensorTypeToAdd, macId: macIdToAdd, status: "Offline", connectionStatus: "connecting" }
    const updatedPump = { ...selectedPump, sensors: [...selectedPump.sensors, newSensor] }
    setPumps((prev) => prev.map((p) => (p.id === selectedPump.id ? updatedPump : p))); setSelectedPump(updatedPump)
    setShowAddSensor(false); setNewSensorMac(""); setNewSensorType("Temperature")
    
    setTimeout(() => {
      const isFailure = macIdToAdd.toLowerCase() === "fail"
      const sensorTypeKey = sensorTypeToAdd === "Temperature" ? "temp" : sensorTypeToAdd === "Moisture" ? "moisture" : "light"
      const mockValues = { temp: Math.floor(Math.random() * 15) + 20, moisture: Math.floor(Math.random() * 40) + 40, light: Math.floor(Math.random() * 50) + 30 }
      
      const updateState = (pumpsArray: Pump[]) => pumpsArray.map((p) => {
        if (p.id !== selectedPump.id) return p
        return {
          ...p,
          sensors: p.sensors.map((s) => s.id !== sensorId ? s : { ...s, status: isFailure ? "Offline" : "Online", connectionStatus: isFailure ? "failed" : "online" }),
          sensorData: isFailure ? p.sensorData : { ...p.sensorData, [sensorTypeKey]: mockValues[sensorTypeKey as keyof typeof mockValues] },
        }
      })
      setPumps(updateState); setSelectedPump(prev => prev ? updateState([prev])[0] : null)
      isFailure ? showToast("Failed to connect sensor.", "error") : showToast("Device connected successfully!")
    }, 1500)
  }

  const handleDeleteSensor = (sensor: Sensor) => {
    if (!selectedPump) return
    const sensorTypeKey = sensor.type === "Temperature" ? "temp" : sensor.type === "Moisture" ? "moisture" : "light"
    const updatedPump = { ...selectedPump, sensors: selectedPump.sensors.filter((s) => s.id !== sensor.id), sensorData: { ...selectedPump.sensorData, [sensorTypeKey]: 0 } }
    setPumps((prev) => prev.map((p) => (p.id === selectedPump.id ? updatedPump : p))); setSelectedPump(updatedPump); showToast("Sensor removed successfully")
  }

  const handleChangePassword = () => {
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm || passwordForm.new !== passwordForm.confirm) return
    setPasswordForm({ current: "", new: "", confirm: "" }); setShowChangePassword(false); showToast("Password changed successfully!")
  }

  const handleLogout = () => { 
    setAuthState("welcome"); setShowProfile(false); setPumps([]); setSelectedPump(null); setCurrentUser(null); setActiveTab("home"); localStorage.removeItem("token"); showToast("Logged out successfully!") 
  }

  const getAvailableSensorTypes = () => {
    if (!selectedPump) return ["Temperature", "Moisture", "Light"] as const
    const connectedTypes = selectedPump.sensors.map((s) => s.type)
    return (["Temperature", "Moisture", "Light"] as const).filter((type) => !connectedTypes.includes(type))
  }
  const availableSensorTypes = getAvailableSensorTypes()
  const allSensorsConnected = availableSensorTypes.length === 0

  useEffect(() => { if (showAddSensor && availableSensorTypes.length > 0) setNewSensorType(availableSensorTypes[0]) }, [showAddSensor, availableSensorTypes])

  if (authState !== "authenticated") {
    return (
      <div className="max-w-md mx-auto min-h-screen relative bg-background flex flex-col">
        {authState === "welcome" && <WelcomeScreen onLogin={() => setAuthState("login")} onRegister={() => setAuthState("register")} />}
        {authState === "login" && <LoginScreen form={loginForm} setForm={setLoginForm} onBack={() => setAuthState("welcome")} onLoginSuccess={(userData: any) => { setCurrentUser(userData); setAuthState("authenticated"); if (userData && userData.id) fetchUserPumps(userData.id) }} onSwitchToRegister={() => setAuthState("register")} />}
        {authState === "register" && <RegisterScreen form={registerForm} setForm={setRegisterForm} onBack={() => setAuthState("welcome")} onRegisterSuccess={() => { setAuthState("login"); showToast("Registration successful! Please login.") }} onSwitchToLogin={() => setAuthState("login")} />}
        <div className={cn("fixed top-6 right-6 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all duration-300 z-50", toast.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none", toast.type === "error" ? "bg-destructive text-destructive-foreground" : "bg-foreground text-card")}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4 text-primary" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto min-h-screen relative overflow-hidden bg-background flex flex-col">
      <header className="px-5 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div><p className="text-muted-foreground text-sm">Hello,</p><h1 className="text-xl font-semibold text-foreground">{currentUser?.fullName || "Farm Manager"}</h1></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAlerts(true)} className="relative p-2 rounded-full bg-card shadow-sm"><Bell className="w-5 h-5 text-foreground" />{unreadAlerts > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-xs rounded-full flex items-center justify-center font-medium text-white">{unreadAlerts}</span>}</button>
            <button onClick={() => setShowProfile(true)} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">{currentUser?.fullName?.charAt(0).toUpperCase() || "FM"}</button>
          </div>
        </div>
        
        {isLoadingPumps ? (
          <div className="w-full flex items-center justify-center p-4 bg-card rounded-2xl shadow-sm"><Loader2 className="w-5 h-5 text-primary animate-spin mr-2" /><span className="text-sm text-muted-foreground">Loading pumps...</span></div>
        ) : (
          hasPumps && selectedPump && (
            <div className="relative">
              <button onClick={() => setIsPumpDropdownOpen(!isPumpDropdownOpen)} className="w-full flex items-center justify-between p-4 bg-card rounded-2xl shadow-sm">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Droplets className="w-5 h-5 text-primary" /></div><div className="text-left"><p className="font-medium text-foreground">{selectedPump.name}</p><p className="text-xs text-muted-foreground">{selectedPump.mac}</p></div></div>
                <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", isPumpDropdownOpen && "rotate-180")} />
              </button>
              {isPumpDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-lg z-20 overflow-hidden border">
                  {pumps.map((pump) => (
                    <button key={pump.id} onClick={() => { setSelectedPump(pump); setIsPumpDropdownOpen(false) }} className={cn("w-full flex items-center gap-3 p-4 hover:bg-accent text-left", selectedPump.id === pump.id && "bg-accent")}>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Droplets className="w-5 h-5 text-primary" /></div>
                      <div><p className="font-medium text-foreground">{pump.name}</p><p className="text-xs text-muted-foreground">{pump.mac}</p></div>
                      {selectedPump.id === pump.id && <Check className="w-5 h-5 text-primary ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </header>

      <main className="flex-1 overflow-y-auto px-5 pb-24">
        {activeTab === "home" && (hasPumps && selectedPump ? <DashboardTab sensorData={sensorData} mode={mode} onModeSwitch={handleModeSwitch} isPumpOn={isPumpOn} onPowerToggle={handlePowerToggle} onSensorClick={handleSensorClick} thresholds={currentThresholds} sensors={selectedPump.sensors} onAddSensor={() => setShowAddSensor(true)} onDeleteSensor={handleDeleteSensor} allSensorsConnected={allSensorsConnected} /> : <EmptyState onAddPump={() => setShowAddPump(true)} />)}
        {activeTab === "analytics" && (hasPumps ? <AnalyticsTab timeFilter={timeFilter} setTimeFilter={setTimeFilter} waterUsageData={waterUsageData} sensorData={sensorData} selectedSensor={analyticsSensor} setSelectedSensor={setAnalyticsSensor} thresholds={currentThresholds} /> : <EmptyStateAnalytics />)}
        {activeTab === "settings" && (hasPumps ? <SettingsTab thresholds={currentThresholds} onSaveThresholds={handleUpdateThresholds} onAddPump={() => setShowAddPump(true)} /> : <EmptyStateSettings onAddPump={() => setShowAddPump(true)} />)}
      </main>

      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-foreground px-6 py-3 rounded-full shadow-lg z-40">
        {[{ id: "home" as const, icon: Home, label: "Home" }, { id: "analytics" as const, icon: BarChart3, label: "Stats" }, { id: "settings" as const, icon: Settings, label: "Config" }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full transition-all", activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted hover:text-card")}><tab.icon className="w-5 h-5" />{activeTab === tab.id && <span className="text-sm font-medium">{tab.label}</span>}</button>
        ))}
      </nav>

      <div className={cn("fixed top-6 right-6 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all duration-300 z-50", toast.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none", toast.type === "error" ? "bg-destructive text-destructive-foreground" : "bg-foreground text-card")}>
        {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4 text-primary" />}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>

      <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
        <DialogContent className="max-w-md mx-4 rounded-3xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" />Alerts</DialogTitle></DialogHeader><div className="space-y-3 max-h-80 overflow-y-auto">{alerts.map((alert) => (<div key={alert.id} className={cn("p-4 rounded-2xl border", alert.unread ? "bg-destructive/10" : "bg-muted")}><p className="text-sm">{alert.message}</p><p className="text-xs text-muted-foreground">{alert.time}</p></div>))}</div></DialogContent>
      </Dialog>

      <Dialog open={showAddPump} onOpenChange={(open) => { setShowAddPump(open); if (!open) { setAddError(null); setIsAddingPump(false) }}}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-primary" />Add New Pump</DialogTitle></DialogHeader>
          {addError && <div className="bg-destructive/10 rounded-xl p-4 flex gap-3"><AlertCircle className="w-5 h-5 text-destructive" /><p className="text-sm text-destructive">{addError}</p></div>}
          <div className="space-y-4">
            <div><label className="text-sm block">Pump Name</label><Input placeholder="e.g., Rose Garden Pump" value={newPumpName} onChange={(e) => setNewPumpName(e.target.value)} disabled={isAddingPump} /></div>
            <div><label className="text-sm block">Device MAC ID</label><Input placeholder="e.g., AA:BB:CC:DD:EE:FF" value={newPumpMac} onChange={(e) => setNewPumpMac(e.target.value)} disabled={isAddingPump} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddPump(false)} disabled={isAddingPump}>Cancel</Button><Button onClick={handleAddPump} disabled={!newPumpName.trim() || !newPumpMac.trim() || isAddingPump}>{isAddingPump ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</> : "Add Pump"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddSensor} onOpenChange={(open) => { setShowAddSensor(open); if (!open) { setNewSensorMac(""); setNewSensorType(availableSensorTypes[0] || "Temperature") }}}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-primary" />Add New Sensor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm block">Sensor Type</label>{availableSensorTypes.length > 0 ? (<Select value={availableSensorTypes.includes(newSensorType) ? newSensorType : availableSensorTypes[0]} onValueChange={(value: any) => setNewSensorType(value)}><SelectTrigger><SelectValue placeholder="Select sensor type" /></SelectTrigger><SelectContent>{availableSensorTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent></Select>) : (<div className="h-10 px-3 py-2 rounded-xl bg-muted text-sm flex items-center">All sensor types connected</div>)}</div>
            <div><label className="text-sm block">Device MAC ID</label><Input placeholder="e.g., AA:BB:CC:DD:EE:FF" value={newSensorMac} onChange={(e) => setNewSensorMac(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddSensor(false)}>Cancel</Button><Button onClick={handleAddSensor} disabled={!newSensorMac.trim()}>Add Device</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" />Profile</DialogTitle></DialogHeader>
          {!showChangePassword ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4"><div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl mb-3">{currentUser?.fullName?.charAt(0).toUpperCase() || "FM"}</div><h3 className="text-lg font-semibold">{currentUser?.fullName || "Farm Manager"}</h3><p className="text-sm text-muted-foreground">@{currentUser?.userName || "admin_farm"}</p></div>
              <div className="space-y-3">
                <div className="flex justify-between p-4 bg-muted rounded-xl"><span className="text-sm text-muted-foreground">Full Name</span><span className="text-sm font-medium">{currentUser?.fullName || "Farm Manager"}</span></div>
                <div className="flex justify-between p-4 bg-muted rounded-xl"><span className="text-sm text-muted-foreground">Username</span><span className="text-sm font-medium">{currentUser?.userName || "admin_farm"}</span></div>
                <div className="flex justify-between p-4 bg-muted rounded-xl"><span className="text-sm text-muted-foreground">Email</span><span className="text-sm font-medium">{currentUser?.email || "manager@smartgarden.com"}</span></div>
              </div>
              <div className="space-y-3 pt-2">
                <Button variant="outline" onClick={() => setShowChangePassword(true)} className="w-full py-5 justify-start gap-3"><Lock className="w-4 h-4" />Change Password</Button>
                <Button variant="outline" onClick={handleLogout} className="w-full py-5 justify-start gap-3 border-destructive text-destructive"><LogOut className="w-4 h-4" />Logout</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button onClick={() => setShowChangePassword(false)} className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="w-4 h-4" />Back to Profile</button>
              <div className="space-y-4">
                <div><label className="text-sm block">Current Password</label><div className="relative"><Input type={showCurrentPassword ? "text" : "password"} value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} className="pr-10" />{passwordForm.current.length > 0 && <button onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">{showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}</div></div>
                <div><label className="text-sm block">New Password</label><div className="relative"><Input type={showNewPassword ? "text" : "password"} value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} className="pr-10" />{passwordForm.new.length > 0 && <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">{showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}</div></div>
                <div><label className="text-sm block">Confirm New Password</label><div className="relative"><Input type={showConfirmPassword ? "text" : "password"} value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} className="pr-10" />{passwordForm.confirm.length > 0 && <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">{showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}</div></div>
              </div>
              <Button onClick={handleChangePassword} disabled={!passwordForm.current || !passwordForm.new || !passwordForm.confirm || passwordForm.new !== passwordForm.confirm} className="w-full py-5">Save Password</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showModeConfirm} onOpenChange={setShowModeConfirm}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" />Confirm Mode Switch</DialogTitle></DialogHeader>
          <div className="text-sm text-muted-foreground">Are you sure? This action will override the automated controls.</div>
          <DialogFooter><Button variant="outline" onClick={() => setShowModeConfirm(false)}>Cancel</Button><Button onClick={confirmModeSwitch}>Confirm</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPowerConfirm} onOpenChange={setShowPowerConfirm}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Power className="w-5 h-5 text-primary" />Confirm Pump Action</DialogTitle></DialogHeader>
          <div className="text-sm text-muted-foreground">Confirm action to toggle the water pump?</div>
          <DialogFooter><Button variant="outline" onClick={() => setShowPowerConfirm(false)}>Cancel</Button><Button onClick={confirmPowerToggle}>Confirm</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}