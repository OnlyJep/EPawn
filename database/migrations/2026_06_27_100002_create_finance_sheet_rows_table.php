<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('finance_sheet_rows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('finance_sheet_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('row_number');
            $table->json('data');
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();

            $table->index(['finance_sheet_id', 'archived_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('finance_sheet_rows');
    }
};
