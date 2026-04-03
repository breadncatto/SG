export type AuthState = "welcome" | "login" | "register" | "authenticated"
export type SensorType = "temp" | "moisture" | "light" | "waterVolume"

export interface Sensor {
  id: number
  type: "Temperature" | "Moisture" | "Light"
  macId: string
  status: "Online" | "Offline"
  connectionStatus?: "connecting" | "online" | "failed"
}

export interface Pump {
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
  thresholds: {
    minTemp: number
    maxTemp: number
    moistureThreshold: number
    maxLight: number
  }
}