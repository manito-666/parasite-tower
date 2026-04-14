package game

import "parasite-tower/internal/entity"

type GameState string

const (
	StateExploring GameState = "exploring"
	StateCombat    GameState = "combat"
	StatePossess   GameState = "possess"
	StateFragment  GameState = "fragment"
	StateGameOver  GameState = "gameover"
)

type Level struct {
	FloorNum int
	Name     string
	Tiles    [][]int
	Monsters []*entity.Monster
}

type World struct {
	CurrentFloor int
	Level        *Level
}

const (
	TileWall   = 0
	TileFloor  = 1
	TileStairs = 2
)

func GenerateFloor(floorNum int) *Level {
	size := 13
	tiles := make([][]int, size)
	for i := range tiles {
		tiles[i] = make([]int, size)
		for j := range tiles[i] {
			if i == 0 || i == size-1 || j == 0 || j == size-1 {
				tiles[i][j] = TileWall
			} else {
				tiles[i][j] = TileFloor
			}
		}
	}

	tiles[6][10] = TileStairs

	monsters := []*entity.Monster{}
	if floorNum <= 10 {
		monsters = append(monsters, entity.NewMonster("rat", 3, 3))
		monsters = append(monsters, entity.NewMonster("roach", 9, 3))
		monsters = append(monsters, entity.NewMonster("slime", 3, 9))
		if floorNum == 10 {
			monsters = append(monsters, entity.NewMonster("boss1", 6, 3))
		}
	} else if floorNum <= 20 {
		monsters = append(monsters, entity.NewMonster("wasp", 3, 3))
		monsters = append(monsters, entity.NewMonster("wolf", 9, 3))
		monsters = append(monsters, entity.NewMonster("spore", 3, 9))
		if floorNum == 20 {
			monsters = append(monsters, entity.NewMonster("boss2", 6, 3))
		}
	}

	return &Level{
		FloorNum: floorNum,
		Name:     getFloorName(floorNum),
		Tiles:    tiles,
		Monsters: monsters,
	}
}

func getFloorName(f int) string {
	if f <= 10 {
		return "废弃实验室"
	} else if f <= 20 {
		return "生物培育区"
	} else if f <= 30 {
		return "收容区"
	} else if f <= 40 {
		return "核心区"
	}
	return "源头"
}
