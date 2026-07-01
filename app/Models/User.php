<?php

namespace App\Models;

use App\Notifications\VerifyEmail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'username',
        'email',
        'password',
        'email_verified_at',
    ];

    protected $hidden = [
        'password',
    ];

    protected $appends = [
        'display_name',
        'has_password',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function isAdmin(): bool
    {
        return $this->username === 'admin';
    }

    public static function buildFullName(
        string $firstName,
        ?string $middleInitial,
        string $lastName,
        ?string $suffix = null
    ): string {
        $parts = [$firstName];

        if ($middleInitial) {
            $parts[] = rtrim($middleInitial, '.').'.';
        }

        $parts[] = $lastName;

        if ($suffix) {
            $parts[] = $suffix;
        }

        return trim(preg_replace('/\s+/', ' ', implode(' ', $parts)));
    }

    public function getDisplayNameAttribute(): string
    {
        return $this->profile?->fullname ?: $this->username ?: 'User';
    }

    public function getHasPasswordAttribute(): bool
    {
        return $this->password !== null && $this->profile?->google_id === null;
    }

    public function sendEmailVerificationNotification()
    {
        $this->notify(new VerifyEmail());
    }

    public function profile()
    {
        return $this->hasOne(Profile::class);
    }

    public function accounts()
    {
        return $this->hasMany(Account::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function budgets()
    {
        return $this->hasMany(Budget::class);
    }

    public function dashboardCards()
    {
        return $this->hasMany(DashboardCard::class);
    }

    public function budgetPlans()
    {
        return $this->hasMany(BudgetPlan::class);
    }
}
