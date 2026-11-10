import '@angular/compiler';
import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { Subject } from 'rxjs';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

// Exercise the real Angular service without adding a browser test dependency.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
for (const source of ['core/catalog.api', 'cart/cart.store']) {
  const destination = resolve(root, '.test-build', source + '.mjs');
  mkdirSync(dirname(destination), { recursive: true });
  const compiled = ts.transpileModule(readFileSync(resolve(root, 'src/app', source + '.ts'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, experimentalDecorators: true },
  }).outputText.replace(/from '([.][^']+)'/g, "from '$1.mjs'");
  writeFileSync(destination, compiled);
}
const { CatalogApi } = await import('../.test-build/core/catalog.api.mjs');
const { CartStore } = await import('../.test-build/cart/cart.store.mjs');
const key = 'cris-angela/carrito/v1';
const catalog = JSON.parse(readFileSync(resolve(root, '../backend/database/data/catalogo.json'), 'utf8'));
const first = catalog.productos.find(product => product.id === 'a01');
const last = catalog.productos.find(product => product.id === 'p07');

function setup(items = []) {
  const memory = new Map([[key, JSON.stringify(items)]]);
  globalThis.localStorage = { getItem: name => memory.get(name) ?? null, setItem: (name, value) => memory.set(name, value) };
  const requests = [];
  const api = { getSelection: ids => { const result = new Subject(); requests.push({ ids, result }); return result; } };
  const injector = createEnvironmentInjector([{ provide: CatalogApi, useValue: api }]);
  const store = runInInjectionContext(injector, () => new CartStore());
  store.initialize({ ...catalog, productos: [first] });
  return { store, requests, memory };
}

test('restores only cart IDs, including products absent from the home selection', () => {
  const { store, requests } = setup([{ id: last.id, choices: ['Lady capybara'], quantity: 2 }]);
  store.restore();
  assert.deepEqual(requests[0].ids, ['p07']);
  assert.equal(store.restoring(), true);
  requests[0].result.next({ productos: [last] });
  assert.equal(store.count(), 2);
  assert.equal(store.total(), 2400);
  assert.equal(store.lines()[0].variant, 'Modelo: Lady capybara');
});

test('adding a product from another page during restoration preserves both items', () => {
  const { store, requests } = setup([{ id: last.id, choices: ['Lady capybara'], quantity: 1 }]);
  store.restore();
  store.add(first, []);
  requests[0].result.next({ productos: [last] });
  assert.equal(store.count(), 2);
  assert.deepEqual(store.lines().map(line => line.id), ['p07', 'a01']);
  store.initialize({ ...catalog, productos: [first] });
  assert.equal(store.count(), 2);
});

test('invalid stored variants and deleted products are discarded safely', () => {
  const { store, requests } = setup([
    { id: first.id, choices: ['invalid'], quantity: 1 },
    { id: 'removed', choices: [], quantity: 1 },
  ]);
  store.restore();
  assert.deepEqual(store.lines(), []);
  requests[0].result.next({ productos: [first] });
  assert.equal(store.count(), 0);
});

test('a failed restoration can be retried without losing the saved cart', () => {
  const { store, requests, memory } = setup([{ id: last.id, choices: ['Lady capybara'], quantity: 1 }]);
  store.restore();
  requests[0].result.error(new Error('offline'));
  assert.equal(store.restoreError(), true);
  assert.equal(JSON.parse(memory.get(key))[0].id, last.id);
  store.restore();
  requests[1].result.next({ productos: [last] });
  assert.equal(store.restoreError(), false);
  assert.equal(store.lines().length, 1);
});
