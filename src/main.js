class DefenseModule {
  constructor(name, level = 1, energyCost = 1, vulnerableTo = '') {
    this.name = name;
    this.level = level;
    this.energyCost = energyCost;
    this.vulnerableTo = vulnerableTo;
  }
  strengthen() {
    this.level += 1;
  }
  weaken() {
    if (this.level > 1) this.level -= 1;
  }
}

class AttackModule {
  constructor(name, target, successRate = 0.5, cost = 1) {
    this.name = name;
    this.target = target;
    this.successRate = successRate;
    this.cost = cost;
  }
}

class Block {
  constructor(defense, attack) {
    this.defense = defense;
    this.attack = attack;
    this.success = false;
  }
  resolve() {
    if (this.attack.target === this.defense.name) {
      const rate = this.attack.successRate * (1 / this.defense.level);
      this.success = Math.random() < rate;
    } else {
      this.success = false;
    }
    if (this.success) {
      this.defense.weaken();
    } else {
      this.defense.strengthen();
    }
  }
}

function simulateRound(defenses, attacks) {
  const defense = defenses[Math.floor(Math.random() * defenses.length)];
  const attack = attacks.find(a => a.target === defense.name) || attacks[Math.floor(Math.random() * attacks.length)];
  const block = new Block(defense, attack);
  block.resolve();
  return {
    defense: defense.name,
    level: defense.level,
    attack: attack.name,
    success: block.success
  };
}

export { DefenseModule, AttackModule, Block, simulateRound };
