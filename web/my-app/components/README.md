# Hacker Introspector - Frontend

## Charts Overview

This frontend displays comprehensive insights about hackathon repositories using various chart types:

### 1. **Language Pie Chart** (`LanguagePieChart.tsx`)

- **Purpose**: Shows the distribution of programming languages used in the repository
- **Chart Type**: Pie Chart (Recharts)
- **Data Structure**:
  ```typescript
  { name: string, value: number }[]
  ```

### 2. **Commit Bar Chart** (`CommitBarChart.tsx`)

- **Purpose**: Displays commit count per contributor
- **Chart Type**: Bar Chart (Recharts)
- **Data Structure**:
  ```typescript
  { contributor: string, commits: number }[]
  ```

### 3. **Project Pulse Line Chart** (`ProjectPulseLineChart.tsx`)

- **Purpose**: Shows commit activity over the 72-hour hackathon period
- **Chart Type**: Line Chart (Recharts)
- **Data Structure**:
  ```typescript
  { hour: string, commits: number }[]
  ```

### 4. **Commit Heatmap** (`CommitHeatmap.tsx`)

- **Purpose**: Visualizes when commits are made (day vs hour)
- **Chart Type**: Custom Heatmap
- **Data Structure**:
  ```typescript
  { date: string, count: number, day: number, hour: number }[]
  ```
- **Features**:
  - Shows 3 days (hackathon duration)
  - 24 hours per day
  - Color intensity based on commit count

### 5. **Commit Histogram** (`CommitHistogram.tsx`)

- **Purpose**: Shows commit distribution by hour of the day
- **Chart Type**: Custom Histogram
- **Data Structure**:
  ```typescript
  { hour: number, commits: number }[]
  ```

### 6. **Consistency Radar Chart** (`ConsistencyRadarChart.tsx`)

- **Purpose**: Displays project health metrics
- **Chart Type**: Radar Chart (Recharts)
- **Metrics**:
  - **Consistency**: Regular commit patterns
  - **Insomnia**: Late night/early morning activity
  - **Bus Factor**: Knowledge distribution across team
  - **Volume**: Total contribution output

## Tech Stack

- **Framework**: Next.js 16.1.1 with App Router
- **Styling**: Tailwind CSS 4.x
- **Charts**:
  - Recharts 3.6.0 (Pie, Bar, Line, Radar)
  - Custom components (Heatmap, Histogram)
- **Language**: TypeScript 5.x

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Connecting to Backend

When ready to connect to your Go backend, update the components to:

1. Create an API client in `lib/api.ts`
2. Use React hooks (useState, useEffect) to fetch data
3. Replace dummy data with API responses
4. Add loading states and error handling

Example:

```typescript
"use client";

import { useState, useEffect } from "react";
import { LanguageData } from "@/types/charts";

export default function LanguagePieChart() {
  const [data, setData] = useState<LanguageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/languages")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  // ... rest of component
}
```

## Backend Integration Endpoints

You'll need these endpoints from your Go backend:

- `GET /api/languages` - Language distribution
- `GET /api/contributors` - Contributor statistics
- `GET /api/pulse` - Time-series commit data
- `GET /api/heatmap` - Heatmap data
- `GET /api/activity` - Hourly activity histogram
- `GET /api/metrics` - Health metrics for radar chart

Or a single endpoint:

- `POST /api/analyze` - Analyze repository and return all data

## Dummy Data

Currently, all charts use dummy data for demonstration. The data represents a typical hackathon project:

- 5 programming languages
- 5 contributors
- 72-hour development period
- Realistic commit patterns (high activity in afternoons/evenings)
