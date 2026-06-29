<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->session()->get('admin_logged_in')) {
            if ($request->expectsJson() || $request->is('admin/*')) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
            return redirect('/adminportal');
        }

        return $next($request);
    }
}
