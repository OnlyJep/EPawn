<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('first_name');
            $table->string('middle_initial', 1)->nullable();
            $table->string('last_name');
            $table->string('suffix', 20)->nullable();
            $table->string('fullname');
            $table->timestamps();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('type');
            $table->string('icon')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'name']);
        });

        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->decimal('initial_balance', 15, 2)->default(0);
            $table->decimal('balance', 15, 2)->default(0);
            $table->string('icon')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'name']);
        });

        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type');
            $table->decimal('amount', 15, 2);
            $table->text('description')->nullable();
            $table->date('date');
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'date']);
            $table->index(['user_id', 'archived_at']);
        });

        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('limit_amount', 15, 2);
            $table->string('period')->default('monthly');
            $table->timestamps();
            $table->unique(['user_id', 'category_id']);
        });

        if (Schema::hasTable('finance_sheets')) {
            foreach (User::all() as $user) {
                $profileData = [
                    'user_id' => $user->id,
                    'first_name' => $user->first_name ?: 'User',
                    'middle_initial' => $user->middle_initial,
                    'last_name' => $user->last_name ?: '',
                    'suffix' => $user->suffix,
                    'fullname' => $user->fullname ?: ($user->first_name ?: 'User'),
                ];
                DB::table('profiles')->insert($profileData);

                $sheetRows = DB::table('finance_sheets')->where('user_id', $user->id)->whereNull('archived_at')->get();
                $sheetMap = [];
                foreach ($sheetRows as $sheet) {
                    $sheetMap[$sheet->name] = $sheet;
                }

                if (isset($sheetMap['Categories'])) {
                    $sheet = $sheetMap['Categories'];
                    $columns = DB::table('finance_sheet_columns')->where('finance_sheet_id', $sheet->id)->get();
                    $nameCol = $columns->firstWhere('name', 'Category Name');
                    $typeCol = $columns->firstWhere('name', 'Type');
                    if ($nameCol && $typeCol) {
                        $nameKey = $nameCol->column_key;
                        $typeKey = $typeCol->column_key;
                        $rows = DB::table('finance_sheet_rows')->where('finance_sheet_id', $sheet->id)->whereNull('archived_at')->get();
                        foreach ($rows as $row) {
                            $data = json_decode($row->data, true) ?: [];
                            $catName = trim((string)($data[$nameKey] ?? ''));
                            $catType = strtolower(trim((string)($data[$typeKey] ?? 'expense')));
                            if ($catName) {
                                DB::table('categories')->insert([
                                    'user_id' => $user->id,
                                    'name' => $catName,
                                    'type' => in_array($catType, ['income', 'expense']) ? $catType : 'expense',
                                    'sort_order' => 0,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                            }
                        }
                    }
                }

                if (isset($sheetMap['Accounts'])) {
                    $sheet = $sheetMap['Accounts'];
                    $columns = DB::table('finance_sheet_columns')->where('finance_sheet_id', $sheet->id)->get();
                    $nameCol = $columns->firstWhere('name', 'Account Name');
                    $initCol = $columns->firstWhere('name', 'Initial Amount');
                    $balCol = $columns->firstWhere('name', 'Balance');
                    $iconCol = $columns->firstWhere('name', 'Icon');
                    if ($nameCol && $initCol && $balCol) {
                        $nameKey = $nameCol->column_key;
                        $initKey = $initCol->column_key;
                        $balKey = $balCol->column_key;
                        $iconKey = $iconCol ? $iconCol->column_key : null;
                        $rows = DB::table('finance_sheet_rows')->where('finance_sheet_id', $sheet->id)->whereNull('archived_at')->get();
                        foreach ($rows as $row) {
                            $data = json_decode($row->data, true) ?: [];
                            $accName = trim((string)($data[$nameKey] ?? ''));
                            if ($accName) {
                                DB::table('accounts')->insert([
                                    'user_id' => $user->id,
                                    'name' => $accName,
                                    'initial_balance' => (float)($data[$initKey] ?? 0),
                                    'balance' => (float)($data[$balKey] ?? 0),
                                    'icon' => $iconKey ? ($data[$iconKey] ?? null) : null,
                                    'sort_order' => 0,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                            }
                        }
                    }
                }

                if (isset($sheetMap['Records'])) {
                    $sheet = $sheetMap['Records'];
                    $columns = DB::table('finance_sheet_columns')->where('finance_sheet_id', $sheet->id)->get();
                    $dateCol = $columns->firstWhere('name', 'Date');
                    $descCol = $columns->firstWhere('name', 'Description');
                    $catCol = $columns->firstWhere('name', 'Category');
                    $accCol = $columns->firstWhere('name', 'Account');
                    $amtCol = $columns->firstWhere('name', 'Amount');
                    $typeCol = $columns->firstWhere('name', 'Type');
                    if ($dateCol && $amtCol && $typeCol) {
                        $dateKey = $dateCol->column_key;
                        $descKey = $descCol ? $descCol->column_key : null;
                        $catKey = $catCol ? $catCol->column_key : null;
                        $accKey = $accCol ? $accCol->column_key : null;
                        $amtKey = $amtCol->column_key;
                        $typeKey = $typeCol->column_key;
                        $rows = DB::table('finance_sheet_rows')->where('finance_sheet_id', $sheet->id)->whereNull('archived_at')->get();
                        foreach ($rows as $row) {
                            $data = json_decode($row->data, true) ?: [];
                            $recType = strtolower(trim((string)($data[$typeKey] ?? 'expense')));
                            if (!in_array($recType, ['income', 'expense', 'transfer'])) {
                                $recType = 'expense';
                            }
                            $recDate = trim((string)($data[$dateKey] ?? now()->toDateString()));
                            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $recDate)) {
                                $recAmt = (float)($data[$amtKey] ?? 0);
                                $recAccName = $accKey ? trim((string)($data[$accKey] ?? '')) : '';
                                $recCatName = $catKey ? trim((string)($data[$catKey] ?? '')) : '';
                                $accId = null;
                                $catId = null;
                                if ($recAccName) {
                                    $foundAcc = DB::table('accounts')->where('user_id', $user->id)->where('name', $recAccName)->first();
                                    if ($foundAcc) $accId = $foundAcc->id;
                                }
                                if ($recCatName) {
                                    $foundCat = DB::table('categories')->where('user_id', $user->id)->where('name', $recCatName)->first();
                                    if ($foundCat) $catId = $foundCat->id;
                                }
                                DB::table('transactions')->insert([
                                    'user_id' => $user->id,
                                    'account_id' => $accId,
                                    'category_id' => $catId,
                                    'type' => $recType,
                                    'amount' => $recAmt,
                                    'description' => $descKey ? trim((string)($data[$descKey] ?? '')) : null,
                                    'date' => $recDate,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                            }
                        }
                    }
                }

                if (isset($sheetMap['Budget'])) {
                    $sheet = $sheetMap['Budget'];
                    $columns = DB::table('finance_sheet_columns')->where('finance_sheet_id', $sheet->id)->get();
                    $catCol = $columns->firstWhere('name', 'Category');
                    $limCol = $columns->firstWhere('name', 'Limit');
                    if ($catCol && $limCol) {
                        $catKey = $catCol->column_key;
                        $limKey = $limCol->column_key;
                        $rows = DB::table('finance_sheet_rows')->where('finance_sheet_id', $sheet->id)->whereNull('archived_at')->get();
                        foreach ($rows as $row) {
                            $data = json_decode($row->data, true) ?: [];
                            $budCatName = trim((string)($data[$catKey] ?? ''));
                            $budLimit = (float)($data[$limKey] ?? 0);
                            if ($budCatName && $budLimit > 0) {
                                $foundCat = DB::table('categories')->where('user_id', $user->id)->where('name', $budCatName)->first();
                                DB::table('budgets')->insert([
                                    'user_id' => $user->id,
                                    'category_id' => $foundCat ? $foundCat->id : null,
                                    'limit_amount' => $budLimit,
                                    'period' => 'monthly',
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                            }
                        }
                    }
                }
            }
        }
    }

    public function down()
    {
        Schema::dropIfExists('budgets');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('accounts');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('profiles');
    }
};
