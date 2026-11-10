<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Validation\ValidationException;

class OrderQuoteService
{
    public function quote(array $order): array
    {
        $products = Product::query()->whereKey(array_column($order['items'], 'id'))->get()->keyBy('id');
        $lines = [];
        $seen = [];
        $total = 0;

        foreach ($order['items'] as $item) {
            $product = $products->get($item['id']);
            if (! $product) {
                throw ValidationException::withMessages(['items' => 'Un producto ya no figura en el catálogo.']);
            }

            $variant = $this->variant($product, $item['choices']);
            $key = json_encode([$product->id, $item['choices']], JSON_THROW_ON_ERROR);
            if (isset($seen[$key])) {
                throw ValidationException::withMessages(['items' => 'El pedido contiene una variante duplicada.']);
            }
            $seen[$key] = true;

            $subtotal = $product->price_cents * $item['quantity'];
            $total += $subtotal;
            $name = $product->name.($variant === '' ? '' : " ($variant)");
            $lines[] = '• '.$item['quantity'].' × '.$name.' | '.$this->price($product->price_cents).' c/u = '.$this->price($subtotal);
        }

        $message = implode("\n", [
            'Hola, '.config('store.name').'. Quisiera coordinar este pedido.',
            'Cliente: '.$order['cliente'],
            '',
            ...$lines,
            '',
            'Subtotal: '.$this->price($total),
            'Total de productos: '.$this->price($total),
        ]);

        if (isset($order['notas']) && $order['notas'] !== '') {
            $message .= "\n\nNotas: ".$order['notas'];
        }

        return [
            'subtotal' => $total,
            'total' => $total,
            'whatsapp' => 'https://wa.me/'.config('store.whatsapp').'?text='.rawurlencode($message),
        ];
    }

    private function variant(Product $product, array $choices): string
    {
        $groups = $product->options;
        if (count($groups) !== count($choices)) {
            throw ValidationException::withMessages(['items' => "Selecciona las variantes de {$product->name}."]);
        }

        $selected = [];
        foreach ($groups as $index => $group) {
            if (! in_array($choices[$index], $group['valores'], true)) {
                throw ValidationException::withMessages(['items' => "Revisa las variantes de {$product->name}."]);
            }
            $selected[] = $group['nombre'].': '.$choices[$index];
        }

        return implode(' · ', $selected);
    }

    private function price(int $cents): string
    {
        return 'S/ '.number_format($cents / 100, 2, '.', '');
    }
}
