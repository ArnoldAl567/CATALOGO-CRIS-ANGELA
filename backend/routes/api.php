<?php

use App\Http\Controllers\CatalogController;
use App\Http\Controllers\OrderQuoteController;
use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

Route::get('/catalogo', CatalogController::class);
Route::get('/productos', [ProductController::class, 'index']);
Route::get('/productos/seleccion', [ProductController::class, 'selection']);
Route::post('/pedidos/cotizar', OrderQuoteController::class)->middleware('throttle:30,1');
