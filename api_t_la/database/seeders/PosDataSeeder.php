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

    private function makeCategoryImage(string $name): string
    {
        // 1x1 transparent PNG placeholder for category
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');

        Storage::disk('public')->put("categories/{$name}.png", $png);

        return "categories/{$name}.png";
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Storage::disk('public')->deleteDirectory('products');
        Storage::disk('public')->deleteDirectory('categories');

        $categories = [
            'Coffee',
            'Tea',
            'Pastries',
            'Sandwiches',
            'Cold Drinks',
            'Hot Drinks',
            'Breakfast',
            'Snacks',
            'Desserts',
            'Specials',
        ];

        $categoryModels = [];
        foreach ($categories as $name) {
            // ប្រើ updateOrCreate ដើម្បីឱ្យ Image ត្រូវបានធ្វើបច្ចុប្បន្នភាពពេល Run db:seed ច្រើនដង
            $categoryModels[] = Category::updateOrCreate(
                ['category_name' => $name],
                ['image' => $this->makeCategoryImage(strtolower(str_replace(' ', '-', $name)))]
            );
        }

        $productsByCategory = [
            'Coffee' => [
                'Espresso' => 2.00,
                'Americano' => 2.00,
                'Cappuccino' => 3.00,
                'Caffe Latte' => 3.25,
                'Iced Latte' => 2.50,
                'Mocha' => 3.50,
                'Flat White' => 3.40,
                'Caramel Macchiato' => 3.75,
                'Affogato' => 3.90,
            ],
            'Tea' => [
                'Green Tea' => 2.25,
                'Black Tea' => 2.00,
                'Earl Grey Tea' => 2.40,
                'Jasmine Tea' => 2.30,
                'Chai Latte' => 3.10,
                'Matcha Latte' => 3.50,
                'Peppermint Tea' => 2.20,
                'Oolong Tea' => 2.60,
            ],
            'Pastries' => [
                'Butter Croissant' => 2.50,
                'Chocolate Croissant' => 3.00,
                'Blueberry Muffin' => 2.80,
                'Cinnamon Roll' => 3.20,
                'Apple Turnover' => 2.90,
                'Danish Pastry' => 2.70,
                'Cheese Danish' => 3.10,
                'Pain au Chocolat' => 3.30,
                'Banana Bread Slice' => 2.60,
            ],
            'Sandwiches' => [
                'Chicken Sandwich' => 5.50,
                'Tuna Sandwich' => 5.00,
                'Club Sandwich' => 6.00,
                'BLT Sandwich' => 5.80,
                'Grilled Cheese' => 4.50,
                'Veggie Sandwich' => 4.80,
                'Ham & Cheese Sandwich' => 5.20,
                'Egg Salad Sandwich' => 4.90,
            ],
            'Cold Drinks' => [
                'Iced Coffee' => 3.00,
                'Iced Americano' => 2.80,
                'Cold Brew' => 3.50,
                'Frappe' => 4.00,
                'Lemonade' => 2.50,
                'Iced Chocolate' => 3.60,
                'Smoothie' => 4.20,
                'Sparkling Water' => 1.80,
                'Berry Cooler' => 3.30,
            ],
            'Hot Drinks' => [
                'Hot Chocolate' => 3.20,
                'Hot Tea' => 2.00,
                'Hot Espresso' => 1.90,
                'Hot Macchiato' => 3.30,
                'Caramel Hot Drink' => 3.60,
                'Vanilla Steamer' => 2.80,
                'Hot Chai' => 2.90,
                'Mint Hot Chocolate' => 3.40,
            ],
            'Breakfast' => [
                'Breakfast Wrap' => 5.20,
                'Egg & Toast' => 4.00,
                'Pancakes' => 5.80,
                'Oatmeal Bowl' => 4.50,
                'Bagel with Cream Cheese' => 3.80,
                'Breakfast Burrito' => 5.50,
                'Muffin & Coffee Combo' => 4.90,
                'Yogurt Parfait' => 4.20,
                'Smoked Salmon Bagel' => 6.50,
            ],
            'Snacks' => [
                'Potato Chips' => 1.80,
                'Pretzel' => 2.20,
                'Cookie Jar' => 2.00,
                'Granola Bar' => 2.50,
                'Popcorn' => 2.30,
                'Nuts Mix' => 3.00,
                'Fruit Cup' => 2.80,
                'Trail Mix' => 2.90,
            ],
            'Desserts' => [
                'Cheesecake' => 4.80,
                'Chocolate Cake' => 4.50,
                'Tiramisu' => 5.00,
                'Brownie' => 3.20,
                'Apple Pie' => 4.00,
                'Cupcake' => 3.50,
                'Ice Cream Scoop' => 2.80,
                'Panna Cotta' => 4.20,
                'Lava Cake' => 4.90,
            ],
            'Specials' => [
                'Seasonal Latte' => 4.00,
                'Chef Special Burger' => 7.50,
                'Limited Edition Frappe' => 4.80,
                'Weekend Special Soup' => 4.20,
                'Signature Blend Coffee' => 3.80,
                'Special Combo Meal' => 8.90,
                'Daily Dessert Special' => 4.00,
                'Holiday Special Drink' => 4.50,
            ],
        ];

        foreach ($categoryModels as $category) {
            $catName = $category->category_name;
            $catId = $category->category_id ?? $category->id;

            if (isset($productsByCategory[$catName])) {
                foreach ($productsByCategory[$catName] as $productName => $price) {
                    Product::firstOrCreate(
                        ['product_name' => $productName],
                        [
                            'category_id' => $catId,
                            'price' => $price,
                            'image' => $this->makeImage(strtolower(str_replace(' ', '-', $productName))),
                        ]
                    );
                }
            }
        }
    }
}