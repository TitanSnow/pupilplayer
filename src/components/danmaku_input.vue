<template>
  <form @submit.prevent="submit" :style="{width: width + 'px'}">
    <input type="text" placeholder="Add danmaku" v-model="text" @keyup.enter="submit">
    <v-popover>
      <button type="button"><icon name="cog"/></button>
      <template slot="popover">
        <color-picker v-model="color"/>
      </template>
    </v-popover>
    <button type="submit"><icon name="rocket"/></button>
  </form>
</template>

<script>
import 'vue-awesome/icons/cog'
import 'vue-awesome/icons/rocket'
import 'vue-awesome/icons/times'
import Icon from 'vue-awesome/components/Icon'
import {VPopover} from 'v-tooltip'
import {Compact} from 'vue-color'
export default {
  props: ['width'],
  data(){
    return {
      text: '',
      color: {hex: '#ffffff'}
    }
  },
  components: {
    'icon': Icon,
    'v-popover': VPopover,
    'color-picker': Compact
  },
  methods: {
    submit(){
      this.$emit('add-danmaku', {text: this.text, color: this.color.hex})
      this.text = ''
    }
  }
}
</script>


<style scoped>
form {
  display: flex;
  align-items: center;
}
form > input {
  flex-grow: 1;
}
</style>
