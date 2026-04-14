package entity

type Monster struct {
	ID       string
	Name     string
	HP       int
	MaxHP    int
	ATK      int
	DEF      int
	Traits   []Trait
	Zone     int
	PosX     int
	PosY     int
	Possessed bool
}

var MonsterTemplates = map[string]Monster{
	"rat":        {ID: "rat", Name: "实验鼠", MaxHP: 80, ATK: 8, DEF: 2, Traits: []Trait{TraitSwift}, Zone: 1},
	"roach":      {ID: "roach", Name: "变异蟑螂", MaxHP: 100, ATK: 6, DEF: 4, Traits: []Trait{TraitRegeneration}, Zone: 1},
	"failed_a":   {ID: "failed_a", Name: "失败体-α", MaxHP: 120, ATK: 10, DEF: 3, Traits: []Trait{TraitThickSkin}, Zone: 1},
	"slime":      {ID: "slime", Name: "培养皿史莱姆", MaxHP: 90, ATK: 7, DEF: 5, Traits: []Trait{TraitPerception}, Zone: 1},
	"dog":        {ID: "dog", Name: "看门犬", MaxHP: 150, ATK: 12, DEF: 4, Traits: []Trait{TraitSharpClaw}, Zone: 1},
	"robot":      {ID: "robot", Name: "清洁机器人", MaxHP: 110, ATK: 9, DEF: 6, Traits: []Trait{TraitTenacity}, Zone: 1},
	"monkey":     {ID: "monkey", Name: "逃逸猴", MaxHP: 95, ATK: 11, DEF: 2, Traits: []Trait{TraitBloodlust}, Zone: 1},
	"spider":     {ID: "spider", Name: "电击蜘蛛", MaxHP: 85, ATK: 13, DEF: 3, Traits: []Trait{TraitSwift}, Zone: 1},
	"vine":       {ID: "vine", Name: "腐化藤蔓", MaxHP: 130, ATK: 8, DEF: 7, Traits: []Trait{TraitRegeneration}, Zone: 1},
	"boss1":      {ID: "boss1", Name: "失控实验体", MaxHP: 300, ATK: 18, DEF: 8, Traits: []Trait{TraitThickSkin, TraitTenacity}, Zone: 1},

	"wasp":       {ID: "wasp", Name: "寄生蜂", MaxHP: 110, ATK: 14, DEF: 4, Traits: []Trait{TraitParasiteBoost}, Zone: 2},
	"wolf":       {ID: "wolf", Name: "畸变狼", MaxHP: 180, ATK: 16, DEF: 6, Traits: []Trait{TraitBerserk}, Zone: 2},
	"spore":      {ID: "spore", Name: "孢子行者", MaxHP: 140, ATK: 12, DEF: 8, Traits: []Trait{TraitPoison}, Zone: 2},
	"mirror":     {ID: "mirror", Name: "镜像人", MaxHP: 160, ATK: 15, DEF: 5, Traits: []Trait{TraitCounter}, Zone: 2},
	"puppet":     {ID: "puppet", Name: "血肉傀儡", MaxHP: 200, ATK: 13, DEF: 9, Traits: []Trait{TraitVampire}, Zone: 2},
	"shadow":     {ID: "shadow", Name: "影子潜伏者", MaxHP: 130, ATK: 18, DEF: 4, Traits: []Trait{TraitArmorBreak}, Zone: 2},
	"worm":       {ID: "worm", Name: "腐蚀虫群", MaxHP: 150, ATK: 14, DEF: 7, Traits: []Trait{TraitPoison}, Zone: 2},
	"hound":      {ID: "hound", Name: "强化猎犬", MaxHP: 190, ATK: 17, DEF: 6, Traits: []Trait{TraitBloodlust, TraitSharpClaw}, Zone: 2},
	"weapon_b":   {ID: "weapon_b", Name: "生物兵器-β", MaxHP: 170, ATK: 16, DEF: 10, Traits: []Trait{TraitGhost}, Zone: 2},
	"boss2":      {ID: "boss2", Name: "培育主管", MaxHP: 450, ATK: 22, DEF: 12, Traits: []Trait{TraitCounter, TraitPlunder}, Zone: 2},
}

func NewMonster(id string, x, y int) *Monster {
	tmpl, ok := MonsterTemplates[id]
	if !ok {
		return nil
	}
	m := tmpl
	m.HP = m.MaxHP
	m.PosX = x
	m.PosY = y
	return &m
}

func (m *Monster) IsAlive() bool {
	return m.HP > 0
}

func (m *Monster) TakeDamage(dmg int) {
	m.HP -= dmg
	if m.HP < 0 {
		m.HP = 0
	}
}
