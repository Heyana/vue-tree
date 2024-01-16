<template>
  <div>

    <VTree v-model="value" selectable draggable droppable @node-drop="handleDrop" ref="tree" :unselectOnClick='false'
      :beforeDropMethod="(a, b, c) => {
        console.log(a, b, c)
        return true
      }" @change-parent="(a) => {
  console.log(a, 'a');
}" @selected-map-change="(e) => {
  console.log('Log-- ', 'e', e);
}">
      <template #empty>slot 传进来的暂无数据</template>
    </VTree>
  </div>
</template>

<script lang="ts">
import VTree from '../src'
import treeDataGenerator from '../tests/tree-data-generator'
import { defineComponent, ref } from 'vue-demi'
import MyDrag from './MyDrag'
export default defineComponent({
  name: 'Drag',
  components: {
    VTree, MyDrag
  },
  mounted() {


  },
  setup() {
    const value = ref(['0'])
    const genData = (extra = {}) => {
      return treeDataGenerator(
        Object.assign(
          {
            treeDepth: 2,
            nodesPerLevel: 5,
            sameIdTitle: true,
            inOrder: true,
            forceString: true
          },
          extra
        )
      )
    }

    const handleDrop = () => {
      console.log('node drop')
    }
    const data = ref(genData().data)
    const tree = ref(null)
    console.log(data.value, 'data.value');
    setTimeout(() => {
      tree.value.setData(data.value)
      // setTimeout(() => {
      //   tree.value.setExpand('1', true, true)

      // }, 1000)
      return
      console.log(tree.value, 'tree.value');
      tree.value.methods.setNodeParent({
        id: '0'
      }, {
        id: '6'
      })
      setTimeout(() => {
        tree.value.setData(data.value)

      }, 2000)
    }, 100)
    window.test = data
    return {
      data,
      value,
      genData,
      handleDrop,
      tree
    }
  }
})
</script>
