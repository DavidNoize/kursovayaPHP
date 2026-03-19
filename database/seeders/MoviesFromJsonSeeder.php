<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Movie;
use App\Models\Genre;
use App\Models\Country;
use App\Models\Actor;
use App\Models\Director;
use Illuminate\Support\Facades\DB;

class MoviesFromJsonSeeder extends Seeder
{
    public function run()
    {
        $jsonPath = base_path('films.json');
        
        if (!file_exists($jsonPath)) {
            $this->command->error('Файл films.json не найден! Положите его в корень проекта.');
            return;
        }

        $json = file_get_contents($jsonPath);
        $data = json_decode($json, true);

        if (!isset($data['movies'])) {
            $this->command->error('Неверный формат JSON!');
            return;
        }

        $this->command->info('Начинаем импорт фильмов...');

        foreach ($data['movies'] as $item) {
            $movie = Movie::where('title', $item['title'])
                         ->where('release_year', $item['year'])
                         ->first();
            
            if (!$movie) {
                $movie = Movie::create([
                    'title' => $item['title'],
                    'type' => $item['type'] === 'фильм' ? 'movie' : 'series',
                    'description' => $item['description'] ?? null,
                    'release_year' => $item['year'],
                    'poster' => $item['poster'] ?? null,
                    'duration' => isset($item['duration']) ? (int) $item['duration'] : null,
                    'seasons' => $item['seasons'] ?? null,
                    'episodes' => $item['episodes'] ?? null,
                    'imdb_rating' => $item['rating'] ?? null,
                ]);
                
                $this->command->info('Добавлен фильм: ' . $item['title']);
            } else {
                $this->command->info('Фильм уже существует: ' . $item['title']);
            }

            if (isset($item['genre']) && is_array($item['genre'])) {
                $genreIds = [];
                foreach ($item['genre'] as $genreName) {
                    $genre = Genre::firstOrCreate(['name' => $genreName]);
                    $genreIds[] = $genre->id;
                }
                $movie->genres()->syncWithoutDetaching($genreIds);
            }

            if (isset($item['country'])) {
                $countries = is_array($item['country']) 
                    ? $item['country'] 
                    : explode(', ', $item['country']);
                
                $countryIds = [];
                foreach ($countries as $countryName) {
                    $countryName = trim($countryName);
                    if ($countryName) {
                        $country = Country::firstOrCreate(['name' => $countryName]);
                        $countryIds[] = $country->id;
                    }
                }
                $movie->countries()->syncWithoutDetaching($countryIds);
            }

            if (isset($item['cast']) && is_array($item['cast'])) {
                $actorIds = [];
                foreach ($item['cast'] as $actorName) {
                    $actor = Actor::firstOrCreate(['name' => $actorName]);
                    $actorIds[] = $actor->id;
                }
                $movie->actors()->syncWithoutDetaching($actorIds);
            }

            if (isset($item['director'])) {
                $director = Director::firstOrCreate(['name' => $item['director']]);
                $movie->directors()->syncWithoutDetaching([$director->id]);
            }
        }

        $this->command->info('Импорт завершен!');
    }
}