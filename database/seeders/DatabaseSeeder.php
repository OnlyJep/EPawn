<?php

namespace Database\Seeders;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $user = User::firstOrCreate(
            ['username' => 'admin'],
            [
                'email' => 'admin@epawn.local',
                'password' => Hash::make('071799'),
            ]
        );

        Profile::firstOrCreate(
            ['user_id' => $user->id],
            [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'fullname' => 'Admin User',
            ]
        );
    }
}
