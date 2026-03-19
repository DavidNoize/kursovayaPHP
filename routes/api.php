<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MovieController;
use App\Http\Controllers\Api\CollectionController;
use App\Http\Controllers\Api\ReviewController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/movies', [MovieController::class, 'index']);
Route::get('/movies/{id}', [MovieController::class, 'show']);
Route::get('/genres', [MovieController::class, 'genres']);
Route::get('/countries', [MovieController::class, 'countries']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    Route::get('/collection', [CollectionController::class, 'index']);
    Route::get('/collection/stats', [CollectionController::class, 'stats']);
    Route::get('/collection/check/{movieId}', [CollectionController::class, 'check']);
    Route::post('/collection/{movieId}', [CollectionController::class, 'store']);
    Route::delete('/collection/{movieId}', [CollectionController::class, 'destroy']);
    
    Route::get('/movies/{movieId}/reviews', [ReviewController::class, 'index']);
    Route::post('/movies/{movieId}/reviews', [ReviewController::class, 'store']);
    Route::post('/reviews/{reviewId}/like', [ReviewController::class, 'like']);
    Route::delete('/reviews/{reviewId}', [ReviewController::class, 'destroy']);
});