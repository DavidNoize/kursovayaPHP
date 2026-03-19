<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('movies', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->enum('type', ['movie', 'series']);
            $table->text('description')->nullable();
            $table->integer('release_year');
            $table->string('poster')->nullable();
            $table->integer('duration')->nullable();
            $table->integer('seasons')->nullable();
            $table->integer('episodes')->nullable();
            $table->decimal('imdb_rating', 3, 1)->nullable();
            $table->bigInteger('views')->default(0);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('movies');
    }
};