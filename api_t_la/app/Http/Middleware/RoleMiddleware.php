<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        // ឆែកមើលថាតើ User មាន Role មួយក្នុងចំណោម Role ដែលបានអនុញ្ញាតដែរឬទេ
        if (!$user || !$user->hasAnyRole($roles)) {
            return response()->json([
                'message' => 'អ្នកគ្មានសិទ្ធិចូលប្រើប្រាស់មុខងារនេះទេ (Unauthorized Access)'
            ], 403);
        }

        return $next($request);
    }
}
