<template>
  <form @submit.prevent="submit" :style="{width: width + 'px'}">
    <ui-textbox placeholder="Add danmaku" v-model="text" style="margin-bottom: 0; flex-grow: 1; margin-left: 6px" icon="comment"/>
    <color-picker v-model="color"
      :show-border="true" popover-to="left"
      :trigger-style="{border: '2px solid #dbdbdb', width: '36px', height: '36px', boxSizing: 'border-box', display: 'block'}"
      swatch-size="20" shapes="circles" colors="text-basic"/>
    <ui-icon-button icon="clear_all" v-if="type === 'roll'" style="transform: scaleX(-1)" @click="type = 'top'" type="secondary"/>
    <ui-icon-button icon="filter_list" v-if="type === 'top'" @click="type = 'bottom'" type="secondary"/>
    <ui-icon-button icon="filter_list" v-if="type === 'bottom'" style="transform: scaleY(-1)" @click="type = 'roll'" type="secondary"/>
    <ui-icon-button icon='send' buttonType="submit"/>
  </form>
</template>

<script>
import "keen-ui/dist/keen-ui.css";
import { UiTextbox, UiIconButton } from "keen-ui";
import "vue-swatches/dist/vue-swatches.min.css";
import ColorPicker from "vue-swatches";

export default {
  props: ["width"],
  data() {
    return {
      text: "",
      color: "#ffffff",
      type: "roll"
    };
  },
  components: {
    ColorPicker,
    UiTextbox,
    UiIconButton
  },
  methods: {
    submit() {
      this.$emit("add-danmaku", {
        text: this.text,
        color: this.color,
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
  border: 1px solid #e2e2e2;
  border-top: none;
  box-sizing: border-box;
  padding: 3px;
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
