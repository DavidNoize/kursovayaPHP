<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClearTablesSeeder extends Seeder
{
    public function run()
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        
        DB::table('movie_genre')->truncate();
        DB::table('movie_country')->truncate();
        DB::table('movie_actor')->truncate();
        DB::table('movie_director')->truncate();
        DB::table('user_collections')->truncate();
        DB::table('reviews')->truncate();
        DB::table('movies')->truncate();
        DB::table('genres')->truncate();
        DB::table('countries')->truncate();
        DB::table('actors')->truncate();
        DB::table('directors')->truncate();
        
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        
        $this->command->info('Все таблицы очищены!');
    }
}