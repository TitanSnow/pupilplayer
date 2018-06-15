<template>
  <div>
    <canvas ref="canvas" :width="width" :height="height" @click="toggle_play" style="display: block"></canvas>
    <div :style="overlay_style">
      <div v-for="row in Math.floor(height / danmaku_line_height)"
        :key="'danmaku_row' + row" :ref="'danmaku_row' + row"
        :style="{
          lineHeight: danmaku_line_height + 'px',
          fontSize: danmaku_line_height + 'px',
          height: danmaku_line_height + 'px'
        }" class="danmaku_row"
      >
      </div>
    </div>
    <div class="flex-layout vcenter" :style="full_width">
      <button @click="toggle_play" class="material-icons">{{ paused ? 'play_arrow' : 'pause' }}</button>
      <input type="range" v-model="current_time" min="0" :max="duration" v-if="duration" style="flex-grow: 1">
      <i class="material-icons" @click="toggle_mute" style="cursor: pointer">{{ volume == 0 ? 'volume_off' : 'volume_up' }}</i>
      <input type="range" min="0" :max="volume_ratio" v-model="volume" style="width: 80px">
    </div>
    <div class="flex-layout vcenter" :style="full_width">
      <input type="text" style="flex-grow: 1" placeholder="Add danmaku" v-model="danmaku_input" @keyup.enter="add_danmaku">
      <color-picker v-model="danmaku_color"/>
      <button class="material-icons" @click="add_danmaku">send</button>
    </div>
  </div>
</template>

<script>
import sortedLastIndex from 'lodash.sortedlastindex'
import sortedIndex from 'lodash.sortedindex'
import {Compact} from 'vue-color'
export default {
  name: 'pupilplayer',
  props: ['src', 'danmakus'],
  data: function(){
    return {
      element: document.createElement('video'),
      width: 0,
      height: 0,
      paused: true,
      duration: NaN,
      element_current_time: 0,
      element_volume: 0,
      volume_ratio: 16,
      volume_before_mute: 0,
      danmaku_timelist: [],
      danmaku_list: [],
      danmaku_input: '',
      danmaku_line_height: 24,
      danmaku_next_enter: 0,
      danmaku_color: {hex: '#FFFFFF'}
    }
  },
  created: function(){
    this.update_src()
    this.update_danmakus()
    this.element.addEventListener('loadedmetadata', () => {
      this.width = this.element.videoWidth
      this.height = this.element.videoHeight
    })
    this.element.addEventListener('play', () => this.paused = false)
    this.element.addEventListener('pause', () => this.paused = true)
    this.element.addEventListener('durationchange', () => this.duration = this.element.duration)
    var frame_callback = () => {
      if(!this.paused)
        this.draw_canvas()
      this.element_current_time = this.element.currentTime
      this.element_volume = this.element.volume
      requestAnimationFrame(frame_callback)
    }
    requestAnimationFrame(frame_callback)
  },
  watch: {
    src: function(){
      this.update_src()
    },
    current_time: function(val, old_val){
      if(val < old_val)
        this.danmaku_next_enter = sortedIndex(this.danmaku_timelist, val)
      var pos = sortedLastIndex(this.danmaku_timelist, val)
      for(var i = this.danmaku_next_enter; i < pos; ++i)
        this.insert_danmaku(this.danmaku_list[i])
      this.danmaku_next_enter = pos
    },
    danmakus: function(){
      this.update_danmakus()
    }
  },
  computed: {
    current_time: {
      get: function(){
        return this.element_current_time
      },
      set: function(val){
        this.element.currentTime = val
      }
    },
    volume: {
      get: function(){
        return this.element_volume * this.volume_ratio
      },
      set: function(val){
        this.element.volume = val / this.volume_ratio
      }
    },
    full_width: function(){
      return {
        width: this.width + 'px'
      }
    },
    overlay_style: function(){
      return {
        ...this.full_width,
        marginTop: -this.height + 'px',
        height: this.height + 'px',
        pointerEvents: 'none',
        overflow: 'hidden'
      }
    }
  },
  methods: {
    update_src: function(){
      this.element.src = this.src
    },
    toggle_play: function(){
      if(this.paused)
        this.play()
      else
        this.pause()
    },
    play: function(){
      this.element.play()
    },
    pause: function(){
      this.element.pause()
    },
    draw_canvas: function(){
      var ctx = this.$refs.canvas.getContext('2d')
      ctx.drawImage(this.element, 0, 0)
    },
    toggle_mute: function(){
      if(this.volume == 0)
        this.volume = this.volume_before_mute == 0 ? this.volume_ratio : this.volume_before_mute
      else{
        this.volume_before_mute = this.volume
        this.volume = 0
      }
    },
    add_danmaku: function(){
      var pos = sortedLastIndex(this.danmaku_timelist, this.current_time)
      var danmaku_obj = {text: this.danmaku_input, color: this.danmaku_color.hex}
      this.danmaku_timelist.splice(pos, 0, this.current_time)
      this.danmaku_list.splice(pos, 0, danmaku_obj)
      this.danmaku_input = ''
      this.$emit('add-danmaku', {...danmaku_obj, time: this.current_time})
    },
    insert_danmaku: function(danmaku){
      for(var row = 1; this.$refs['danmaku_row' + row]; ++row){
        var row_element = this.$refs['danmaku_row' + row][0]
        var last_span = row_element.children[row_element.children.length - 1]
        if(typeof last_span === 'undefined')
          break
        else{
          var rt = parseInt(getComputedStyle(last_span).left)
          if(rt < this.width)
            break
        }
      }

      if(this.$refs['danmaku_row' + row]){
        var row_element = this.$refs['danmaku_row' + row][0]
        var element = document.createElement('span')
        element.textContent = danmaku.text
        element.style.color = danmaku.color
        row_element.appendChild(element)
        var element_width = parseInt(element.getBoundingClientRect().width)
        element.style.marginLeft = -element_width + 'px'
        element.style.position = 'absolute';
        element.style.top = 0;
        element.animate({
          left: [this.width + element_width + 'px', '0']
        }, {duration: this.width * 10}).onfinish = () => element.remove()
      }
    },
    update_danmakus: function(){
      this.danmaku_timelist.splice(0)
      this.danmaku_list.splice(0)
      for(var danmaku of this.danmakus){
        this.danmaku_timelist.push(danmaku.time)
        var temp = Object.assign({}, danmaku)
        delete temp.time
        this.danmaku_list.push(temp)
      }
      this.danmaku_next_enter = sortedIndex(this.danmaku_timelist, this.current_time)
    }
  },
  components: {
    'color-picker': Compact
  }
}
</script>

<style scoped>
@import "https://fonts.googleapis.com/icon?family=Material+Icons";

.flex-layout {
  display: flex;
}
.flex-layout.vcenter {
  align-items: center;
}

.danmaku_row {
  position: relative;
  -webkit-text-stroke: 1px black;
  font-weight: bold;
  white-space: nowrap;
}
</style>