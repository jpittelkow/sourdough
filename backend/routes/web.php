<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Sourdough uses a separate Next.js frontend, so web routes are minimal.
| API routes are defined in routes/api.php
|
*/

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name'),
        'version' => config('version.version'),
        'api' => url('/api'),
    ]);
});
