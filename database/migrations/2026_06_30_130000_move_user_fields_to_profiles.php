<?php

use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            $this->migrateSqlite();
        } else {
            // MySQL / PostgreSQL - use standard Laravel migration
            Schema::table('profiles', function (Blueprint $table) {
                $table->string('google_id')->nullable()->unique()->after('user_id');
                $table->timestamp('archived_at')->nullable()->after('updated_at');
            });

            foreach (User::cursor() as $user) {
                $profile = Profile::firstOrNew(['user_id' => $user->id]);
                $profile->google_id = $user->google_id;
                $profile->first_name = $profile->first_name ?: ($user->first_name ?: 'User');
                $profile->middle_initial = $profile->middle_initial ?: $user->middle_initial;
                $profile->last_name = $profile->last_name ?: ($user->last_name ?: '');
                $profile->suffix = $profile->suffix ?: $user->suffix;
                $profile->fullname = $profile->fullname ?: ($user->fullname ?: 'User');
                if ($user->archived_at) {
                    $profile->archived_at = $user->archived_at;
                }
                $profile->save();
            }

            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn(['fullname', 'first_name', 'middle_initial', 'last_name', 'suffix', 'google_id', 'archived_at']);
            });
        }
    }

    protected function migrateSqlite()
    {
        $columns = Schema::getColumnListing('users');
        $hasExtra = count(array_intersect($columns, ['first_name', 'last_name', 'fullname'])) > 0;
        if (!$hasExtra) {
            return;
        }

        if (!in_array('google_id', Schema::getColumnListing('profiles'))) {
            DB::statement('ALTER TABLE profiles ADD COLUMN google_id VARCHAR(255) NULL');
        }
        if (!in_array('archived_at', Schema::getColumnListing('profiles'))) {
            DB::statement('ALTER TABLE profiles ADD COLUMN archived_at DATETIME NULL');
        }

        foreach (User::cursor() as $user) {
            $profile = Profile::firstOrNew(['user_id' => $user->id]);
            $profile->user_id = $user->id;
            $profile->google_id = $user->google_id;
            $profile->first_name = $profile->first_name ?: ($user->first_name ?: 'User');
            $profile->middle_initial = $profile->middle_initial ?: $user->middle_initial;
            $profile->last_name = $profile->last_name ?: ($user->last_name ?: '');
            $profile->suffix = $profile->suffix ?: $user->suffix;
            $profile->fullname = $profile->fullname ?: ($user->fullname ?: 'User');
            if ($user->archived_at) {
                $profile->archived_at = $user->archived_at;
            }
            $profile->save();
        }

        DB::statement('CREATE TABLE users_v2 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            email_verified_at DATETIME,
            created_at DATETIME,
            updated_at DATETIME
        )');

        DB::statement('INSERT INTO users_v2 (id, username, email, password, email_verified_at, created_at, updated_at)
            SELECT id, username, email, password, email_verified_at, created_at, updated_at FROM users');

        DB::statement('DROP TABLE users');
        DB::statement('ALTER TABLE users_v2 RENAME TO users');
    }

    public function down()
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            $this->downSqlite();
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->string('first_name');
                $table->string('middle_initial', 10)->nullable();
                $table->string('last_name');
                $table->string('suffix', 20)->nullable();
                $table->string('fullname');
                $table->string('google_id')->nullable()->unique();
                $table->timestamp('archived_at')->nullable();
            });

            foreach (User::cursor() as $user) {
                $profile = $user->profile;
                if ($profile) {
                    $user->update([
                        'google_id' => $profile->google_id,
                        'first_name' => $profile->first_name,
                        'middle_initial' => $profile->middle_initial,
                        'last_name' => $profile->last_name,
                        'suffix' => $profile->suffix,
                        'fullname' => $profile->fullname,
                        'archived_at' => $profile->archived_at,
                    ]);
                }
            }

            Schema::table('profiles', function (Blueprint $table) {
                $table->dropColumn(['google_id', 'archived_at']);
            });
        }
    }

    protected function downSqlite()
    {
        $columns = Schema::getColumnListing('users');
        $hasMinimal = !in_array('first_name', $columns);
        if (!$hasMinimal) {
            return;
        }

        DB::statement('CREATE TABLE users_v2 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            email_verified_at DATETIME,
            fullname VARCHAR(255),
            first_name VARCHAR(255),
            middle_initial VARCHAR(10),
            last_name VARCHAR(255),
            suffix VARCHAR(20),
            google_id VARCHAR(255),
            archived_at DATETIME,
            created_at DATETIME,
            updated_at DATETIME
        )');

        DB::statement('INSERT INTO users_v2 (id, username, email, password, email_verified_at, created_at, updated_at)
            SELECT id, username, email, password, email_verified_at, created_at, updated_at FROM users');

        foreach (User::cursor() as $user) {
            $profile = $user->profile;
            if ($profile) {
                DB::table('users_v2')
                    ->where('id', $user->id)
                    ->update([
                        'google_id' => $profile->google_id,
                        'first_name' => $profile->first_name,
                        'middle_initial' => $profile->middle_initial,
                        'last_name' => $profile->last_name,
                        'suffix' => $profile->suffix,
                        'fullname' => $profile->fullname,
                        'archived_at' => $profile->archived_at,
                    ]);
            }
        }

        DB::statement('DROP TABLE users');
        DB::statement('ALTER TABLE users_v2 RENAME TO users');

        DB::statement('CREATE TABLE profiles_v2 (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            first_name VARCHAR(255) NOT NULL,
            middle_initial VARCHAR(1),
            last_name VARCHAR(255) NOT NULL,
            suffix VARCHAR(20),
            fullname VARCHAR(255) NOT NULL,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )');

        DB::statement('INSERT INTO profiles_v2 (id, user_id, first_name, middle_initial, last_name, suffix, fullname, created_at, updated_at)
            SELECT id, user_id, first_name, middle_initial, last_name, suffix, fullname, created_at, updated_at FROM profiles');

        DB::statement('DROP TABLE profiles');
        DB::statement('ALTER TABLE profiles_v2 RENAME TO profiles');
    }
};
