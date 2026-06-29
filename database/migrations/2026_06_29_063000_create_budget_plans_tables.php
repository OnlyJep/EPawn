<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('budget_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->decimal('budget', 15, 2)->default(0);
            $table->integer('year');
            $table->integer('month');
            $table->integer('day')->default(1);
            $table->timestamps();
            $table->index(['user_id', 'year', 'month']);
        });

        Schema::create('budget_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('budget_plan_id')->constrained('budget_plans')->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('category')->nullable();
            $table->string('type')->default('Expense');
            $table->text('notes')->nullable();
            $table->decimal('amount', 15, 2)->default(0);
            $table->dateTime('date');
            $table->boolean('archived')->default(false);
            $table->timestamps();
            $table->index(['budget_plan_id', 'archived']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('budget_plan_items');
        Schema::dropIfExists('budget_plans');
    }
};
