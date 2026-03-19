<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Country;

class CountriesTableSeeder extends Seeder
{
    public function run()
    {
        $countries = [
            'США', 'Великобритания', 'Франция', 'Германия',
            'Италия', 'Испания', 'Канада', 'Австралия',
            'Япония', 'Корея Южная', 'Китай', 'Индия',
            'Россия', 'Украина', 'Беларусь', 'Казахстан',
            'Новая Зеландия', 'Польша', 'Чехия', 'Швеция'
        ];

        foreach ($countries as $country) {
            Country::firstOrCreate(['name' => $country]);
        }
        
        $this->command->info('Страны добавлены/проверены успешно!');
    }
}