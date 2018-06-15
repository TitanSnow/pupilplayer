import Vue from 'vue'
import Player from './components/pupilplayer.vue'
import { create } from 'domain';

window.pupilplayer = function(el){
  const player = Object.assign({el: el}, Player)
  player.data = Object.assign(player.data(), {src: '', danmakus: []})
  delete player.props
  Object.setPrototypeOf(this, new Vue(player))
}
