"use client"

import React, { useState, useEffect } from "react"
import { Bell, Home, BarChart3, Settings, Droplets, ChevronDown, Check, Plus, AlertCircle, AlertTriangle, Loader2, User, LogOut, ArrowLeft, Power, Edit2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { AuthState, SensorType, Sensor, Pump } from "@/types/smart-garden"
import { api } from "@/lib/api"

import { WelcomeScreen, LoginScreen, RegisterScreen } from "./auth-screens"
import { DashboardTab, EmptyState } from "./dashboard-tab"
import { AnalyticsTab, EmptyStateAnalytics } from "./analytics-tab"
import { SettingsTab, EmptyStateSettings } from "./settings-tab"

import { ref, onValue, off } from "firebase/database"
import { rtdb } from "@/lib/firebase"
import { getDeviceId, requestPushNotificationPermission } from "@/lib/notification";
import { setupForegroundMessageListener } from "@/lib/notification";

const DEFAULT_THRESHOLDS = { minTemp: 15, maxTemp: 35, moistureThreshold: 40, maxLight: 90, area: 1, fieldCapacity: 1, rootDepth: 1 }

export function SmartGarden() {
  const [userConnectionId, setUserConnectionId] = useState<number | null>(null)
  const [authState, setAuthState] = useState<AuthState>("welcome")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [pumps, setPumps] = useState<Pump[]>([])
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null)
  
  const [alertsList, setAlertsList] = useState<any[]>([])
  const [pumpLogs, setPumpLogs] = useState<any[]>([]) 
  
  const [isLoadingPumps, setIsLoadingPumps] = useState(false)
  const [activeTab, setActiveTab] = useState<"home" | "analytics" | "settings">("home")
  const [isPumpDropdownOpen, setIsPumpDropdownOpen] = useState(false)
  const [pendingMode, setPendingMode] = useState<"AUTO" | "MANUAL">("AUTO");
  const [mode, setMode] = useState<"AUTO" | "MANUAL">("MANUAL")
  const [isPumpOn, setIsPumpOn] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [showAddPump, setShowAddPump] = useState(false)
  const [showAddSensor, setShowAddSensor] = useState(false)
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
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ fullName: "", username: "", email: "" })
  
  const [loginForm, setLoginForm] = useState({ username: "", password: "", rememberMe: false })
  const [registerForm, setRegisterForm] = useState({ fullName: "", email: "", username: "", password: "", confirmPassword: "" })
  const [isAddingPump, setIsAddingPump] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const hasPumps = pumps.length > 0
  const sensorData = selectedPump?.sensorData || { temp: 0, moisture: 0, light: 0, waterVolume: 0 }
  const currentThresholds = selectedPump?.thresholds || DEFAULT_THRESHOLDS
  const unreadAlerts = alertsList.filter((a) => a.unread).length

  const [pumpForm, setPumpForm] = useState({
    name: "",
    temperatureMax: 35.0,     
    temperatureMin: 15.0,     
    lightIntensityMax: 1000.0, 
    moistureThreshold: 60.0,  
    fieldCapacity: 30.0,      
    rootDepth: 20.0,          
    area: 50.0                
  });

  const handleLogout = () => { 
    setAuthState("welcome"); setShowProfile(false); setPumps([]); setSelectedPump(null); setCurrentUser(null); setActiveTab("home"); localStorage.removeItem("token"); showToast("Logged out successfully!") 
  }

  const handleLoginSuccess = async (userData: any) => {
    const validUserId = userData.userId || userData.id;
    
    if (validUserId) {
      try {
        const userRes = await api.get(`/api/user/${validUserId}`);
        setCurrentUser(userRes.data);

        try {
          const connRes = await api.get(`/api/connection/${validUserId}`);
          if (connRes.data && connRes.data.connectionId) {
            setUserConnectionId(connRes.data.connectionId);
          }
        } catch (connError) {
          showToast("Warning: Could not fetch connection info", "error");
        }
        const fcmToken = await requestPushNotificationPermission();
        console.log("FCM Token:", fcmToken);
        const deviceId = getDeviceId();

        if (fcmToken && deviceId) {
          try {
            await api.post('/api/notification/register-device', {
              userId: validUserId,
              phoneId: deviceId, 
              token: fcmToken    
            });
            console.log("Device successfully registered for push notifications!");
          } catch (err) {
            console.warn("Notification API not ready or network error:", err);
          }
        }

      } catch (e) {
        setCurrentUser({ id: validUserId, fullName: "User", userName: "user" });
      }
      
      setAuthState("authenticated");
      fetchUserPumps(validUserId);
    } else {
      setAuthState("authenticated");
    }
  };

  const handleCreatePump = async () => {
    if (!pumpForm.name.trim()) {
      showToast("Please enter a pump name!", "error");
      return;
    }
    setIsAddingPump(true);
    setAddError(null);

    try {
      const uniqueFeed = `SmartGarden/Pump_${Date.now()}`; 
      
      const connPayload = {
        userId: currentUser.id || currentUser.userId,
        brokerName: "system",
        feed: uniqueFeed,
        password: "DADN-hk2-2026", 
        address: "ssl://205dd780c5cd4cd6af5c18efd1914a37.s1.eu.hivemq.cloud:8883"
      };
      
      const connRes = await api.post('/api/connection', connPayload);
      const newConnectionId = connRes.data.connectionId; 

      if (!newConnectionId) {
         showToast("Error: Could not retrieve Connection ID from server.", "error");
         return;
      }

      const pumpPayload = {
         name: pumpForm.name,
         connectionId: newConnectionId, 
         userId: currentUser.id || currentUser.userId,
         temperatureMax: pumpForm.temperatureMax,
         temperatureMin: pumpForm.temperatureMin,
         lightIntensityMax: pumpForm.lightIntensityMax,
         moistureThreshold: pumpForm.moistureThreshold,
         fieldCapacity: pumpForm.fieldCapacity,
         rootDepth: pumpForm.rootDepth,
         area: pumpForm.area
      };

      await api.post('/api/pump', pumpPayload);
      showToast("Pump added successfully!", "success");

      setPumpForm({
        name: "", temperatureMax: 35.0, temperatureMin: 15.0, 
        lightIntensityMax: 1000.0, moistureThreshold: 60.0, 
        fieldCapacity: 30.0, rootDepth: 20.0, area: 50.0
      })
      setShowAddPump(false);
      fetchUserPumps(currentUser.id || currentUser.userId);
    } catch (error) {
      setAddError("Failed to add pump. Please try again!");
    } finally {
      setIsAddingPump(false);
    }
  };

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, visible: true, type })
    setTimeout(() => setToast({ message: "", visible: false }), 3000)
  }

  const fetchUserPumps = async (userId: number) => {
    setIsLoadingPumps(true)
    try {
      const response = await api.get(`/api/pump/user/${userId}`)
      const formattedPumps: Pump[] = response.data.map((p: any) => ({
        id: p.id || p.pumpId,
        name: p.name || `Pump ${p.id}`,
        mac: `Connection ID: ${p.connectionId || "N/A"}`,
        connectionId: p.connectionId,
        userId: p.userId,
        sensors: [],
        sensorData: { temp: 0, moisture: 0, light: 0, waterVolume: 0 },
        thresholds: { 
          minTemp: p.temperatureMin || 15, 
          maxTemp: p.temperatureMax || 35, 
          moistureThreshold: p.moistureThreshold || 40, 
          maxLight: p.lightIntensityMax || 90,
          area: p.area || 1,
          fieldCapacity: p.fieldCapacity || 1,
          rootDepth: p.rootDepth || 1
        }
      }))
      setPumps(formattedPumps)
      if (formattedPumps.length > 0) setSelectedPump(formattedPumps[0])
    } catch (error) {
      showToast("Failed to load pump data", "error")
    } finally {
      setIsLoadingPumps(false)
    }
  }

  const fetchUserAlerts = async (userId: number) => {
     try {
       const res = await api.get(`/api/alert/user/${userId}`)
       if (res.data) {
         const formattedAlerts = res.data.map((a: any) => ({
           id: a.id || a.alertId, message: a.message || "Alert received",
           time: new Date(a.createdAt || a.created_at).toLocaleString(), unread: !a.isRead
         }))
         formattedAlerts.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
         setAlertsList(formattedAlerts)
       }
     } catch (e) {}
  }

  useEffect(() => {
    setupForegroundMessageListener();
  }, []);

  useEffect(() => {
    const fetchPumpDetails = async (pumpId: number) => {
      setPumpLogs([]);
      try {
        const deviceRes = await api.get(`/api/device/by-pump?pumpId=${pumpId}`);
        const devices = deviceRes.data;
        
        const sensors: any[] = devices.map((d: any) => ({
          id: d.id,
          type: d.type === "TEMPERATURE" ? "Temperature" : d.type === "MOISTURE" ? "Moisture" : "Light",
          macId: `ID: ${d.connectId}`, 
          connectId: d.connectId, 
          status: "Online", 
          historyData: []
        }));
        
        let temp = 0, moisture = 0, light = 0;

        for (let i = 0; i < sensors.length; i++) {
          try {
            const dataRes = await api.get(`/api/sensor/data/${sensors[i].id}`);
            if (dataRes.data && dataRes.data.length > 0) {
              sensors[i].historyData = dataRes.data; 
              const latestVal = dataRes.data[dataRes.data.length - 1].value; 
              if (sensors[i].type === "Temperature") temp = latestVal;
              if (sensors[i].type === "Moisture") moisture = latestVal;
              if (sensors[i].type === "Light") light = latestVal;
            }
          } catch (e) { 
            sensors[i].status = "Offline";
          }
        }

        const waterVirtualSensor: any = {
          id: "water_volume_id", type: "waterVolume", macId: "Pump Log", connectId: pumpId, status: "Online", historyData: []
        };
        
        try {
          let logRes = await api.get(`/api/pumpLog/pump/${pumpId}`).catch(() => api.get(`/api/pump-log/pump/${pumpId}`));
          if (logRes && logRes.data) {
             waterVirtualSensor.historyData = logRes.data;
             setPumpLogs(logRes.data);
          } else {
          setPumpLogs([]);
        } 
      }catch (e) {
           console.log("Cannot retrieve Pump Log data");
            setPumpLogs([]); 
        }
        
        sensors.push(waterVirtualSensor);

        setPumps(prev => prev.map(p => p.id === pumpId ? { ...p, sensors, sensorData: { ...p.sensorData, temp, moisture, light } } : p));
        setSelectedPump(prev => prev?.id === pumpId ? { ...prev, sensors, sensorData: { ...prev.sensorData, temp, moisture, light } } : prev);
      } catch (error) {
        console.error("Lỗi lấy chi tiết máy bơm:", error);
      }
    };

    if (selectedPump && currentUser) {
      const userId = currentUser.id || currentUser.userId;
      fetchPumpDetails(selectedPump.id);
      fetchUserAlerts(userId); 

      const dbRef = ref(rtdb, `updates/${userId}`);
      
      onValue(dbRef, (snapshot) => {
        const newData = snapshot.val();
        if (newData && newData.type) {

          setPumps(prevPumps => prevPumps.map(pump => {
            if (pump.id !== selectedPump.id) return pump;

            let newTemp = pump.sensorData.temp;
            let newMoisture = pump.sensorData.moisture;
            let newLight = pump.sensorData.light;

            if (newData.type === "TEMPERATURE") newTemp = newData.value;
            if (newData.type === "MOISTURE") newMoisture = newData.value;
            if (newData.type === "LIGHT") newLight = newData.value;

            const updatedSensors = pump.sensors.map(sensor => {
              if (sensor.type.toUpperCase() === newData.type) {
                return { ...sensor, status: "Online" as const, historyData: [...(sensor.historyData || []), newData] };
              }
              return sensor;
            });

            return {
              ...pump,
              sensorData: { ...pump.sensorData, temp: newTemp, moisture: newMoisture, light: newLight },
              sensors: updatedSensors
            };
          }));

          setSelectedPump(prev => {
            if (!prev) return prev;
            let newTemp = prev.sensorData.temp;
            let newMoisture = prev.sensorData.moisture;
            let newLight = prev.sensorData.light;

            if (newData.type === "TEMPERATURE") newTemp = newData.value;
            if (newData.type === "MOISTURE") newMoisture = newData.value;
            if (newData.type === "LIGHT") newLight = newData.value;

            const updatedSensors = prev.sensors.map(sensor => {
              if (sensor.type.toUpperCase() === newData.type) {
                return { ...sensor, status: "Online" as const, historyData: [...(sensor.historyData || []), newData] };
              }
              return sensor;
            });

            return {
              ...prev,
              sensorData: { ...prev.sensorData, temp: newTemp, moisture: newMoisture, light: newLight },
              sensors: updatedSensors
            };
          });
        }
      });
      return () => {
        off(dbRef);
      };
    }
  }, [selectedPump?.id, currentUser]);

  const handleUpdateThresholds = async (newThresholds: any) => {
    if (!selectedPump || !currentUser) return
    try {
      await api.put('/api/pump', {
        id: selectedPump.id, name: selectedPump.name, connectionId: selectedPump.connectionId, userId: currentUser.id || currentUser.userId,
        temperatureMax: newThresholds.maxTemp, temperatureMin: newThresholds.minTemp, lightIntensityMax: newThresholds.maxLight, moistureThreshold: newThresholds.moistureThreshold,
        fieldCapacity: newThresholds.fieldCapacity, rootDepth: newThresholds.rootDepth, area: newThresholds.area 
      });
      const updatedPump = { ...selectedPump, thresholds: newThresholds }
      setPumps(prev => prev.map(p => p.id === selectedPump.id ? updatedPump : p))
      setSelectedPump(updatedPump)
      showToast("Configuration updated successfully!")
    } catch (error) { showToast("Failed to save configuration", "error") }
  }

  const handleModeSwitch = () => { if (mode === "AUTO") setShowModeConfirm(true); else switchMode("AUTO") }
  const switchMode = async (newMode: "AUTO" | "MANUAL") => { 
    setShowModeConfirm(false); 

    const logId = Date.now();
    const pendingLog = {
      id: logId, 
      action: newMode === "AUTO" ? "Switched to AUTO" : "Switched to MANUAL",
      mode: newMode,
      status: 'Pending', 
      timestamp: new Date().toISOString()
    };
    
    setPumpLogs(prev => [pendingLog, ...prev]);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      setMode(newMode); 
      showToast(`Successfully switched to ${newMode} mode`, "success");
      
      setPumpLogs(prev => prev.map(log => 
        log.id === logId ? { ...log, status: 'Success' } : log
      ));

    } catch (error) {
      showToast(`Failed to switch to ${newMode} mode`, "error");
      setPumpLogs(prev => prev.map(log => 
        log.id === logId ? { ...log, status: 'Failed' } : log
      ));
    }
  }

  const handlePowerToggle = (newState: boolean) => { setPendingPowerState(newState); setShowPowerConfirm(true) }
  const confirmPowerToggle = async () => {
    if (!selectedPump) return;
    setShowPowerConfirm(false); 
    const logId = Date.now();
    const pendingLog = {
      id: logId,
      action: pendingPowerState ? "Pump turned ON" : "Pump turned OFF",
      mode: 'MANUAL', 
      status: 'Pending',
      timestamp: new Date().toISOString()
    };
    
    setPumpLogs(prev => [pendingLog, ...prev]);

    try {
      await api.post(`/api/pump/manual?pumpId=${selectedPump.id}&onCommand=${pendingPowerState}`)
      setIsPumpOn(pendingPowerState); 
      showToast(`Successfully turned ${pendingPowerState ? "ON" : "OFF"} the pump`, "success");

      setPumpLogs(prev => prev.map(log => 
        log.id === logId ? { ...log, status: 'Success' } : log
      ));

    } catch (error) { 
      showToast(`Failed to turn ${pendingPowerState ? "ON" : "OFF"} the pump`, "error"); 
      setPumpLogs(prev => prev.map(log => 
        log.id === logId ? { ...log, status: 'Failed' } : log
      ));
    }
  }

  const handleAddPump = async () => {
    if (!newPumpName.trim()) return;
    if (!userConnectionId) {
      showToast("System error: Connection ID not found", "error");
      return;
    }
    
    setIsAddingPump(true); setAddError(null)
    try {
      await api.post('/api/pump', {
        name: newPumpName.trim(), 
        connectionId: userConnectionId, 
        userId: currentUser.id || currentUser.userId,
        temperatureMax: 35, temperatureMin: 15, lightIntensityMax: 90, moistureThreshold: 40, fieldCapacity: 1, rootDepth: 1, area: 1 
      })
      fetchUserPumps(currentUser.id || currentUser.userId);
      setShowAddPump(false); 
      setNewPumpName(""); 
      showToast("Pump added successfully!")
    } catch (error: any) { 
      setAddError("Backend connection error. Please try again.") 
    } finally { 
      setIsAddingPump(false) 
    }
  }

  const handleDeletePump = async () => {
    if (!selectedPump) return;
    try {
      await api.delete(`/api/pump/${selectedPump.id}`);
      const remainingPumps = pumps.filter(p => p.id !== selectedPump.id);
      setPumps(remainingPumps);
      if (remainingPumps.length > 0) setSelectedPump(remainingPumps[0]); else setSelectedPump(null);
      showToast("Pump deleted successfully"); setActiveTab("home"); 
    } catch (error) { showToast("Failed to delete pump", "error"); }
  }

  const handleAddSensor = async () => {
    if (!selectedPump) return;
    const currentConnectionId = selectedPump.connectionId;

    if (!currentConnectionId) {
      showToast("System error: Connection ID not found for this pump", "error");
      return;
    }

    const sensorTypeToAdd = availableSensorTypes.includes(newSensorType) ? newSensorType : availableSensorTypes[0];
    if (!sensorTypeToAdd) return;

    const tempId = Date.now();
    const pendingSensor: Sensor = {
      id: tempId,
      type: sensorTypeToAdd as any,
      macId: `System Connection`,
      connectId: currentConnectionId, 
      status: "Offline",
      connectionStatus: "connecting"
    };

    const updatedSensors = [...selectedPump.sensors, pendingSensor];
    setSelectedPump({ ...selectedPump, sensors: updatedSensors });
    setPumps(prev => prev.map(p => p.id === selectedPump.id ? { ...p, sensors: updatedSensors } : p));
    setShowAddSensor(false);

    try {
      const response = await api.post('/api/device', {
        name: `${sensorTypeToAdd} Sensor`, 
        type: sensorTypeToAdd.toUpperCase(), 
        connectId: currentConnectionId, 
        pumpId: selectedPump.id
      });
      
      const realId = response?.data?.id || response?.data?.deviceId || tempId;
      const finalizedSensors = updatedSensors.map(s => 
        s.id === tempId ? { ...s, id: realId, connectionStatus: undefined, status: "Online" as const } : s
      );
      
      setSelectedPump({ ...selectedPump, sensors: finalizedSensors });
      setPumps(prev => prev.map(p => p.id === selectedPump.id ? { ...p, sensors: finalizedSensors } : p));
      
      showToast("Sensor added successfully!");
    } catch (error) {
      showToast("Failed to add sensor", "error");
      const rolledBack = updatedSensors.filter(s => s.id !== tempId);
      setSelectedPump({ ...selectedPump, sensors: rolledBack });
      setPumps(prev => prev.map(p => p.id === selectedPump.id ? { ...p, sensors: rolledBack } : p));
    }
  };

  const handleDeleteSensor = async (sensor: Sensor) => {
    if (!selectedPump) return;

    const pendingSensors = selectedPump.sensors.map((s): Sensor => 
      s.id === sensor.id ? { ...s, connectionStatus: "connecting" } : s
    );
    setSelectedPump({ ...selectedPump, sensors: pendingSensors });
    setPumps(prev => prev.map(p => p.id === selectedPump.id ? { ...p, sensors: pendingSensors } : p));

    try {
      await api.delete(`/api/device/${sensor.id}`);
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast("Sensor deleted successfully");
      const filtered = selectedPump.sensors.filter(s => s.id !== sensor.id);
      setSelectedPump({ ...selectedPump, sensors: filtered });
      setPumps(prev => prev.map(p => p.id === selectedPump.id ? { ...p, sensors: filtered } : p));
    } catch (error) {
      showToast("Failed to delete sensor", "error");
      const rolledBack = selectedPump.sensors.map((s): Sensor => 
        s.id === sensor.id ? { ...s, connectionStatus: undefined } : s
      );
      setSelectedPump({ ...selectedPump, sensors: rolledBack });
      setPumps(prev => prev.map(p => p.id === selectedPump.id ? { ...p, sensors: rolledBack } : p));
    }
  };

  const handleEditProfileClick = () => {
    setProfileForm({ fullName: currentUser?.fullName || "", username: currentUser?.username || currentUser?.userName || "", email: currentUser?.email || "" });
    setIsEditingProfile(true);
  }

  const handleSaveProfile = async () => {
    if (!profileForm.fullName.trim() || !profileForm.username.trim() || !profileForm.email.trim()) { showToast("All fields are required", "error"); return; }
    setIsSavingProfile(true);
    try {
      const userId = currentUser.id || currentUser.userId;
      const response = await api.put(`/api/user/${userId}`, { fullName: profileForm.fullName.trim(), userName: profileForm.username.trim(), email: profileForm.email.trim() });
      setCurrentUser(response.data); setIsEditingProfile(false); showToast("Profile updated successfully!");
    } catch (error) { showToast("Failed to update profile", "error"); } 
    finally { setIsSavingProfile(false); }
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
        {authState === "login" && <LoginScreen 
  form={loginForm} 
  setForm={setLoginForm} 
  onBack={() => setAuthState("welcome")} 
  onLoginSuccess={handleLoginSuccess} 
  onSwitchToRegister={() => setAuthState("register")} 
/>}
        {authState === "register" && <RegisterScreen form={registerForm} setForm={setRegisterForm} onBack={() => setAuthState("welcome")} onRegisterSuccess={() => { setAuthState("login"); showToast("Registration successful! Please login.") }} onSwitchToLogin={() => setAuthState("login")} />}
        
        <div className={cn("fixed top-6 right-6 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all duration-300 z-[9999]", toast.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none", toast.type === "error" ? "bg-destructive text-destructive-foreground" : "bg-foreground text-card")}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4 text-primary" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto min-h-screen relative overflow-hidden bg-background flex flex-col">
      {/* header + topbar */}
      <header className="px-5 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div><p className="text-muted-foreground text-sm">Hello,</p><h1 className="text-xl font-semibold text-foreground">{currentUser?.fullName || "Farm Manager"}</h1></div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAlerts(true)} className="relative p-2 rounded-full bg-card shadow-sm"><Bell className="w-5 h-5 text-foreground" />{unreadAlerts > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-xs rounded-full flex items-center justify-center font-medium text-white">{unreadAlerts}</span>}</button>
            <button onClick={() => { setShowProfile(true); setIsEditingProfile(false); }} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">{currentUser?.fullName?.charAt(0).toUpperCase() || "FM"}</button>
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

      {/* view */}
      <main className="flex-1 overflow-y-auto px-5 pb-24">
        {activeTab === "home" && (hasPumps && selectedPump ? <DashboardTab sensorData={sensorData} mode={mode} onModeSwitch={(targetMode: "AUTO" | "MANUAL") => { setPendingMode(targetMode); setShowModeConfirm(true); }} isPumpOn={isPumpOn} onPowerToggle={(s) => {setPendingPowerState(s); setShowPowerConfirm(true)}} onSensorClick={(s) => {setAnalyticsSensor(s); setActiveTab("analytics")}} thresholds={currentThresholds} sensors={selectedPump.sensors} onAddSensor={() => setShowAddSensor(true)} onDeleteSensor={handleDeleteSensor} allSensorsConnected={allSensorsConnected} pumpLogs={pumpLogs} /> : <EmptyState onAddPump={() => setShowAddPump(true)} />)}   
        {activeTab === "analytics" && (hasPumps ? <AnalyticsTab sensors={selectedPump?.sensors || []} selectedSensor={analyticsSensor} setSelectedSensor={setAnalyticsSensor} thresholds={currentThresholds} /> : <EmptyStateAnalytics />)}    
        {activeTab === "settings" && (hasPumps ? <SettingsTab thresholds={currentThresholds} onSaveThresholds={handleUpdateThresholds} onAddPump={() => setShowAddPump(true)} onDeletePump={handleDeletePump} /> : <EmptyStateSettings onAddPump={() => setShowAddPump(true)} />)}
      </main>
      
      {/* nav bar */}
      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-foreground px-6 py-3 rounded-full shadow-lg z-40">
        {[{ id: "home" as const, icon: Home, label: "Home" }, { id: "analytics" as const, icon: BarChart3, label: "Stats" }, { id: "settings" as const, icon: Settings, label: "Config" }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full transition-all", activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted hover:text-card")}><tab.icon className="w-5 h-5" />{activeTab === tab.id && <span className="text-sm font-medium">{tab.label}</span>}</button>
        ))}
      </nav>

      {/* dialog */}
      <div className={cn("fixed top-6 right-6 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-all duration-300 z-[9999]", toast.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none", toast.type === "error" ? "bg-destructive text-destructive-foreground" : "bg-foreground text-card")}>
        {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4 text-primary" />}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>

      <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
        <DialogContent className="max-w-md mx-4 rounded-3xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" />Alerts</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {alertsList.length > 0 ? alertsList.map((alert) => (
              <div key={alert.id} className={cn("p-4 rounded-2xl border", alert.unread ? "bg-destructive/10" : "bg-muted")}><p className="text-sm">{alert.message}</p><p className="text-xs text-muted-foreground">{alert.time}</p></div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">No recent alerts.</p>}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddPump} onOpenChange={(open) => { 
  setShowAddPump(open); 
  if (!open) { 
    setAddError(null); 
    setIsAddingPump(false);
    // Tùy chọn: Reset form khi đóng modal
    setPumpForm({
      name: "", temperatureMax: 35.0, temperatureMin: 15.0, 
      lightIntensityMax: 1000.0, moistureThreshold: 60.0, 
      fieldCapacity: 30.0, rootDepth: 20.0, area: 50.0
    });
  }
}}>
  <DialogContent className="max-w-md mx-4 rounded-3xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Plus className="w-5 h-5 text-primary" />Add New Pump
      </DialogTitle>
    </DialogHeader>
    
    {addError && (
      <div className="bg-destructive/10 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-destructive" />
        <p className="text-sm text-destructive">{addError}</p>
      </div>
    )}
    
    <div className="space-y-4">
      {/* Ô nhập tên máy bơm (Chiếm toàn bộ chiều rộng) */}
      <div>
        <label className="text-sm font-medium block mb-2">Pump Name</label>
        <Input 
          placeholder="e.g., Rose Garden" 
          value={pumpForm.name} 
          onChange={(e) => setPumpForm({ ...pumpForm, name: e.target.value })} 
          disabled={isAddingPump} 
          className="rounded-xl" 
        />
      </div>

      {/* Khu vực cấu hình 7 thông số (Chia làm 2 cột cho gọn) */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border/50">
        <div className="col-span-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Environment Settings (Default)
          </p>
        </div>
        
        <div>
          <label className="text-xs block mb-1">Max Temp (°C)</label>
          <Input type="number" value={pumpForm.temperatureMax} onChange={(e) => setPumpForm({ ...pumpForm, temperatureMax: parseFloat(e.target.value) || 0 })} disabled={isAddingPump} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs block mb-1">Min Temp (°C)</label>
          <Input type="number" value={pumpForm.temperatureMin} onChange={(e) => setPumpForm({ ...pumpForm, temperatureMin: parseFloat(e.target.value) || 0 })} disabled={isAddingPump} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs block mb-1">Max Light (Lux)</label>
          <Input type="number" value={pumpForm.lightIntensityMax} onChange={(e) => setPumpForm({ ...pumpForm, lightIntensityMax: parseFloat(e.target.value) || 0 })} disabled={isAddingPump} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs block mb-1">Moisture Threshold (%)</label>
          <Input type="number" value={pumpForm.moistureThreshold} onChange={(e) => setPumpForm({ ...pumpForm, moistureThreshold: parseFloat(e.target.value) || 0 })} disabled={isAddingPump} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs block mb-1">Field Capacity</label>
          <Input type="number" value={pumpForm.fieldCapacity} onChange={(e) => setPumpForm({ ...pumpForm, fieldCapacity: parseFloat(e.target.value) || 0 })} disabled={isAddingPump} className="h-8 text-sm" />
        </div>
        <div>
          <label className="text-xs block mb-1">Root Depth (cm)</label>
          <Input type="number" value={pumpForm.rootDepth} onChange={(e) => setPumpForm({ ...pumpForm, rootDepth: parseFloat(e.target.value) || 0 })} disabled={isAddingPump} className="h-8 text-sm" />
        </div>
        <div className="col-span-2">
          <label className="text-xs block mb-1">Area (m²)</label>
          <Input type="number" value={pumpForm.area} onChange={(e) => setPumpForm({ ...pumpForm, area: parseFloat(e.target.value) || 0 })} disabled={isAddingPump} className="h-8 text-sm" />
        </div>
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowAddPump(false)} disabled={isAddingPump}>
        Cancel
      </Button>
      <Button onClick={handleCreatePump} disabled={!pumpForm.name.trim() || isAddingPump}>
        {isAddingPump ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : "Add"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      <Dialog open={showAddSensor} onOpenChange={(open) => { setShowAddSensor(open); if (!open) { setNewSensorType(availableSensorTypes[0] || "Temperature") }}}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-primary" />Add New Sensor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm block mb-2">Sensor Type</label>
              {availableSensorTypes.length > 0 ? (
                <Select value={availableSensorTypes.includes(newSensorType) ? newSensorType : availableSensorTypes[0]} onValueChange={(value: any) => setNewSensorType(value)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{availableSensorTypes.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
                </Select>
              ) : (<div className="h-10 px-3 py-2 rounded-xl bg-muted text-sm flex items-center">All sensor types connected</div>)}
            </div>
            {}
          </div>
          <DialogFooter>
  <Button variant="outline" onClick={() => setShowAddSensor(false)}>Cancel</Button>
  
  {}
  <Button 
    onClick={handleAddSensor} 
    disabled={!selectedPump?.connectionId || availableSensorTypes.length === 0}
  >
    Add
  </Button>
</DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><User className="w-5 h-5 text-primary" />Profile</DialogTitle></DialogHeader>
          {!isEditingProfile ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-4"><div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl mb-3">{currentUser?.fullName?.charAt(0).toUpperCase() || "FM"}</div><h3 className="text-lg font-semibold">{currentUser?.fullName || "Farm Manager"}</h3><p className="text-sm text-muted-foreground">@{currentUser?.username || currentUser?.userName || "user"}</p></div>
              <div className="space-y-3">
                <div className="flex justify-between p-4 bg-muted rounded-xl"><span className="text-sm text-muted-foreground">Full Name</span><span className="text-sm font-medium">{currentUser?.fullName || "Farm Manager"}</span></div>
                <div className="flex justify-between p-4 bg-muted rounded-xl"><span className="text-sm text-muted-foreground">Username</span><span className="text-sm font-medium">{currentUser?.username || currentUser?.userName || "user"}</span></div>
                <div className="flex justify-between p-4 bg-muted rounded-xl"><span className="text-sm text-muted-foreground">Email</span><span className="text-sm font-medium">{currentUser?.email || "Email"}</span></div>
              </div>
              <div className="space-y-3 pt-2">
                <Button variant="outline" onClick={handleEditProfileClick} className="w-full py-5 justify-start gap-3"><Edit2 className="w-4 h-4" />Edit Profile</Button>
                <Button variant="outline" onClick={handleLogout} className="w-full py-5 justify-start gap-3 border-destructive text-destructive"><LogOut className="w-4 h-4" />Logout</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button onClick={() => setIsEditingProfile(false)} className="flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="w-4 h-4" />Back</button>
              <div className="space-y-4">
                <div><label className="text-sm block mb-2">Full Name</label><Input type="text" value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} disabled={isSavingProfile} className="rounded-xl" /></div>
                <div><label className="text-sm block mb-2">Username</label><Input type="text" value={profileForm.username} onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })} disabled={isSavingProfile} className="rounded-xl" /></div>
                <div><label className="text-sm block mb-2">Email Address</label><Input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} disabled={isSavingProfile} className="rounded-xl" /></div>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full py-5 rounded-xl">
                {isSavingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showModeConfirm} onOpenChange={setShowModeConfirm}>
        <DialogContent className="max-w-md mx-4 rounded-3xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-primary" />Confirm Mode Switch</DialogTitle></DialogHeader>
          <div className="text-sm text-muted-foreground">Are you sure you want to switch to {pendingMode} mode?</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModeConfirm(false)}>Cancel</Button>
            <Button onClick={() => switchMode(pendingMode)}>Confirm</Button>
          </DialogFooter>
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