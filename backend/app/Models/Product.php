<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id', 'category_id', 'name', 'price_cents', 'description', 'features', 'options',
        'images', 'sold_by_unit', 'featured', 'position',
    ];

    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'features' => 'array',
            'options' => 'array',
            'images' => 'array',
            'sold_by_unit' => 'boolean',
            'featured' => 'boolean',
        ];
    }
}
