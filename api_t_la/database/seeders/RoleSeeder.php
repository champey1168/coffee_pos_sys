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
        // 1. បង្កើត Roles
        $adminRole   = Role::create(['role_name' => 'Admin']);
        $managerRole = Role::create(['role_name' => 'Manager']);
        $cashierRole = Role::create(['role_name' => 'Cashier']);

        // 2. បង្កើត Admin User ដំបូង
        $adminUser = User::create([
            'username'      => 'admin',
            'full_name'     => 'System Admin',
            'password_hash' => Hash::make('11112222'),
            'is_active'     => true,
        ]);

        // 3. ភ្ជាប់ Admin Role ទៅកាន់ Admin User
        $adminUser->roles()->attach($adminRole->role_id);
    }
}