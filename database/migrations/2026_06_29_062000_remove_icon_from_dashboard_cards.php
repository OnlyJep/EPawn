<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('dashboard_cards', 'icon')) {
            $driver = DB::connection()->getDriverName();
            if ($driver === 'sqlite') {
                DB::statement('ALTER TABLE dashboard_cards DROP COLUMN icon');
            } else {
                DB::statement('ALTER TABLE dashboard_cards DROP COLUMN `icon`');
            }
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('dashboard_cards', 'icon')) {
            DB::statement('ALTER TABLE dashboard_cards ADD COLUMN icon VARCHAR(100) NULL');
        }
    }
};
