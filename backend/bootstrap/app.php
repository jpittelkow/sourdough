<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Trust proxies (Cloudflare Tunnel, Nginx, Traefik, etc.)
        // Set TRUSTED_PROXIES=* to trust all proxies (safe when container is only reachable via proxy)
        $middleware->trustProxies(
            at: in_array(trim(env('TRUSTED_PROXIES', '')), ['*', '**'], true)
                ? '*'
                : array_filter(array_map('trim', explode(',', env('TRUSTED_PROXIES', '')))),
        );

        $middleware->api(prepend: [
            \App\Http\Middleware\AddCorrelationId::class,
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        $middleware->alias([
            'verified' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            '2fa' => \App\Http\Middleware\Ensure2FAVerified::class,
            '2fa.setup' => \App\Http\Middleware\Ensure2FASetupWhenRequired::class,
            'rate.sensitive' => \App\Http\Middleware\RateLimitSensitive::class,
            'log.access' => \App\Http\Middleware\LogResourceAccess::class,
        ]);

        // Exclude client error reporting from CSRF (rate-limited, no auth, logging only)
        $middleware->validateCsrfTokens(except: [
            'api/client-errors',
        ]);

        // Enable stateful API authentication with session support
        $middleware->statefulApi();
        
        // Explicitly add session middleware for API routes to ensure sessions work
        $middleware->api([
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
