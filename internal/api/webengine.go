package api

import (
	"math/rand"
	"parasite-tower/internal/combat"
	"parasite-tower/internal/entity"
	"parasite-tower/internal/game"
)

type WebEngine struct {
	player   *entity.Player
	world    *game.World
	state    game.GameState
	messages []string
	targetMonster *entity.Monster
}

func NewWebEngine() *WebEngine {
	p := entity.NewPlayer("寄生体")
	w := &game.World{CurrentFloor: 1}
	w.Level = game.GenerateFloor(1)

	return &WebEngine{
		player:   p,
		world:    w,
		state:    game.StateExploring,
		messages: []string{"你苏醒了...身体感觉很陌生"},
	}
}

func (e *WebEngine) HandleAction(action string) *GameStateDTO {
	switch action {
	case "up":
		e.tryMove(0, -1)
	case "down":
		e.tryMove(0, 1)
	case "left":
		e.tryMove(-1, 0)
	case "right":
		e.tryMove(1, 0)
	case "stairs":
		e.goUpstairs()
	case "attack":
		if e.targetMonster != nil {
			e.executeCombat()
		}
	case "possess":
		if e.targetMonster != nil {
			e.tryPossess()
		}
	}

	return e.buildState()
}

func (e *WebEngine) tryMove(dx, dy int) {
	nx := e.player.PosX + dx
	ny := e.player.PosY + dy

	if nx < 0 || ny < 0 || nx >= 13 || ny >= 13 {
		return
	}

	if e.world.Level.Tiles[ny][nx] == game.TileWall {
		return
	}

	for _, m := range e.world.Level.Monsters {
		if m.IsAlive() && m.PosX == nx && m.PosY == ny {
			e.targetMonster = m
			e.state = game.StateCombat
			e.addMessage("遭遇 " + m.Name + "！")
			return
		}
	}

	e.player.PosX = nx
	e.player.PosY = ny
	e.targetMonster = nil
	e.state = game.StateExploring
}

func (e *WebEngine) executeCombat() {
	if e.targetMonster == nil || !e.targetMonster.IsAlive() {
		return
	}

	result := combat.ExecuteCombat(e.player, e.targetMonster)
	e.addMessage("击败 " + e.targetMonster.Name + "，受到 " + string(rune(result.PlayerDamage)) + " 伤害")

	e.player.EvoPoints += 10
	e.state = game.StateExploring
	e.targetMonster = nil
}

func (e *WebEngine) tryPossess() {
	if e.targetMonster == nil || !e.targetMonster.IsAlive() {
		return
	}

	if e.player.Possessed[e.targetMonster.ID] {
		e.addMessage("已经附身过这种生物了")
		return
	}

	baseRate := 0.6
	hpFactor := 1.0 - float64(e.targetMonster.HP)/float64(e.targetMonster.MaxHP)*0.6
	successRate := baseRate * hpFactor

	if e.player.HasTrait(entity.TraitParasiteBoost) {
		successRate += 0.15
	}

	if rand.Float64() < successRate {
		e.player.MaxHP = e.targetMonster.MaxHP * 8 / 10
		e.player.HP = e.targetMonster.HP * 8 / 10
		e.player.ATK = e.targetMonster.ATK
		e.player.DEF = e.targetMonster.DEF

		for _, t := range e.targetMonster.Traits {
			e.player.AddTrait(t)
		}

		e.player.Possessed[e.targetMonster.ID] = true
		e.player.Fragments[e.targetMonster.ID] = true

		if !e.player.HasTrait(entity.TraitPollutionImmune) {
			e.player.Pollution += 5
		}

		e.addMessage("附身成功！获得了 " + e.targetMonster.Name + " 的能力")
		e.targetMonster.HP = 0
		e.state = game.StateFragment
	} else {
		e.addMessage("附身失败！" + e.targetMonster.Name + " 产生了免疫")
		e.targetMonster.Possessed = true
	}
}

func (e *WebEngine) goUpstairs() {
	if e.world.Level.Tiles[e.player.PosY][e.player.PosX] != game.TileStairs {
		return
	}

	e.world.CurrentFloor++
	e.world.Level = game.GenerateFloor(e.world.CurrentFloor)
	e.player.PosX = 6
	e.player.PosY = 6
	e.player.Pollution += 2
	e.addMessage("来到了第 " + string(rune(e.world.CurrentFloor)) + " 层")
}

func (e *WebEngine) addMessage(msg string) {
	e.messages = append(e.messages, msg)
	if len(e.messages) > 50 {
		e.messages = e.messages[len(e.messages)-50:]
	}
}

func (e *WebEngine) buildState() *GameStateDTO {
	return &GameStateDTO{
		State:    string(e.state),
		FloorNum: e.world.CurrentFloor,
		Player:   e.buildPlayerDTO(),
		Tiles:    e.world.Level.Tiles,
		Monsters: e.buildMonstersDTO(),
		Messages: e.messages,
		Target:   e.buildTargetDTO(),
	}
}

func (e *WebEngine) buildPlayerDTO() PlayerDTO {
	traits := []TraitDTO{}
	for _, t := range e.player.Traits {
		info := entity.TraitData[t]
		traits = append(traits, TraitDTO{
			ID:   string(info.ID),
			Name: info.Name,
			Desc: info.Desc,
			Tier: info.Tier,
		})
	}

	return PlayerDTO{
		Name:      e.player.Name,
		HP:        e.player.HP,
		MaxHP:     e.player.MaxHP,
		ATK:       e.player.ATK,
		DEF:       e.player.DEF,
		Gold:      e.player.Gold,
		Pollution: e.player.Pollution,
		EvoPoints: e.player.EvoPoints,
		PosX:      e.player.PosX,
		PosY:      e.player.PosY,
		Traits:    traits,
	}
}

func (e *WebEngine) buildMonstersDTO() []MonsterDTO {
	result := []MonsterDTO{}
	for _, m := range e.world.Level.Monsters {
		if !m.IsAlive() {
			continue
		}
		result = append(result, MonsterDTO{
			ID:   m.ID,
			Name: m.Name,
			HP:   m.HP,
			MaxHP: m.MaxHP,
			ATK:  m.ATK,
			DEF:  m.DEF,
			PosX: m.PosX,
			PosY: m.PosY,
			Possessed: m.Possessed,
		})
	}
	return result
}

func (e *WebEngine) buildTargetDTO() *TargetDTO {
	if e.targetMonster == nil {
		return nil
	}

	preview := combat.PredictCombat(e.player, e.targetMonster)
	possessRate := 0.6 * (1.0 - float64(e.targetMonster.HP)/float64(e.targetMonster.MaxHP)*0.6)
	if e.player.HasTrait(entity.TraitParasiteBoost) {
		possessRate += 0.15
	}

	return &TargetDTO{
		Name:         e.targetMonster.Name,
		HP:           e.targetMonster.HP,
		MaxHP:        e.targetMonster.MaxHP,
		ATK:          e.targetMonster.ATK,
		DEF:          e.targetMonster.DEF,
		PredictDamage: preview.PlayerDamage,
		PossessRate:  int(possessRate * 100),
		CanPossess:   !e.player.Possessed[e.targetMonster.ID] && !e.targetMonster.Possessed,
	}
}
