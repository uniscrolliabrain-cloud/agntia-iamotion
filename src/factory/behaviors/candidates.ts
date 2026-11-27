import { z } from 'zod';
import { expandBehavior } from './grammar.js';
import type { BehaviorContext, BehaviorSpec } from './spec.js';

const Request = z.strictObject({
  usageRole: z.string().min(1).max(120),
  evidenceIds: z.array(z.string().min(1).max(192)).min(1).max(64),
  inspectedHinge: z.string().min(1).max(192).optional(),
});
type Rule = {
  primitive: BehaviorSpec['primitive'];
  rationale: string;
  prerequisites: readonly string[];
  incompatibilities: readonly string[];
};

const rules = {
  'launcher-icon': {
    primitive: 'float', rationale: 'Presencia suave en un icono de launcher.',
    prerequisites: ['translateY'], incompatibilities: ['vista estática como única salida'],
  },
  'workflow-node': {
    primitive: 'focus', rationale: 'Énfasis cuando el nodo recibe foco.',
    prerequisites: ['scale'], incompatibilities: ['seguimiento automático del estado del negocio'],
  },
  'editorial-illustration': {
    primitive: 'reveal', rationale: 'Aparición de la ilustración editorial completa.',
    prerequisites: ['opacity'], incompatibilities: ['animación independiente de regiones sin inspección'],
  },
  'course-cover': {
    primitive: 'reveal', rationale: 'Aparición de la portada como unidad.',
    prerequisites: ['opacity'], incompatibilities: ['rotación de geometría oculta'],
  },
} satisfies Record<string, Rule>;

export function proposeMotion(input: unknown, context: BehaviorContext) {
  const parsed = Request.safeParse(input);
  if (!parsed.success) return { proposals: [], abstentions: [{ reason: 'INVALID_CANDIDATE_INPUT' }] } as const;
  const { usageRole, evidenceIds, inspectedHinge } = parsed.data;
  if (!Object.hasOwn(rules, usageRole)) return {
    proposals: [], abstentions: [{ reason: 'UNKNOWN_USAGE_ROLE' }],
  } as const;
  const rule = rules[usageRole as keyof typeof rules];
  const options: { rule: Rule; target: BehaviorSpec['target']; trigger: BehaviorSpec['trigger']; state: BehaviorSpec['state'] }[] = [
    { rule, target: { kind: 'visual' },
      trigger: rule.primitive === 'focus' ? 'focus' : 'manual',
      state: rule.primitive === 'focus' ? 'focus' : 'manual' },
  ];
  if (usageRole === 'launcher-icon' && inspectedHinge) {
    options.push({
      rule: {
        primitive: 'fold', rationale: 'Apertura sobre una bisagra anotada.',
        prerequisites: ['inspected hinges', 'rotateX'], incompatibilities: ['imagen plana sin piezas separables'],
      },
      target: { kind: 'part', partId: inspectedHinge }, trigger: 'manual', state: 'manual',
    });
  }
  const proposals = [];
  const abstentions = [];
  for (const [index, option] of options.entries()) {
    const { primitive, rationale, prerequisites, incompatibilities } = option.rule;
    const validation = expandBehavior({
      schemaVersion: 1, behaviorId: `${usageRole}:${primitive}`, visualId: context.visualId,
      target: option.target, primitive, trigger: option.trigger, state: option.state,
      intensity: 0.5, durationMs: 500, loop: false, bounds: { maxDurationMs: 500 },
      reducedMotion: { kind: 'static', at: primitive === 'reveal' ? 1 : 0 },
      evidenceIds, status: 'proposed',
    }, context);
    if (!validation.ok) {
      abstentions.push({ primitive, reason: validation.code });
      continue;
    }
    proposals.push({ rank: index + 1, spec: validation.spec, rationale, prerequisites, incompatibilities });
  }
  return { proposals, abstentions };
}
