<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BudgetPlanItem extends Model
{
    protected $fillable = [
        'budget_plan_id', 'name', 'category', 'type', 'notes', 'amount', 'date', 'archived',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'datetime',
        'archived' => 'boolean',
    ];

    public function budgetPlan(): BelongsTo
    {
        return $this->belongsTo(BudgetPlan::class);
    }
}
