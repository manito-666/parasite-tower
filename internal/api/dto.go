package api

type GameStateDTO struct {
	State    string       `json:"state"`
	FloorNum int          `json:"floorNum"`
	Player   PlayerDTO    `json:"player"`
	Tiles    [][]int      `json:"tiles"`
	Monsters []MonsterDTO `json:"monsters"`
	Messages []string     `json:"messages"`
	Target   *TargetDTO   `json:"target,omitempty"`
}

type PlayerDTO struct {
	Name      string     `json:"name"`
	HP        int        `json:"hp"`
	MaxHP     int        `json:"maxHp"`
	ATK       int        `json:"atk"`
	DEF       int        `json:"def"`
	Gold      int        `json:"gold"`
	Pollution int        `json:"pollution"`
	EvoPoints int        `json:"evoPoints"`
	PosX      int        `json:"posX"`
	PosY      int        `json:"posY"`
	Traits    []TraitDTO `json:"traits"`
}

type TraitDTO struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Desc string `json:"desc"`
	Tier int    `json:"tier"`
}

type MonsterDTO struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	HP        int    `json:"hp"`
	MaxHP     int    `json:"maxHp"`
	ATK       int    `json:"atk"`
	DEF       int    `json:"def"`
	PosX      int    `json:"posX"`
	PosY      int    `json:"posY"`
	Possessed bool   `json:"possessed"`
}

type TargetDTO struct {
	Name          string `json:"name"`
	HP            int    `json:"hp"`
	MaxHP         int    `json:"maxHp"`
	ATK           int    `json:"atk"`
	DEF           int    `json:"def"`
	PredictDamage int    `json:"predictDamage"`
	PossessRate   int    `json:"possessRate"`
	CanPossess    bool   `json:"canPossess"`
}
