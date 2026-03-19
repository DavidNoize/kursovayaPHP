<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function collections()
    {
        return $this->hasMany(UserCollection::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function likedReviews()
    {
        return $this->belongsToMany(Review::class, 'review_likes')
                    ->withTimestamps();
    }

    public function moviesInCollection()
    {
        return $this->belongsToMany(Movie::class, 'user_collections')
                    ->withPivot('status', 'user_rating', 'comment')
                    ->withTimestamps();
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }
}