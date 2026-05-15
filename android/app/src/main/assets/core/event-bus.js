const GameEvents=(function(){
  const _listeners={};
  return{
    on(event,fn){if(!_listeners[event])_listeners[event]=[];_listeners[event].push(fn);},
    off(event,fn){if(!_listeners[event])return;_listeners[event]=_listeners[event].filter(f=>f!==fn);},
    emit(event,data){if(!_listeners[event])return;_listeners[event].forEach(fn=>{try{fn(data);}catch(e){console.warn('EventBus error ['+event+']:',e);}});}
  };
})();
