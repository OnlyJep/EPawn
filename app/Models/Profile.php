<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    protected $fillable = [
        'user_id',
        'first_name',
        'middle_initial',
        'last_name',
        'suffix',
        'fullname',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}