<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('finance_sheet_columns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('finance_sheet_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('column_key');
            $table->string('column_type')->default('currency');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['finance_sheet_id', 'column_key']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('finance_sheet_columns');
    }
};
