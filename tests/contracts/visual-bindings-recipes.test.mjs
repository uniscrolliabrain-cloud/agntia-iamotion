import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compileParticleRecipe, createVisualBinding, loadParticleRecipes, ParticleField } from '../../dist/index.js';

const base = { schemaVersion: 1, label: 'Fixture', seed: 55, capacity: 40 };
const recipes = [
  { ...base, id: 'ambient', kind: 'ambient' },
  { ...base, id: 'flow', kind: 'flow', heading: 'right' },
  { ...base, id: 'attract', kind: 'attraction', intensity: 550 },
];

test('compiles declared recipes through allowed Canvas capabilities and replays their initial state', () => {
  const index = loadParticleRecipes(recipes);
  const samples = recipes.map(({ id }) => {
    const result = compileParticleRecipe(index, id, new Set(['canvas2d']));
    assert.equal(result.ok, true);
    const field = new ParticleField(result.spec);
    field.advance(result.initialTicks);
    return field.sample();
  });
  assert.equal(samples[0].length, 40);
  assert.notDeepEqual(samples[0], samples[1]);
  assert.notDeepEqual(samples[1], samples[2]);
  assert.equal(compileParticleRecipe(index, 'missing', new Set(['canvas2d'])).code, 'UNKNOWN_PARTICLE_RECIPE');
  assert.equal(compileParticleRecipe(index, 'flow', new Set()).code, 'PARTICLE_RENDERER_UNSUPPORTED');
  assert.throws(() => loadParticleRecipes([...recipes, recipes[0]]), /DUPLICATE_PARTICLE_RECIPE/u);
});

test('coalesces scoped host snapshots, rejects stale revisions and preserves the synthetic label', () => {
  const grant = { scope: 'fixture', bindingId: 'field', allowedRecipes: ['ambient', 'flow'], synthetic: true };
  const binding = createVisualBinding(grant);
  const base = { schemaVersion: 1, scope: grant.scope, bindingId: grant.bindingId,
    recipeId: 'ambient', revision: 1, state: 'ready', synthetic: true };
  assert.equal(binding.accept({ ...base, scope: 'other' }).code, 'BINDING_SCOPE_DENIED');
  assert.equal(binding.accept({ ...base, synthetic: false }).code, 'BINDING_SCOPE_DENIED');
  assert.equal(binding.accept({ ...base, recipeId: 'attract' }).code, 'BINDING_SCOPE_DENIED');
  assert.equal(binding.accept(base).ok, true);
  assert.equal(binding.accept({ ...base, revision: 3, recipeId: 'flow', state: 'running' }).ok, true);
  assert.equal(binding.accept({ ...base, revision: 2 }).code, 'BINDING_STALE_REVISION');
  assert.equal(binding.flush().revision, 3);
  assert.equal(binding.flush(), undefined);
  binding.snapshot().recipeId = 'tampered';
  assert.equal(binding.snapshot().recipeId, 'flow');
  binding.dispose();
  assert.equal(binding.accept({ ...base, revision: 4 }).code, 'BINDING_DISPOSED');
});
