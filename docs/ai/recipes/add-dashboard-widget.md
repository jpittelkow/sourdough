# Recipe: Add Dashboard Widget

Step-by-step guide to add a new widget to the dashboard.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `frontend/components/dashboard/{name}-widget.tsx` | Create | Widget component |
| `frontend/app/(dashboard)/dashboard/page.tsx` | Modify | Add widget to layout |
| `backend/routes/api.php` | Modify | Add data endpoint (if needed) |
| `backend/app/Http/Controllers/Api/DashboardController.php` | Modify | Add data method |

## Step 1: Create the Widget Component

```tsx
// frontend/components/dashboard/example-widget.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Loader2, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';

interface ExampleData {
  total: number;
  change: number;
  changePercent: number;
  items: Array<{
    id: string;
    name: string;
    value: number;
  }>;
}

export function ExampleWidget() {
  const [data, setData] = useState<ExampleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/dashboard/example');
      setData(response.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Example</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Example</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-32 space-y-2">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Example Metric</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{data?.total.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">
          {data?.change >= 0 ? '+' : ''}
          {data?.changePercent.toFixed(1)}% from last period
        </p>

        {/* Optional: Show list of items */}
        {data?.items && data.items.length > 0 && (
          <div className="mt-4 space-y-2">
            {data.items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Step 2: Add to Dashboard Page

```tsx
// frontend/app/(dashboard)/dashboard/page.tsx
import { ExampleWidget } from '@/components/dashboard/example-widget';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your activity.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ExampleWidget />
        {/* Other stat widgets */}
      </div>

      {/* Or for larger widgets */}
      <div className="grid gap-4 md:grid-cols-2">
        <ExampleWidget />
        {/* Other widgets */}
      </div>
    </div>
  );
}
```

## Step 3: Add Backend Endpoint

```php
// backend/routes/api.php

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('dashboard')->group(function () {
        Route::get('/example', [DashboardController::class, 'example']);
    });
});
```

## Step 4: Implement Controller Method

```php
// backend/app/Http/Controllers/Api/DashboardController.php

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Example;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    /**
     * Get example widget data.
     */
    public function example(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Cache for 5 minutes to reduce database load
        $data = Cache::remember("dashboard.example.{$userId}", 300, function () use ($userId) {
            return $this->calculateExampleData($userId);
        });

        return response()->json($data);
    }

    protected function calculateExampleData(int $userId): array
    {
        // Current period (e.g., this month)
        $currentTotal = Example::where('user_id', $userId)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        // Previous period for comparison
        $previousTotal = Example::where('user_id', $userId)
            ->whereBetween('created_at', [
                now()->subMonth()->startOfMonth(),
                now()->subMonth()->endOfMonth(),
            ])
            ->count();

        // Calculate change
        $change = $currentTotal - $previousTotal;
        $changePercent = $previousTotal > 0
            ? (($currentTotal - $previousTotal) / $previousTotal) * 100
            : 0;

        // Get recent items
        $items = Example::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get(['id', 'name', 'value']);

        return [
            'total' => $currentTotal,
            'change' => $change,
            'changePercent' => $changePercent,
            'items' => $items->map(fn($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'value' => $item->value,
            ])->toArray(),
        ];
    }
}
```

## Widget Variations

### Stat Card (Simple Number)

```tsx
export function StatWidget({ title, value, icon: Icon, description }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
```

### Chart Widget

```tsx
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

export function ChartWidget({ data }) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Activity Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### List Widget

```tsx
export function ListWidget({ title, items }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.subtitle}</p>
              </div>
              <div className="ml-auto font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Widget with Actions

```tsx
export function ActionWidget() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Quick Actions</CardTitle>
        <Button variant="outline" size="sm">View All</Button>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button variant="outline" className="justify-start">
          <Plus className="mr-2 h-4 w-4" />
          Create New
        </Button>
        <Button variant="outline" className="justify-start">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Checklist

- [ ] Widget component created in `frontend/components/dashboard/`
- [ ] Widget added to dashboard page
- [ ] Loading state with spinner
- [ ] Error state with retry button
- [ ] Backend endpoint added (if fetching data)
- [ ] Data caching implemented (recommended)
- [ ] Responsive grid layout
- [ ] Proper TypeScript types defined

## Layout Tips

```tsx
// Full width
<div className="grid gap-4">
  <FullWidthWidget />
</div>

// Two columns on medium+
<div className="grid gap-4 md:grid-cols-2">
  <Widget1 />
  <Widget2 />
</div>

// Four columns on large, two on medium
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  <StatWidget1 />
  <StatWidget2 />
  <StatWidget3 />
  <StatWidget4 />
</div>

// Mixed sizes
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  <Widget />
  <LargeWidget className="md:col-span-2" />
</div>
```
