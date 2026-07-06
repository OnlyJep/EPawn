<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('budget_plans', function (Blueprint $table) {
            $table->string('box_color', 20)->nullable()->after('day');
            $table->string('text_color', 20)->nullable()->after('box_color');
        });
    }

    public function down()
    {
        Schema::table('budget_plans', function (Blueprint $table) {
            $table->dropColumn('box_color');
            $table->dropColumn('text_color');
        });
    }
};
