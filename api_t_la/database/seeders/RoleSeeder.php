<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // 1. បង្កើត Roles (បើមានហើយ វាមិនបង្កើតស្ទួនទេ)
        $adminRole   = Role::firstOrCreate(['role_name' => 'Admin']);
        $managerRole = Role::firstOrCreate(['role_name' => 'Manager']);
        $cashierRole = Role::firstOrCreate(['role_name' => 'Cashier']);

        // 2. បង្កើត Admin User (បើមាន username 'admin' ហើយ វាមិនបង្កើតស្ទួនទេ)
        $adminUser = User::firstOrCreate(
            ['username' => 'admin'],
            [
                'full_name'     => 'System Admin',
                'password_hash' => Hash::make('11112222'),
                'is_active'     => true,
            ]
        );

        // 3. ភ្ជាប់ Admin Role ( syncWithoutDetaching ការពារកុំឱ្យស្ទួន Relation ក្នុង pivot table)
        $adminUser->roles()->syncWithoutDetaching([$adminRole->role_id]);
    }
}