import { defineConfig } from 'vite';
import { composeBehaviors, expandBehavior } from '../../src/factory/behaviors/grammar.ts';

function createFloat() {
  const visualId = 'v_9d7cbaa0-c4c9-4f0e-a193-a97ad9f812c3';
  const context = { visualId, partIds: new Set(), properties: new Set(['translateY']) };
  const primitive = expandBehavior({
    schemaVersion: 1, behaviorId: 'demo-float', visualId, target: { kind: 'visual' },
    primitive: 'float', trigger: 'manual', state: 'manual', intensity: 1, durationMs: 900, loop: false,
    reducedMotion: { kind: 'static', at: 0 }, bounds: { maxDurationMs: 900 },
    evidenceIds: [], status: 'proposed',
  }, context);
  if (!primitive.ok) throw new Error(primitive.code);
  const result = composeBehaviors({ mode: 'serial', clips: [{ spec: primitive.spec }] }, context);
  if (!result.ok) throw new Error(result.code);
  return result.timeline;
}

const virtualId = 'virtual:ui-lab-float-timeline';
const internalId = '\0' + virtualId;
export default defineConfig({
  plugins: [{
    name: 'ui-lab-validated-timeline',
    resolveId(id) { return id === virtualId ? internalId : undefined; },
    load(id) {
      if (id === internalId) return 'export default ' + JSON.stringify(createFloat());
    },
  }],
});
