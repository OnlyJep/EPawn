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

// Debug check: return SERVER vars before booting Laravel
$requestUri = $_SERVER['REQUEST_URI'] ?? '(none)';
$scriptName = $_SERVER['SCRIPT_NAME'] ?? '(none)';
$pathInfo = $_SERVER['PATH_INFO'] ?? '(none)';
$method = $_SERVER['REQUEST_METHOD'] ?? '(none)';
$queryString = $_SERVER['QUERY_STRING'] ?? '(none)';

// If we hit /debug-server or /api/debug-server, return server info as JSON
if (preg_match('#/debug-server#', $requestUri)) {
    header('Content-Type: application/json');
    echo json_encode([
        'REQUEST_URI' => $requestUri,
        'SCRIPT_NAME' => $scriptName,
        'PATH_INFO'   => $pathInfo,
        'METHOD'      => $method,
        'QUERY_STRING' => $queryString,
        'VERCEL'      => getenv('VERCEL'),
        'APP_KEY'     => getenv('APP_KEY') ? substr(getenv('APP_KEY'), 0, 10) . '...' : null,
    ]);
    exit;
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
