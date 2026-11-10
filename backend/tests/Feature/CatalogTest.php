<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_returns_only_a_bounded_selection(): void
    {
        $this->seed();
        $this->seed();

        $this->getJson('/api/catalogo')
            ->assertOk()
            ->assertJsonCount(5, 'categorias')
            ->assertJsonCount(5, 'productos')
            ->assertJsonCount(4, 'destacados');
        $this->assertDatabaseCount('products', 47);
    }

    public function test_pagination_covers_the_catalog_once_in_stable_order(): void
    {
        $this->seed();
        $ids = [];
        foreach ([1 => 12, 2 => 12, 3 => 12, 4 => 11] as $page => $count) {
            $response = $this->getJson('/api/productos?page='.$page)->assertOk()
                ->assertJsonCount($count, 'productos')->assertJsonPath('total', 47)
                ->assertJsonPath('pagina', $page)->assertJsonPath('paginas', 4);
            $ids = array_merge($ids, array_column($response->json('productos'), 'id'));
        }
        $this->assertCount(47, array_unique($ids));
        $this->assertSame('a01', $ids[0]);
        $this->assertSame('p07', $ids[46]);
        $this->getJson('/api/productos?page=999')->assertOk()->assertJsonPath('pagina', 4);
    }

    public function test_filters_search_and_sort_are_applied_before_pagination(): void
    {
        $this->seed();
        $this->getJson('/api/productos?categoria=peluches&max=1200&orden=asc')
            ->assertOk()->assertJsonPath('total', 4)->assertJsonPath('productos.0.id', 'p04');
        $this->getJson('/api/productos?q=trebol')->assertOk()->assertJsonPath('total', 2);
        $this->getJson('/api/productos?q='.urlencode('TRÉBOL'))->assertOk()->assertJsonPath('total', 2);
        $this->getJson('/api/productos?q='.urlencode('%'))->assertOk()->assertJsonPath('total', 0);
        $prices = $this->getJson('/api/productos?orden=desc')->assertOk()->json('productos');
        $prices = array_column($prices, 'precio');
        $expected = $prices;
        rsort($expected);
        $this->assertSame($expected, $prices);
        $this->getJson('/api/productos?page=-1')->assertUnprocessable();
        $this->getJson('/api/productos?orden=invalid')->assertUnprocessable();
    }

    public function test_large_catalog_keeps_home_and_pages_small_and_can_restore_specific_cart_products(): void
    {
        $this->seed();
        $source = Product::findOrFail('a01');
        $rows = [];
        for ($i = 0; $i < 1000; $i++) {
            $row = $source->getAttributes();
            $row['id'] = 'scale-test-'.$i;
            $row['featured'] = true;
            $rows[] = $row;
        }
        foreach (array_chunk($rows, 50) as $chunk) Product::query()->insert($chunk);
        $home = $this->getJson('/api/catalogo')->assertOk()->assertJsonCount(4, 'destacados');
        $this->assertLessThanOrEqual(6, count($home->json('productos')));
        $this->getJson('/api/productos?page=60')->assertOk()->assertJsonCount(12, 'productos')
            ->assertJsonPath('total', 1047)->assertJsonPath('pagina', 60);
        $this->getJson('/api/productos/seleccion?ids[]=p07&ids[]=a09')->assertOk()->assertJsonCount(2, 'productos');
        $this->getJson('/api/productos/seleccion?ids[]=missing')->assertOk()->assertJsonCount(0, 'productos');
    }

    public function test_quote_reads_the_current_price_and_includes_the_selected_variant(): void
    {
        $this->seed();
        Product::query()->whereKey('p07')->update(['price_cents' => 1230]);

        $response = $this->postJson('/api/pedidos/cotizar', [
            'cliente' => 'Cliente de prueba',
            'notas' => 'Una nota',
            'items' => [['id' => 'p07', 'choices' => ['Lady capybara'], 'quantity' => 2]],
        ])->assertOk()->assertJsonPath('total', 2460);

        parse_str(parse_url($response->json('whatsapp'), PHP_URL_QUERY), $query);
        $this->assertStringContainsString('Modelo: Lady capybara', $query['text']);
        $this->assertStringContainsString('S/ 12.30 c/u = S/ 24.60', $query['text']);
        $this->assertStringContainsString('Notas: Una nota', $query['text']);
    }

    public function test_quote_rejects_an_unknown_variant_and_client_supplied_prices(): void
    {
        $this->seed();

        $this->postJson('/api/pedidos/cotizar', [
            'cliente' => 'Cliente de prueba',
            'items' => [['id' => 'p07', 'choices' => ['Variante inexistente'], 'quantity' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items');

        $this->postJson('/api/pedidos/cotizar', [
            'cliente' => 'Cliente de prueba',
            'items' => [['id' => 'p07', 'choices' => ['Lady capybara'], 'quantity' => 1, 'precio' => 1]],
        ])->assertUnprocessable()->assertJsonValidationErrors('items.0');
    }
}
