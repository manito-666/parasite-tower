package combat

import "parasite-tower/internal/entity"

type CombatResult struct {
	PlayerDamage int
	MonsterKilled bool
	TurnsToKill  int
}

func PredictCombat(p *entity.Player, m *entity.Monster) *CombatResult {
	pAtk := p.ATK
	pDef := p.DEF
	mAtk := m.ATK
	mDef := m.DEF

	if p.HasTrait(entity.TraitArmorBreak) {
		mDef = mDef / 2
	}
	if p.HasTrait(entity.TraitSharpClaw) {
		pAtk += 6
	}
	if p.HasTrait(entity.TraitThickSkin) {
		pDef += 8
	}

	playerDmg := pAtk - mDef
	if playerDmg < 1 {
		playerDmg = 1
	}

	monsterDmg := mAtk - pDef
	if monsterDmg < 1 {
		monsterDmg = 1
	}

	if p.HasTrait(entity.TraitGhost) {
		monsterDmg = monsterDmg * 7 / 10
	}

	turnsToKill := (m.HP + playerDmg - 1) / playerDmg
	totalDamage := monsterDmg * (turnsToKill - 1)
	if totalDamage < 0 {
		totalDamage = 0
	}

	return &CombatResult{
		PlayerDamage:  totalDamage,
		MonsterKilled: true,
		TurnsToKill:   turnsToKill,
	}
}

func ExecuteCombat(p *entity.Player, m *entity.Monster) *CombatResult {
	result := PredictCombat(p, m)

	p.TakeDamage(result.PlayerDamage)
	m.TakeDamage(m.HP)

	if p.HasTrait(entity.TraitBloodlust) {
		heal := p.MaxHP * 15 / 100
		p.Heal(heal)
	}

	if p.HasTrait(entity.TraitVampire) {
		heal := result.PlayerDamage * 30 / 100
		p.Heal(heal)
	}

	return result
}
