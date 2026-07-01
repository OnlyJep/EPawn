<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        DB::statement('ALTER TABLE profiles DROP PRIMARY KEY');
        DB::statement('ALTER TABLE profiles MODIFY id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY');
    }

    public function down()
    {
        DB::statement('ALTER TABLE profiles DROP PRIMARY KEY');
        DB::statement('ALTER TABLE profiles MODIFY id BIGINT UNSIGNED PRIMARY KEY');
    }
};
