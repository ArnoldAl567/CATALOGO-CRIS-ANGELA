<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('name');
            $table->string('image');
            $table->string('theme');
            $table->string('caption');
            $table->unsignedSmallInteger('position')->index();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->string('id', 64)->primary();
            $table->string('category_id', 64);
            $table->foreign('category_id')->references('id')->on('categories')->restrictOnDelete();
            $table->string('name');
            $table->unsignedInteger('price_cents');
            $table->text('description');
            $table->jsonb('features');
            $table->jsonb('options');
            $table->jsonb('images');
            $table->boolean('sold_by_unit');
            $table->boolean('featured')->default(false);
            $table->unsignedSmallInteger('position');
            $table->index(['category_id', 'position']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
        Schema::dropIfExists('categories');
    }
};
