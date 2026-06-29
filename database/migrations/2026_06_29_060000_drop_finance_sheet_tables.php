<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('finance_sheet_rows');
        Schema::dropIfExists('finance_sheet_columns');
        Schema::dropIfExists('finance_sheets');
    }

    public function down(): void
    {
        // Data already migrated to dedicated tables; no rollback
    }
};
