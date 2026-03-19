<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('user_collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('movie_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['wishlist', 'watching', 'watched'])->default('wishlist');
            $table->integer('user_rating')->nullable();
            $table->text('comment')->nullable();
            $table->timestamps();
            
            $table->unique(['user_id', 'movie_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('user_collections');
    }
};