export const alerts = [
  { id: 1, message: "High Temp Alert: 42°C in Tomato Garden", time: "2 min ago", unread: true },
  { id: 2, message: "Low Moisture Warning: 30% in Orchid Pump", time: "15 min ago", unread: true },
  { id: 3, message: "Pump 03 turned ON automatically", time: "1 hour ago", unread: false },
  { id: 4, message: "System maintenance scheduled", time: "2 hours ago", unread: false },
]

export const waterUsageData = [120, 145, 130, 165, 180, 155, 170, 190, 175, 160, 185, 195]

export const sensorHistoryData = {
  temp: [24, 26, 28, 30, 29, 27, 28, 31, 30, 28, 27, 26],
  moisture: [55, 58, 62, 60, 65, 68, 70, 65, 62, 60, 63, 65],
  light: [45, 52, 68, 78, 85, 82, 75, 70, 60, 50, 45, 40],
  waterVolume: [2, 3, 4, 3.5, 4.2, 5, 4.8, 5.5, 6, 5.2, 4.8, 5],
}