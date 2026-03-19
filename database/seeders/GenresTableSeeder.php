<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Genre;

class GenresTableSeeder extends Seeder
{
    public function run()
    {
        
        $genres = [
            'драма', 'криминал', 'боевик', 'фантастика',
            'триллер', 'комедия', 'приключения', 'фэнтези',
            'ужасы', 'романтика', 'мультфильм', 'мюзикл',
            'аниме', 'вестерн', 'исторический', 'военный',
            'детектив', 'биография'
        ];

        foreach ($genres as $genre) {
            Genre::firstOrCreate(['name' => $genre]);
        }
        
        $this->command->info('Жанры добавлены/проверены успешно!');
    }
}