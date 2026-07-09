<?php

// Vercel serverless entry point for Laravel

if (getenv('VERCEL')) {
    $tmp = '/tmp';
    @mkdir("{$tmp}/storage/framework/views", 0777, true);
    @mkdir("{$tmp}/storage/framework/cache/data", 0777, true);
    @mkdir("{$tmp}/storage/logs", 0777, true);

    putenv('VIEW_COMPILED_PATH=' . $tmp . '/storage/framework/views');
    putenv('LOG_CHANNEL=stderr');
    putenv('SESSION_DRIVER=cookie');
    putenv('CACHE_DRIVER=array');

    if (!getenv('APP_KEY')) {
        $keyFile = __DIR__ . '/../.vercel-app-key';
        if (file_exists($keyFile)) {
            putenv('APP_KEY=' . trim(file_get_contents($keyFile)));
        }
    }
}

if (file_exists(__DIR__.'/../storage/framework/maintenance.php')) {
    require __DIR__.'/../storage/framework/maintenance.php';
}

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
)->send();

$kernel->terminate($request, $response);
