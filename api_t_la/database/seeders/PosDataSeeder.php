<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;


class PosDataSeeder extends Seeder
{
    private function makeImage(string $name): string
    {
        // 1x1 transparent PNG placeholder
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');

        Storage::disk('public')->put("products/{$name}.png", $png);

        return "products/{$name}.png";
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        Storage::disk('public')->deleteDirectory('products');

        $cat1 = Category::create(['category_name' => 'Coffee']);
        $cat2 = Category::create(['category_name' => 'Tea']);

        Product::create([
            'category_id' => $cat1->id,
            'product_name' => 'Iced Latte',
            'price' => 2.50,
            'image' => $this->makeImage('iced-latte'),
        ]);
        Product::create([
            'category_id' => $cat1->id,
            'product_name' => 'Americano',
            'price' => 2.00,
            'image' => $this->makeImage('americano'),
        ]);
        Product::create([
            'category_id' => $cat2->id,
            'product_name' => 'Green Tea',
            'price' => 2.25,
            'image' => $this->makeImage('green-tea'),
        ]);

    }
}
