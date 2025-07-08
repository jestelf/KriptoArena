/******************************************************************
 * модель: real-looking formulas                                  *
 ******************************************************************/
class DefenseModule {
  constructor(name, baseBits, level = 1, vulnerableTo = '') {
    Object.assign(this, { name, baseBits, level, vulnerableTo });
  }
  get bits() { return this.baseBits + (this.level - 1) * 32; }
  strengthen() { this.level += 1; }
  weaken()     { if (this.level > 1) this.level -= 1; }
}

class AttackModule {
  constructor(name, target, type, power = 1) {
    Object.assign(this, { name, target, type, power });
    this.skill = 1;
  }
  successChance(def) {
    if (def.name !== this.target) return 0;
    const q = 1e6 * this.power * this.skill;
    switch (this.type) {
      case 'collision': return Math.min((q * q) / 2 ** (def.bits + 1), 1);
      case 'pow':       return Math.min(q / 2 ** def.bits, 1);
      case 'forgery':   return Math.min(q / 2 ** def.bits, 1);
      default:          return 0;
    }
  }
  learn(ok) { this.skill = ok ? this.skill + 0.05
                              : Math.max(1, this.skill - 0.02); }
}

class Block {
  constructor(def, atk) { Object.assign(this, { def, atk }); }
  resolve() {
    const p       = this.atk.successChance(this.def);
    const success = Math.random() < p;
    success ? this.def.weaken() : this.def.strengthen();
    this.atk.learn(success);
    return { success, chance: p };
  }
}

export { DefenseModule, AttackModule, Block };
