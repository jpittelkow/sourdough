<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
*/

// Scheduled backups (configurable frequency)
$backupFrequency = config('backup.schedule.frequency', 'daily');
$backupTime = config('backup.schedule.time', '02:00');

if (config('backup.schedule.enabled')) {
    $backup = Schedule::command('backup:run');

    match ($backupFrequency) {
        'hourly' => $backup->hourly(),
        'daily' => $backup->dailyAt($backupTime),
        'weekly' => $backup->weeklyOn(
            config('backup.schedule.day_of_week', 0),
            $backupTime
        ),
        'monthly' => $backup->monthlyOn(
            config('backup.schedule.day_of_month', 1),
            $backupTime
        ),
        default => $backup->dailyAt($backupTime),
    };
}

// Queue worker monitoring
Schedule::command('queue:monitor')
    ->everyFiveMinutes()
    ->withoutOverlapping();
