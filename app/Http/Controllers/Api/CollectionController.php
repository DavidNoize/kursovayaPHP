<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserCollection;
use Illuminate\Http\Request;

class CollectionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $collections = UserCollection::with('movie')
            ->where('user_id', $user->id)
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($collections);
    }

    public function store(Request $request, $movieId)
    {
        $user = $request->user();

        $request->validate([
            'status' => 'required|in:wishlist,watching,watched',
            'user_rating' => 'nullable|integer|min:1|max:10',
            'comment' => 'nullable|string|max:1000'
        ]);

        $collection = UserCollection::updateOrCreate(
            ['user_id' => $user->id, 'movie_id' => $movieId],
            [
                'status' => $request->status,
                'user_rating' => $request->user_rating,
                'comment' => $request->comment
            ]
        );

        return response()->json([
            'message' => 'Коллекция обновлена',
            'data' => $collection->load('movie')
        ]);
    }

    public function check(Request $request, $movieId)
    {
        $user = $request->user();
        
        $collection = UserCollection::where('user_id', $user->id)
            ->where('movie_id', $movieId)
            ->first();

        return response()->json([
            'in_collection' => !!$collection,
            'data' => $collection
        ]);
    }

    public function stats(Request $request)
    {
        $user = $request->user();
        
        $total = UserCollection::where('user_id', $user->id)->count();
        $wishlist = UserCollection::where('user_id', $user->id)->where('status', 'wishlist')->count();
        $watching = UserCollection::where('user_id', $user->id)->where('status', 'watching')->count();
        $watched = UserCollection::where('user_id', $user->id)->where('status', 'watched')->count();
        
        $rated = UserCollection::where('user_id', $user->id)
            ->whereNotNull('user_rating')
            ->avg('user_rating');
        
        return response()->json([
            'total' => $total,
            'wishlist' => $wishlist,
            'watching' => $watching,
            'watched' => $watched,
            'average_rating' => round($rated, 1) ?? 0
        ]);
    }

    public function destroy(Request $request, $movieId)
    {
        $user = $request->user();

        UserCollection::where('user_id', $user->id)
            ->where('movie_id', $movieId)
            ->delete();

        return response()->json([
            'message' => 'Удалено из коллекции'
        ]);
    }
}