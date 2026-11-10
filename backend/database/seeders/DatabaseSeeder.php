<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = json_decode(file_get_contents(database_path('data/catalogo.json')), true, 512, JSON_THROW_ON_ERROR);
        $featured = ['a01', 'c04', 'r02', 'j02'];

        DB::transaction(function () use ($catalog, $featured): void {
            foreach ($catalog['categorias'] as $position => $category) {
                Category::query()->updateOrCreate(['id' => $category['id']], [
                    'name' => $category['nombre'],
                    'image' => 'assets/'.$category['foto'].'.webp',
                    'theme' => $category['tema'],
                    'caption' => $category['texto'],
                    'position' => $position,
                ]);
            }

            foreach ($catalog['productos'] as $position => $product) {
                Product::query()->updateOrCreate(['id' => $product['id']], [
                    'category_id' => $product['categoria'],
                    'name' => $product['nombre'],
                    'price_cents' => $product['precio'],
                    'description' => $product['descripcion'],
                    'features' => $product['caracteristicas'],
                    'options' => $product['opciones'],
                    'images' => $product['fotos'],
                    'sold_by_unit' => $product['porUnidad'],
                    'featured' => in_array($product['id'], $featured, true),
                    'position' => $position,
                ]);
            }
        });
    }
}
