<template>
  <form @submit.prevent="submit" :style="{width: width + 'px'}">
    <input type="text" placeholder="Add danmaku" v-model="text">
    <v-popover>
      <button type="button"><icon name="cog"/></button>
      <template slot="popover">
        <color-picker v-model="color"/>
        <input type="radio" value="roll" id="roll" v-model="type">
        <label for="roll"><icon name="space-shuttle" style="transform: rotate(180deg)"/></label>
        <input type="radio" value="top" id="top" v-model="type">
        <label for="top"><icon name="bars"/></label>
        <input type="radio" value="bottom" id="bottom" v-model="type">
        <label for="bottom"><icon name="window-minimize"/></label>
      </template>
    </v-popover>
    <button type="submit"><icon name="rocket"/></button>
  </form>
</template>

<script>
import "vue-awesome/icons/cog";
import "vue-awesome/icons/rocket";
import "vue-awesome/icons/space-shuttle";
import "vue-awesome/icons/bars";
import "vue-awesome/icons/window-minimize";
import Icon from "vue-awesome/components/Icon";
import { VPopover } from "v-tooltip";
import { Compact } from "vue-color";
export default {
  props: ["width"],
  data() {
    return {
      text: "",
      color: { hex: "#ffffff" },
      type: "roll"
    };
  },
  components: {
    icon: Icon,
    "v-popover": VPopover,
    "color-picker": Compact
  },
  methods: {
    submit() {
      this.$emit("add-danmaku", {
        text: this.text,
        color: this.color.hex,
        type: this.type
      });
      this.text = "";
    }
  }
};
</script>


<style scoped>
form {
  display: flex;
  align-items: center;
}
form > input {
  flex-grow: 1;
}
input[type="radio"] {
  display: none;
}
input[type="radio"] + label {
  cursor: pointer;
}
input[type="radio"]:checked + label {
  color: #00bcd4;
}
</style>
