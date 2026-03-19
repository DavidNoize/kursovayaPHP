<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index($movieId)
    {
        $reviews = Review::with('user')
            ->where('movie_id', $movieId)
            ->orderBy('created_at', 'desc')
            ->paginate(10);
            
        return response()->json($reviews);
    }

    public function store(Request $request, $movieId)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:10',
            'review_text' => 'required|string|min:10|max:2000'
        ]);

        $user = $request->user();
        
        $existing = Review::where('user_id', $user->id)
            ->where('movie_id', $movieId)
            ->first();
            
        if ($existing) {
            return response()->json([
                'message' => 'Вы уже оставили отзыв'
            ], 400);
        }

        $review = Review::create([
            'user_id' => $user->id,
            'movie_id' => $movieId,
            'rating' => $request->rating,
            'review_text' => $request->review_text
        ]);

        return response()->json([
            'message' => 'Отзыв добавлен',
            'data' => $review->load('user')
        ], 201);
    }

    public function like(Request $request, $reviewId)
    {
        $user = $request->user();
        $review = Review::findOrFail($reviewId);
        
        $existing = $review->likedBy()->where('user_id', $user->id)->exists();
        
        if ($existing) {
            $review->likedBy()->detach($user->id);
            $review->decrement('likes');
            $message = 'Лайк убран';
        } else {
            $review->likedBy()->attach($user->id);
            $review->increment('likes');
            $message = 'Лайк поставлен';
        }

        return response()->json([
            'message' => $message,
            'likes' => $review->fresh()->likes
        ]);
    }

    public function destroy(Request $request, $reviewId)
    {
        $user = $request->user();
        $review = Review::findOrFail($reviewId);
        
        if ($review->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json([
                'message' => 'Нет прав на удаление'
            ], 403);
        }

        $review->delete();

        return response()->json([
            'message' => 'Отзыв удален'
        ]);
    }
}