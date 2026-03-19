<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/index.html');
});

Route::get('/collection', function () {
    return redirect('/collection.html');
});