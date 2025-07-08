import { DefenseModule, AttackModule, simulateRound } from '../src/main.js';

test('simulateRound adjusts defense level', () => {
  const d = new DefenseModule('PoW', 1, 1, 'FastNonce');
  const a = new AttackModule('FastNonce', 'PoW', 1, 1); // always succeeds
  const result = simulateRound([d], [a]);
  expect(result.success).toBe(true);
  expect(d.level).toBe(1); // weaken then not below 1
});
