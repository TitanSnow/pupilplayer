<template>
  <div>
    <canvas ref="canvas" :width="width" :height="height" @click="toggle_play"></canvas>
    <div :style="overlay_style">
      <div ref="danmaku_roll">
        <div v-for="row in Math.floor(height / danmaku_line_height)"
          :key="'danmaku_row' + row" :ref="'danmaku_row' + row"
          :style="danmaku_row_style" class="danmaku_row"
        >
        </div>
      </div>
    </div>
    <div :style="overlay_style">
      <div v-for="row in Math.floor(height / danmaku_line_height)"
        :key="'danmaku_toprow' + row" :ref="'danmaku_toprow' + row"
        :style="danmaku_row_style" class="danmaku_row top"
      >
      </div>
    </div>
    <div class="controller" :style="full_width">
      <button @click="toggle_play"><icon :name="paused ? 'play' : 'pause'"/></button>
      <range-slider v-model.number="current_time" min="0" :max="duration" v-if="duration" style="flex-grow: 1"/>
      <span v-if="duration">{{ time_to_string(current_time) }} / {{ time_to_string(duration) }}</span>
      <button @click="toggle_mute"><icon :name="volume == 0 ? 'volume-off' : 'volume-up'"/></button>
      <range-slider min="0" :max="volume_ratio" v-model.number="volume" style="width: 80px"/>
    </div>
    <danmaku-input :width="width" @add-danmaku="add_danmaku" v-if="showDanmakuInput"/>
  </div>
</template>

<script>
import sortedLastIndex from "lodash.sortedlastindex";
import DanmakuInput from "./danmaku_input.vue";
import "vue-awesome/icons/play";
import "vue-awesome/icons/pause";
import "vue-awesome/icons/volume-off";
import "vue-awesome/icons/volume-up";
import Icon from "vue-awesome/components/Icon";
import RangeSlider from "vue-range-slider";
import "vue-range-slider/dist/vue-range-slider.css";
import LeftPad from "left-pad";

function offset_parent(e) {
  return [
    e.getBoundingClientRect().x - e.parentNode.getBoundingClientRect().x,
    e.getBoundingClientRect().y - e.parentNode.getBoundingClientRect().y
  ];
}

