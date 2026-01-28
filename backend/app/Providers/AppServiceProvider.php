<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Config;
use App\Models\User;
use App\Models\SystemSetting;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register LLM Orchestrator
        $this->app->singleton(\App\Services\LLM\LLMOrchestrator::class, function ($app) {
            return new \App\Services\LLM\LLMOrchestrator();
        });

        // Register Notification Orchestrator
        $this->app->singleton(\App\Services\Notifications\NotificationOrchestrator::class, function ($app) {
            return new \App\Services\Notifications\NotificationOrchestrator();
        });

        // Register Backup Service
        $this->app->singleton(\App\Services\Backup\BackupService::class, function ($app) {
            return new \App\Services\Backup\BackupService();
        });

        // Register Version Service
        $this->app->singleton(\App\Services\VersionService::class, function ($app) {
            return new \App\Services\VersionService();
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Define admin gate
        Gate::define('admin', function (User $user) {
            return $user->isAdmin();
        });

        // Define backup management gate
        Gate::define('manage-backups', function (User $user) {
            return $user->isAdmin();
        });

        // Define settings management gate
        Gate::define('manage-settings', function (User $user) {
            return $user->isAdmin();
        });

        // Set mail from name from database (fallback to env or default)
        try {
            $appName = SystemSetting::get('app_name', null, 'general') ?? env('MAIL_FROM_NAME', 'Sourdough');
            Config::set('mail.from.name', $appName);
        } catch (\Exception $e) {
            // If database isn't ready yet (e.g., during migrations), use env fallback
            Config::set('mail.from.name', env('MAIL_FROM_NAME', 'Sourdough'));
        }
    }
}
