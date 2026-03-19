<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Movie extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'type', 'description', 'release_year',
        'poster', 'duration', 'seasons', 'episodes',
        'imdb_rating', 'views'
    ];

    protected $casts = [
        'release_year' => 'integer',
        'duration' => 'integer',
        'seasons' => 'integer',
        'episodes' => 'integer',
        'imdb_rating' => 'float',
        'views' => 'integer'
    ];

    public function genres()
    {
        return $this->belongsToMany(Genre::class, 'movie_genre');
    }

    public function countries()
    {
        return $this->belongsToMany(Country::class, 'movie_country');
    }

    public function actors()
    {
        return $this->belongsToMany(Actor::class, 'movie_actor')
                    ->withPivot('role');
    }

    public function directors()
    {
        return $this->belongsToMany(Director::class, 'movie_director');
    }

    public function collections()
    {
        return $this->hasMany(UserCollection::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function usersInCollection()
    {
        return $this->belongsToMany(User::class, 'user_collections')
                    ->withPivot('status', 'user_rating', 'comment')
                    ->withTimestamps();
    }

    public function scopeMovies($query)
    {
        return $query->where('type', 'movie');
    }

    public function scopeSeries($query)
    {
        return $query->where('type', 'series');
    }

    public function scopeSearch($query, $term)
    {
        return $query->where('title', 'LIKE', "%{$term}%");
    }
}