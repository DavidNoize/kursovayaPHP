<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Movie;
use App\Models\Genre;
use App\Models\Country;
use Illuminate\Http\Request;

class MovieController extends Controller
{
    public function index(Request $request)
    {
        $query = Movie::with(['genres', 'countries', 'actors', 'directors']);

        if ($request->has('search') && $request->search) {
            $query->where('title', 'LIKE', '%' . $request->search . '%');
        }

        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }

        if ($request->has('genre') && $request->genre) {
            $query->whereHas('genres', function ($q) use ($request) {
                $q->where('genres.id', $request->genre);
            });
        }

        if ($request->has('country') && $request->country) {
            $query->whereHas('countries', function ($q) use ($request) {
                $q->where('countries.id', $request->country);
            });
        }

        if ($request->has('year_from') && $request->year_from) {
            $query->where('release_year', '>=', $request->year_from);
        }
        if ($request->has('year_to') && $request->year_to) {
            $query->where('release_year', '<=', $request->year_to);
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        if ($sortBy === 'rating') {
            $sortBy = 'imdb_rating';
        }
        
        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->get('per_page', 20);
        $movies = $query->paginate($perPage);

        return response()->json($movies);
    }

    public function show($id)
    {
        $movie = Movie::with(['genres', 'countries', 'actors', 'directors'])
                      ->findOrFail($id);
        
        $movie->increment('views');

        return response()->json($movie);
    }

    public function genres()
    {
        $genres = Genre::withCount('movies')->get();
        return response()->json($genres);
    }

    public function countries()
    {
        $countries = Country::withCount('movies')->get();
        return response()->json($countries);
    }
}