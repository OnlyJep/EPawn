<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeletionReason extends Model
{
    protected $fillable = [
        'email',
        'reason',
    ];
}
