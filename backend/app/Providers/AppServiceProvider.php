<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\User;

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

        // Register Email Config Service
        $this->app->singleton(\App\Services\EmailConfigService::class, function ($app) {
            return new \App\Services\EmailConfigService($app->make(\App\Services\SettingService::class));
        });

        // Register Email Template Service
        $this->app->singleton(\App\Services\EmailTemplateService::class, function ($app) {
            return new \App\Services\EmailTemplateService();
        });

        // Register Audit Service
        $this->app->singleton(\App\Services\AuditService::class, function ($app) {
            return new \App\Services\AuditService();
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
    }
}
