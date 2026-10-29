<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProductSecurity
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $dev = app()->environment('local') && file_exists(public_path('hot'));
        $scripts = $dev ? "'self' http://localhost:5173 http://127.0.0.1:5173" : "'self'";
        $connect = $dev ? "'self' http://localhost:5173 http://127.0.0.1:5173 ws://localhost:5173 ws://127.0.0.1:5173" : "'self'";
        $response->headers->set('Content-Security-Policy', "default-src 'self'; script-src {$scripts}; style-src {$scripts}; img-src 'self' data:; font-src 'self'; connect-src {$connect}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set('Cache-Control', 'no-cache, private');
        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000');
        }

        return $response;
    }
}
