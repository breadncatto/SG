# 🌿 SmartGarden - Smart Monitoring System

A high-performance, cross-platform smart gardening monitoring application built with **Next.js 16** and **Firebase**. SmartGarden enables users to monitor and manage garden environments in real-time, providing actionable insights through intuitive data visualization.

<img width="426" height="240" alt="Image" src="https://github.com/user-attachments/assets/f94d5bec-e7ee-427f-ab9a-627bd2b55fac" />

> **📢 Team Project Shoutout:** > This frontend application is part of a team project.** For the backend implementation, please check out our [Backend Repository](https://github.com/cn2303/MP252-Smart-Garden.git).


## 📋 Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Architecture & Performance](#architecture--performance)
- [Setup & Installation](#setup--installation)
- [Development Workflow](#development-workflow)

---

## 🎯 Overview

SmartGarden is an interdisciplinary project designed to bridge IoT sensor data with an accessible user interface.
- **Cross-platform**: Built as a PWA and native-ready app using Capacitor for Android and iOS.
- **Real-time Monitoring**: Integrated with Firebase for live data updates.
- **Interactive UI**: Utilizes advanced charting and accessible components for an enhanced user experience.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Core Framework** | Next.js 16 (React 19) |
| **Native Bridge** | Capacitor (Android & iOS) |
| **Backend/DB** | Firebase |
| **Styling** | Tailwind CSS 4.0 |
| **Data Viz** | Recharts |
| **Form/Validation**| React Hook Form + Zod |
| **UI Components** | Radix UI |

---

## ✨ Key Features

- ✅ **Live Sensor Dashboard**: Real-time visualization of soil moisture, temperature, and light levels using **Recharts**.
- ✅ **Cross-Platform Readiness**: Deployed as a web application and mobile-ready via **Capacitor**.
- ✅ **Progressive Web App (PWA)**: Enhanced with offline support using `@ducanh2912/next-pwa`.
- ✅ **Advanced Data Input**: Complex forms for device configuration and scheduling using **Zod** schema validation and **React Hook Form**.
- ✅ **Responsive UI**: Built with accessible primitives from **Radix UI** and modern styling with **Tailwind CSS**.

---

## 🏗️ Architecture & Performance

The project employs a modular approach to ensure scalability:
- **Component-Driven Development**: Utilizing Radix UI primitives to ensure high accessibility and consistent design.
- **State & Data Management**: Leveraging Firebase for real-time synchronization, minimizing latency for sensor data updates.
- **Performance Optimization**: Next.js 16 Server Components and automatic optimization for assets and code splitting.

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js**: v22 LTS or higher
- **npm** or **pnpm**

### Step 1: Clone Repository
```bash
git clone https://github.com/breadncatto/SG.git
cd SmartGarden

```

### Step 2: Install Dependencies

```bash
npm install

```

### Step 3: Start Development

```bash
npm run dev

```

---

## 💻 Development Workflow

* **Linting**: Run `npm run lint` to maintain code standards.
* **Branching**: Follow `feature/` or `fix/` naming conventions.
* **Deployment**: Configured for Vercel with automatic analytics via `@vercel/analytics`.

---

**Last Updated**: June 2026

**Maintained by**: DADN Team

```
