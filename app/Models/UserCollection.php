<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserCollection extends Model
{
    use HasFactory;

    protected $table = 'user_collections';

    protected $fillable = [
        'user_id', 'movie_id', 'status', 
        'user_rating', 'comment'
    ];

    protected $casts = [
        'user_rating' => 'integer'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function movie()
    {
        return $this->belongsTo(Movie::class);
    }
}