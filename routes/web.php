<?php

use Illuminate\Support\Facades\Route;

Route::view('/', 'product');
Route::view('/mustika-rasa', 'product');
Route::view('/mustika-rasa/{id}', 'product')->where('id', 'mr-[a-f0-9]{12}');
Route::view('/resep', 'product');
Route::view('/resep/baru', 'product');
Route::view('/resep/{id}', 'product')->where('id', '[a-z0-9-]+');
Route::view('/resep/{id}/edit', 'product')->where('id', '[a-z0-9-]+');
Route::view('/koleksi', 'product');
Route::redirect('/tersimpan', '/koleksi', 301);
Route::view('/rencana', 'product');
Route::view('/belanja', 'product');
Route::view('/pengaturan', 'product');
Route::view('/privasi', 'product');
Route::redirect('/about-us', '/privasi');
Route::redirect('/about-me', '/koleksi');
Route::redirect('/login', '/pengaturan');
Route::redirect('/register', '/pengaturan');
Route::get('/health', fn () => response()->json(['status' => 'ok', 'app' => 'flavory', 'storage' => 'browser']));