export default {
  name: "pupilplayer",
  props: {
    src: {
      type: String,
      default: ""
    },
    danmakus: {
      type: Array,
      default: () => []
    },
    danmakuFontSize: {
      type: Number,
      default: 25
    },
    danmakuLineHeightRatio: {
      type: Number,
      default: 1.125
    },
    danmakuRate: {
      type: Number,
      default: 10
    },
    danmakuStroke: {
      type: String,
      default: "ink"
    },
    danmakuFontFamily: {
      type: String,
      default: "sans-serif"
    },
    showDanmakuInput: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      element: document.createElement("video"),
      width: 0,
      height: 0,
      paused: true,
      duration: NaN,
      element_current_time: 0,
      element_volume: 0,
      volume_ratio: 16,
      volume_before_mute: 0,
      danmaku_timelist: [],
      roll_animation: null
    };
  },
  created() {
    this.update_src();
    this.update_danmakus();
    this.element.addEventListener("loadedmetadata", () => {
      this.width = this.element.videoWidth;
      this.height = this.element.videoHeight;
    });
    this.element.addEventListener("play", () => (this.paused = false));
    this.element.addEventListener("pause", () => (this.paused = true));
    this.element.addEventListener(
      "durationchange",
      () => (this.duration = this.element.duration)
    );
    this.element.addEventListener(
      "volumechange",
      () => (this.element_volume = this.element.volume)
    );
    this.element_volume = this.element.volume;
    var frame_callback = () => {
      if (!this.paused) this.draw_canvas();
      this.element_current_time = this.element.currentTime;
      requestAnimationFrame(frame_callback);
    };
    requestAnimationFrame(frame_callback);
  },
  mounted() {
    var roll_next = 0;
    var roll_callback = () => {
      this.roll_animation = this.$refs.danmaku_roll.animate(
        {
          transform: [
            `translateX(${roll_next}px)`,
            `translateX(${roll_next - 10000}px`
          ]
        },
        { duration: 10000 }
      );
      this.roll_animation.onfinish = roll_callback;
      this.roll_animation.playbackRate = 1 / this.danmakuRate;
      roll_next -= 10000;
    };
    roll_callback();
  },
  watch: {
    src() {
      this.update_src();
    },
    current_time(val, old_val) {
      var l = sortedLastIndex(this.danmaku_timelist, old_val);
      var r = sortedLastIndex(this.danmaku_timelist, val);
      for (var i = l; i < r; ++i) this.insert_danmaku(this.danmakus[i]);
    },
    danmakus() {
      this.update_danmakus();
    },
    danmakuRate(val) {
      this.roll_animation.playbackRate = 1 / val;
    }
  },
  computed: {
    current_time: {
      get() {
        return this.element_current_time;
      },
      set(val) {
        this.element.currentTime = val;
      }
    },
    volume: {
      get() {
        return this.element_volume * this.volume_ratio;
      },
      set(val) {
        this.element.volume = val / this.volume_ratio;
      }
    },
    full_width() {
      return {
        width: this.width + "px"
      };
    },
    overlay_style() {
      return {
        ...this.full_width,
        marginTop: -this.height + "px",
        height: this.height + "px",
        pointerEvents: "none",
        overflow: "hidden"
      };
    },
    danmaku_line_height() {
      return this.danmakuFontSize * this.danmakuLineHeightRatio;
    },
    danmaku_row_style() {
      if (this.danmakuStroke === "ink")
        var shadow =
          "rgb(0, 0, 0) 1px 0px 1px, rgb(0, 0, 0) 0px 1px 1px, rgb(0, 0, 0) 0px -1px 1px, rgb(0, 0, 0) -1px 0px 1px";
      else if (this.danmakuStroke === "stroke")
        shadow =
          "rgb(0, 0, 0) 0px 0px 1px, rgb(0, 0, 0) 0px 0px 1px, rgb(0, 0, 0) 0px 0px 1px";
      else if (this.danmakuStroke === "shadow")
        shadow = "rgb(0, 0, 0) 1px 1px 2px, rgb(0, 0, 0) 0px 0px 1px";
      return {
        lineHeight: this.danmaku_line_height + "px",
        fontSize: this.danmakuFontSize + "px",
        height: this.danmaku_line_height + "px",
        textShadow: shadow,
        fontFamily: this.danmakuFontFamily
      };
    }
  },
  methods: {
    update_src() {
      this.element.src = this.src;
    },
    toggle_play() {
      if (this.paused) this.play();
      else this.pause();
    },
    play() {
      this.element.play();
    },
    pause() {
      this.element.pause();
    },
    draw_canvas() {
      var ctx = this.$refs.canvas.getContext("2d");
      ctx.drawImage(this.element, 0, 0);
    },
    toggle_mute() {
      if (this.volume == 0)
        this.volume =
          this.volume_before_mute == 0
            ? this.volume_ratio
            : this.volume_before_mute;
      else {
        this.volume_before_mute = this.volume;
        this.volume = 0;
      }
    },
    add_danmaku(dmk) {
      dmk.time = this.current_time;
      this.$emit("add-danmaku", dmk, this.insert_danmaku(dmk));
    },
    create_danmaku_span(danmaku) {
      var element = document.createElement("span");
      element.textContent = danmaku.text;
      element.style.color = danmaku.color;
      return element;
    },
    insert_roll_danmaku(danmaku) {
      for (var row = 1; this.$refs["danmaku_row" + row]; ++row) {
        var row_element = this.$refs["danmaku_row" + row][0];
        var last_span = row_element.children[row_element.children.length - 1];
        if (typeof last_span === "undefined") break;
        else {
          var rt =
            offset_parent(last_span)[0] +
            last_span.getBoundingClientRect().width +
            offset_parent(this.$refs.danmaku_roll)[0];
          if (rt < this.width) break;
        }
      }

      if (this.$refs["danmaku_row" + row]) {
        var element = this.create_danmaku_span(danmaku);
        row_element.appendChild(element);
        var element_width = parseInt(element.getBoundingClientRect().width);
        element.style.position = "absolute";
        element.style.top = 0;
        element.style.left =
          Math.ceil(-offset_parent(this.$refs.danmaku_roll)[0] + this.width) +
          "px";
        var rm = () => {
          var rt =
            offset_parent(element)[0] +
            element.getBoundingClientRect().width +
            offset_parent(this.$refs.danmaku_roll)[0];
          if (rt <= 0) element.remove();
          else setTimeout(rm, Math.ceil(rt * this.danmakuRate));
        };
        setTimeout(
          rm,
          Math.ceil((this.width + element_width + 1) * this.danmakuRate)
        );
        return element;
      }
    },
    insert_top_danmaku(danmaku, bottom) {
      for (var row = 1; this.$refs["danmaku_toprow" + row]; ++row) {
        if (bottom) continue;
        var row_element = this.$refs["danmaku_toprow" + row][0];
        var last_span = row_element.children[row_element.children.length - 1];
        if (typeof last_span === "undefined") break;
      }
      if (bottom)
        for (--row; row > 0; --row) {
          row_element = this.$refs["danmaku_toprow" + row][0];
          last_span = row_element.children[row_element.children.length - 1];
          if (typeof last_span === "undefined") break;
        }

      if (this.$refs["danmaku_toprow" + row]) {
        var element = this.create_danmaku_span(danmaku);
        row_element.appendChild(element);
        setTimeout(() => element.remove(), this.width * this.danmakuRate);
      }
    },
    insert_danmaku(danmaku) {
      if (danmaku.type === "roll") return this.insert_roll_danmaku(danmaku);
      else if (danmaku.type === "top") return this.insert_top_danmaku(danmaku);
      else if (danmaku.type === "bottom")
        return this.insert_top_danmaku(danmaku, true);
    },
    update_danmakus() {
      this.danmaku_timelist.splice(0);
      for (var danmaku of this.danmakus)
        this.danmaku_timelist.push(danmaku.time);
    },
    time_to_string(time) {
      return `${LeftPad(Math.floor(time / 3600), 2, "0")}:${LeftPad(
        Math.floor(time / 60),
        2,
        "0"
      )}:${LeftPad(Math.floor(time % 60), 2, "0")}`;
    }
  },
  components: {
    Icon,
    DanmakuInput,
    RangeSlider
  }
};
</script>

<style scoped>
canvas {
  display: block;
}

.controller {
  display: flex;
  align-items: center;
}

.danmaku_row {
  position: relative;
  white-space: nowrap;
}

.danmaku_row.top {
  text-align: center;
}
</style>
