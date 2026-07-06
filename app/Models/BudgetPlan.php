<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BudgetPlan extends Model
{
    protected $fillable = [
        'user_id', 'name', 'budget', 'year', 'month', 'day', 'box_color', 'text_color',
    ];

    protected $casts = [
        'budget' => 'decimal:2',
        'year' => 'integer',
        'month' => 'integer',
        'day' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(BudgetPlanItem::class);
    }
}
