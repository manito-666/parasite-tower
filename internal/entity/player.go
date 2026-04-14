package entity

type Player struct {
	Name       string
	HP         int
	MaxHP      int
	ATK        int
	DEF        int
	Gold       int
	Traits     []Trait
	Pollution  int
	EvoPoints  int
	PosX       int
	PosY       int
	Possessed  map[string]bool
	Fragments  map[string]bool
}

func NewPlayer(name string) *Player {
	return &Player{
		Name:      name,
		HP:        100,
		MaxHP:     100,
		ATK:       5,
		DEF:       2,
		Gold:      0,
		Traits:    []Trait{},
		Pollution: 0,
		EvoPoints: 0,
		PosX:      6,
		PosY:      6,
		Possessed: make(map[string]bool),
		Fragments: make(map[string]bool),
	}
}

func (p *Player) AddTrait(t Trait) {
	if len(p.Traits) >= 4 {
		return
	}
	for _, existing := range p.Traits {
		if existing == t {
			return
		}
	}
	p.Traits = append(p.Traits, t)
}

func (p *Player) HasTrait(t Trait) bool {
	for _, trait := range p.Traits {
		if trait == t {
			return true
		}
	}
	return false
}

func (p *Player) TakeDamage(dmg int) {
	p.HP -= dmg
	if p.HP < 0 {
		p.HP = 0
	}
}

func (p *Player) Heal(amount int) {
	p.HP += amount
	if p.HP > p.MaxHP {
		p.HP = p.MaxHP
	}
}
