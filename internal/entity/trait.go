package entity

type Trait string

const (
	TraitThickSkin    Trait = "thick_skin"
	TraitSharpClaw    Trait = "sharp_claw"
	TraitRegeneration Trait = "regeneration"
	TraitSwift        Trait = "swift"
	TraitBloodlust    Trait = "bloodlust"
	TraitTenacity     Trait = "tenacity"
	TraitPerception   Trait = "perception"
	TraitThrifty      Trait = "thrifty"
	TraitVampire      Trait = "vampire"
	TraitArmorBreak   Trait = "armor_break"
	TraitBerserk      Trait = "berserk"
	TraitCounter      Trait = "counter"
	TraitPoison       Trait = "poison"
	TraitGhost        Trait = "ghost"
	TraitPlunder      Trait = "plunder"
	TraitParasiteBoost Trait = "parasite_boost"
	TraitUndead       Trait = "undead"
	TraitVoid         Trait = "void"
	TraitSplit        Trait = "split"
	TraitPollutionImmune Trait = "pollution_immune"
)

type TraitInfo struct {
	ID     Trait
	Name   string
	Desc   string
	Tier   int
}

var TraitData = map[Trait]TraitInfo{
	TraitThickSkin:    {TraitThickSkin, "厚皮", "DEF +8", 1},
	TraitSharpClaw:    {TraitSharpClaw, "利爪", "ATK +6", 1},
	TraitRegeneration: {TraitRegeneration, "再生", "每回合恢复3% HP", 1},
	TraitSwift:        {TraitSwift, "迅捷", "移动后可再次行动(每层1次)", 1},
	TraitBloodlust:    {TraitBloodlust, "嗜血", "击杀恢复15% HP", 1},
	TraitTenacity:     {TraitTenacity, "坚韧", "致命伤保留1HP(每层1次)", 1},
	TraitPerception:   {TraitPerception, "感知", "显示相邻房间", 1},
	TraitThrifty:      {TraitThrifty, "节俭", "商店-20%", 1},
	TraitVampire:      {TraitVampire, "吸血", "伤害30%转HP", 2},
	TraitArmorBreak:   {TraitArmorBreak, "破甲", "无视50%防御", 2},
	TraitBerserk:      {TraitBerserk, "狂暴", "HP<40%时ATK×2", 2},
	TraitCounter:      {TraitCounter, "反击", "受击反击30%", 2},
	TraitPoison:       {TraitPoison, "剧毒", "持续伤害3回合", 2},
	TraitGhost:        {TraitGhost, "灵体", "受伤-30%", 2},
	TraitPlunder:      {TraitPlunder, "掠夺", "击杀双倍金币", 2},
	TraitParasiteBoost: {TraitParasiteBoost, "寄生强化", "附身+15%", 2},
	TraitUndead:       {TraitUndead, "不死", "复活50%HP(每5层)", 3},
	TraitVoid:         {TraitVoid, "虚空", "穿墙(每层3次)", 3},
	TraitSplit:        {TraitSplit, "分裂", "20%分裂分身", 3},
	TraitPollutionImmune: {TraitPollutionImmune, "污染免疫", "附身不增污染", 3},
}
