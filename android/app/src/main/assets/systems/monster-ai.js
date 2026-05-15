// ================================================================
// === Phase 4: 怪物行为AI系统 ===
// ================================================================
function getMonsterAI(tmpl){
  // ambush: 伏击类潜伏等待
  if(tmpl.traits.includes('伏击'))return 'ambush';
  // aggressive: 狂暴/吸血/伏击类主动追击
  if(tmpl.traits.some(t=>['狂暴','撕裂','多重攻击'].includes(t)))return 'aggressive';
  // patrol: 大部分普通怪巡逻
  if(tmpl.traits.some(t=>['迅捷','巡逻','电击','毒素','蛛网'].includes(t)))return 'patrol';
  // idle: 防御型/重装怪原地不动
  if(tmpl.traits.some(t=>['护甲','厚皮','再生','再生+'].includes(t)))return 'idle';
  // 默认: zone1-2巡逻，zone3+侵略
  return tmpl.zone>=3?'aggressive':'patrol';
}
function getMonsterDetectRange(tmpl){
  if(tmpl.traits.includes('伏击'))return 3;
  if(tmpl.traits.includes('恐惧'))return 6;
  if(tmpl.zone>=4)return 5;
  if(tmpl.zone>=3)return 4;
  return 3;
}
function tickMonsterAI(){
  if(game.target)return;
  if(game._sigFlags.peacefulMonsters)return;
  const px=game.player.x,py=game.player.y;

  // 群体警醒：已追踪的怪向2格内同伴传播半警觉
  game.monsters.forEach(m=>{
    if(m.hp<=0||m.alertLevel<2)return;
    game.monsters.forEach(m2=>{
      if(m2===m||m2.hp<=0||m2.alertLevel>=2)return;
      const md=Math.abs(m.x-m2.x)+Math.abs(m.y-m2.y);
      if(md<=2){m2.alertLevel=1;if(!m2._alertDecay)m2._alertDecay=2;m2._lastSeenX=px;m2._lastSeenY=py;}
    });
  });

  game.monsters.forEach(m=>{
    if(m.hp<=0||m.possessed)return;
    // 逃跑免疫倒计时
    if(m._fleeImmunity>0){m._fleeImmunity--;return;}
    // 修复卡墙：如果怪物当前在墙内，移到最近的地板格
    if(game.tiles[m.y]&&game.tiles[m.y][m.x]===0){
      let fixed=false;
      for(let r=1;r<=3&&!fixed;r++){
        for(let dy=-r;dy<=r&&!fixed;dy++){
          for(let dx=-r;dx<=r&&!fixed;dx++){
            const fx=m.x+dx,fy=m.y+dy;
            if(fx>=1&&fx<=11&&fy>=1&&fy<=11&&game.tiles[fy][fx]===1&&!(fx===px&&fy===py)&&!game.monsters.some(om=>om!==m&&om.hp>0&&om.x===fx&&om.y===fy)){
              m.x=fx;m.y=fy;m.homeX=fx;m.homeY=fy;fixed=true;
            }
          }
        }
      }
    }
    if(!m.ai)m.ai='idle';
    if(!m.homeX){m.homeX=m.x;m.homeY=m.y;}
    const dist=Math.sqrt((m.x-px)*(m.x-px)+(m.y-py)*(m.y-py));
    const detectRange=m.detectRange||3;
    const isSwift=m.traits&&m.traits.includes('迅捷');

    // === IDLE: 防御型 ===
    if(m.ai==='idle'){
      if(dist<=1.5){
        // 贴脸时主动追击
        m.alertLevel=2;
        moveMonsterToward(m,px,py);
        const newDist=Math.abs(m.x-px)+Math.abs(m.y-py);
        if(newDist<=1&&!game.target&&!isAnyOverlayOpen()){game.target=m;render();showCombat();}
      }else if(dist<=detectRange){
        m.alertLevel=1;
      }else{m.alertLevel=0;}
      return;
    }

    // === AMBUSH: 伏击型 ===
    if(m.ai==='ambush'){
      if(dist<=detectRange){
        m.alertLevel=2;
        // 伏击怪发现猎物后每回合2步猛扑
        moveMonsterToward(m,px,py);
        moveMonsterToward(m,px,py);
        const newDist=Math.abs(m.x-px)+Math.abs(m.y-py);
        if(newDist<=1&&!game.target&&!isAnyOverlayOpen()){game.target=m;m._ambush=true;render();showCombat();}
      }else{
        m.alertLevel=0; // 完全静止，潜伏等待
      }
      return;
    }

    // === PATROL: 巡逻型 ===
    if(m.ai==='patrol'){
      if(dist<=detectRange){
        // 发现玩家 → 追踪
        m.alertLevel=2;
        m._lastSeenX=px;m._lastSeenY=py;m._alertDecay=3;
        moveMonsterToward(m,px,py);
        // 迅捷怪追踪时额外移动一次
        if(isSwift)moveMonsterToward(m,px,py);
      }else if(m._alertDecay>0){
        // 记忆追踪：追向最后已知位置
        m._alertDecay--;
        m.alertLevel=m._alertDecay>0?1:0;
        if(m._lastSeenX!==undefined)moveMonsterToward(m,m._lastSeenX,m._lastSeenY);
      }else{
        // 巡逻：25%静止，方向偏好（直线巡逻感）
        m.alertLevel=0;
        if(Math.random()<0.25)return;
        const patrolDist=Math.sqrt((m.x-m.homeX)*(m.x-m.homeX)+(m.y-m.homeY)*(m.y-m.homeY));
        if(patrolDist>3){
          moveMonsterToward(m,m.homeX,m.homeY);
        }else{
          const dirs=[[0,1],[0,-1],[1,0],[-1,0]];
          let d;
          if(m._lastDir&&Math.random()<0.7){
            d=m._lastDir;
          }else{
            d=dirs[Math.floor(Math.random()*dirs.length)];
          }
          if(tryMoveMonster(m,m.x+d[0],m.y+d[1])){m._lastDir=d;}
          else{d=dirs[Math.floor(Math.random()*dirs.length)];if(tryMoveMonster(m,m.x+d[0],m.y+d[1]))m._lastDir=d;}
        }
      }
      return;
    }

    // === AGGRESSIVE: 主动追击型 ===
    if(m.ai==='aggressive'){
      if(dist<=detectRange){
        m.alertLevel=2;
        m._lastSeenX=px;m._lastSeenY=py;m._alertDecay=5;
        moveMonsterToward(m,px,py);
        // 迅捷怪追踪时额外移动一次
        if(isSwift)moveMonsterToward(m,px,py);
        // 追到玩家身边 → 触发战斗（非伏击，正面遭遇）
        const newDist=Math.abs(m.x-px)+Math.abs(m.y-py);
        if(newDist<=1&&!game.target&&!isAnyOverlayOpen()){
          game.target=m;
          render();
          showCombat();
        }
      }else if(m._alertDecay>0){
        // 记忆追踪
        m._alertDecay--;
        m.alertLevel=m._alertDecay>0?1:0;
        if(m._lastSeenX!==undefined)moveMonsterToward(m,m._lastSeenX,m._lastSeenY);
      }else if(dist<=detectRange+2){
        m.alertLevel=1;
      }else{
        // 闲逛
        m.alertLevel=0;
        if(Math.random()<0.3){
          const patrolDist=Math.sqrt((m.x-m.homeX)*(m.x-m.homeX)+(m.y-m.homeY)*(m.y-m.homeY));
          if(patrolDist>3)moveMonsterToward(m,m.homeX,m.homeY);
          else{const dirs=[[0,1],[0,-1],[1,0],[-1,0]];const d=dirs[Math.floor(Math.random()*dirs.length)];tryMoveMonster(m,m.x+d[0],m.y+d[1]);}
        }
      }
      return;
    }
  });
}
function moveMonsterToward(m,tx,ty){
  // 已在目标旁边（曼哈顿距离≤1），不再移动 — 避免绕路跑开
  if(Math.abs(tx-m.x)+Math.abs(ty-m.y)<=1)return;
  const dx=Math.sign(tx-m.x),dy=Math.sign(ty-m.y);
  const adx=Math.abs(tx-m.x),ady=Math.abs(ty-m.y);
  // 4方向尝试：主轴→副轴→两侧绕路，避免碰墙卡死
  if(adx>=ady){
    if(tryMoveMonster(m,m.x+dx,m.y))return;
    if(dy!==0&&tryMoveMonster(m,m.x,m.y+dy))return;
    if(tryMoveMonster(m,m.x,m.y+1))return;
    tryMoveMonster(m,m.x,m.y-1);
  }else{
    if(tryMoveMonster(m,m.x,m.y+dy))return;
    if(dx!==0&&tryMoveMonster(m,m.x+dx,m.y))return;
    if(tryMoveMonster(m,m.x+1,m.y))return;
    tryMoveMonster(m,m.x-1,m.y);
  }
}
function tryMoveMonster(m,nx,ny){
  if(m._tutPinned)return false; // 教学钉死，不允许移动
  if(nx<1||ny<1||nx>11||ny>11)return false;
  const phasing=m.traits&&m.traits.includes('相位');
  // 墙壁阻挡：非相位怪完全不能进墙，相位怪也不能停留在墙内
  if(game.tiles[ny][nx]===0)return false;
  if(nx===game.player.x&&ny===game.player.y)return false;
  if(game.monsters.some(om=>om!==m&&om.hp>0&&om.x===nx&&om.y===ny))return false;
  m._prevX=m.x;m._prevY=m.y;m._moveTime=Date.now();
  m.x=nx;m.y=ny;
  return true;
}
function moveStalker(){
  const s=game._sigFlags.stalker;if(!s)return;
  s.steps++;
  if(s.steps%3!==0)return;
  const dx=Math.sign(game.player.x-s.x),dy=Math.sign(game.player.y-s.y);
  const nx=s.x+dx,ny=s.y+dy;
  if(nx>=0&&nx<13&&ny>=0&&ny<13&&game.tiles[ny][nx]===1){s.x=nx;s.y=ny;}
  if(s.x===game.player.x&&s.y===game.player.y){
    const zone=Math.min(5,Math.ceil(game.floor/10));
    const types=Object.keys(monsterTemplates).filter(k=>monsterTemplates[k].zone===zone&&!k.includes('boss'));
    if(types.length>0){
      const sType=types[Math.floor(Math.random()*types.length)];const tmpl=monsterTemplates[sType];
      game.monsters.push({id:'stalker_'+Date.now(),type:sType,name:'暗影'+tmpl.name,hp:Math.floor(tmpl.maxHp*1.5),maxHp:Math.floor(tmpl.maxHp*1.5),atk:Math.floor(tmpl.atk*1.3),def:tmpl.def,traits:tmpl.traits.slice(),color:'#202',x:s.x,y:s.y,possessed:false});
    }
    game._sigFlags.stalker=null;addMsg('暗影猎手现身!');
  }
}
function checkFloorTimer(){
  const f=game._sigFlags;if(!f||!f.timerActive){
    // 计时器已停，清除interval
    if(game._floorTimerInterval){clearInterval(game._floorTimerInterval);game._floorTimerInterval=null;}
    const el=document.getElementById('floor-timer');if(el)el.style.display='none';
    return;
  }
  const remain=Math.max(0,Math.ceil((f.timerEnd-Date.now())/1000));
  const el=document.getElementById('floor-timer');
  if(el){el.style.display='block';el.textContent='⏱ '+remain+'s';el.style.color=remain<10?'#ff006e':'#ff0';}
  if(remain<=0){
    f.timerActive=false;if(el)el.style.display='none';
    if(game._floorTimerInterval){clearInterval(game._floorTimerInterval);game._floorTimerInterval=null;}
    addMsg('⏱ 限时挑战结束！下楼时不再获得额外EP');f.timerReward=0;
  }
}
