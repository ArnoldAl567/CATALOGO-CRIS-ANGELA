<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderQuoteRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'cliente' => ['required', 'string', 'max:80'],
            'notas' => ['nullable', 'string', 'max:450'],
            'items' => ['required', 'array', 'list', 'min:1', 'max:100'],
            'items.*' => ['required', 'array:id,choices,quantity'],
            'items.*.id' => ['required', 'string', 'max:64'],
            'items.*.choices' => ['present', 'array', 'list', 'max:10'],
            'items.*.choices.*' => ['required', 'string', 'max:120'],
            'items.*.quantity' => ['required', 'integer', 'between:1,99'],
        ];
    }

    public function messages(): array
    {
        return [
            'cliente.required' => 'Escribe tu nombre.',
            'items.required' => 'Agrega al menos un producto al carrito.',
            'items.max' => 'El pedido admite hasta 100 productos o variantes diferentes.',
            'items.*.quantity.between' => 'Elige de 1 a 99 unidades por variante.',
        ];
    }
}
