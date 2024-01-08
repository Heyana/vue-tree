<template>
  <div :class="wrapperCls">
    <div :class="dropBeforeCls"></div>
    <div ref="nodeBody" :class="nodeBodyCls" v-on="dropListeners">
      <!-- 展开按钮 -->
      <div :class="expandCls">
        <div v-if="renderIconFunction" @click="handleExpand">
          <component v-if="renderIconFunction" :is="renderIconComponent">
          </component>
        </div>
        <div v-else>
          <div :class="expandCls">
            <!-- 外层用于占位，icon 用于点击 -->
            <i v-show="!data?.isLeaf && !data?._loading" @click="handleExpand"></i>
            <LoadingIcon v-if="data?._loading" :class="loadingIconCls" />
          </div>
        </div>

      </div>

      <!-- 标题 -->
      <div :class="titleCls" @click="handleSelect" @dblclick="handleDblclick" @contextmenu="handleRightClick"
        v-on="dragListeners" :draggable="draggable && !disableAll && !data?.disabled">
        <component v-if="renderFunction" :is="renderComponent">
        </component>
        <template v-else>{{ data ? data[titleField] : '' }}
        </template>
      </div>
    </div>
    <div :class="dropAfterCls"></div>
  </div>
</template>

<script lang="ts">
import {
  VNode,
  defineComponent,
  ref,
  computed,
  getCurrentInstance,
  h,
  PropType
} from 'vue-demi'
import { TreeNode } from '../store'
import LoadingIcon from './LoadingIcon.vue'
import { dragHoverPartEnum, TREE_NODE_EVENTS } from '../const'
import type { GetNodeFn } from '../types'
const prefixCls = 'ctree-tree-node'

export default defineComponent({
  name: 'CTreeNode',
  components: {
    LoadingIcon
  },
  props: {
    /** 节点数据，注意！！为了性能，不让 Vue 监听过多属性，这个 data 不是完整的 TreeNode ，不包括 _parent 和 children 属性 */
    data: Object as PropType<TreeNode>,

    /** 节点标题字段 */
    titleField: {
      type: String,
      default: ''
    },

    /** 节点唯一标识字段 */
    keyField: String,

    /** 节点渲染 render 函数 */
    render: Function as PropType<(node: TreeNode) => VNode>,
    renderIcon: Function as PropType<(node: TreeNode) => VNode>,

    /** 是否可多选 */
    checkable: Boolean,

    /** 是否可单选 */
    selectable: Boolean,

    /** 点击已选中节点是否取消选中 */
    unselectOnClick: Boolean,

    /** 是否禁用所有节点 */
    disableAll: Boolean,

    /** 是否可拖拽 */
    draggable: Boolean,

    /** 是否可放置 */
    droppable: Boolean,
    getNode: Function as PropType<GetNodeFn>,
    getTreeNode: Function
  },
  emits: [...TREE_NODE_EVENTS],
  setup(props, { emit }) {
    const dragoverBody = ref(false)
    const dragoverBefore = ref(false)
    const dragoverAfter = ref(false)
    const keyField = props.keyField as string
    const getNode = props.getNode as Function
    // const titleField = props.titleField as string
    const wrapperCls = computed(() => {
      return [
        `${prefixCls}__wrapper`,
        {
          [`${prefixCls}__wrapper_is-leaf`]: props.data?.isLeaf,
          [`${prefixCls}_disabled`]: props.data?.selected
        },
        // 复选
        {
          [`${prefixCls}_checked`]: props.checkable && props.data?.checked,
          [`${prefixCls}_indeterminate`]:
            props.checkable && props.data?.indeterminate
        },
        // 单选
        {
          [`${prefixCls}_selected`]: props.data?.selected,
          [`${prefixCls}_hover`]: !props.data?.selected && !isSubActive()
        },
        {
          [`${prefixCls}__drop_active`]: dragoverBody.value
        },
        {
          [`${prefixCls}_sub_selected`]: isSubActive()
        }
      ]
    })
    const nodeBodyCls = computed(() => {
      return [
        `${prefixCls}__node-body`,

      ]
    })
    const dropBeforeCls = computed(() => {
      return [
        `${prefixCls}__drop`,
        {
          [`${prefixCls}__drop_active`]: dragoverBefore.value
        }
      ]
    })
    const dropAfterCls = computed(() => {
      return [
        `${prefixCls}__drop`,
        {
          [`${prefixCls}__drop_active`]: dragoverAfter.value
        }
      ]
    })
    // const squareCls = computed(() => {
    //   return [`${prefixCls}__square`]
    // })

    const expandCls = computed(() => {
      return [
        `${prefixCls}__square`,
        `${prefixCls}__expand`,
        {
          [`${prefixCls}__expand_active`]: props.data?.expand
        }
      ]
    })
    const loadingIconCls = computed(() => {
      return [`${prefixCls}__loading-icon`]
    })

    const titleCls = computed(() => {
      return [
        `${prefixCls}__title`,
        {
          [`${prefixCls}__title_disabled`]:
            props.disableAll || props.data?.disabled
        },
        {
          [`${prefixCls}__title_selected`]: props.data?.selected
        }
      ]
    })
    const fullData = computed(() => {
      return (
        getNode(props.data ? props.data[keyField] : '') ||
        props.data ||
        ({} as TreeNode)
      )
    })

    const renderFunction = props.data?.render || props.render || null
    const renderComponent = computed(() => {
      return defineComponent({
        name: 'Render',
        functional: true,
        render() {
          if (typeof renderFunction !== 'function') return h('div')
          return renderFunction(fullData.value)
        }
      })
    })
    const renderIconFunction = props.data?.renderIcon || props.renderIcon || null
    const renderIconComponent = computed(() => {
      return defineComponent({
        name: 'Render_Icon',
        functional: true,
        render() {
          if (typeof renderIconFunction !== 'function') return h('div')
          return renderIconFunction(props.data)
        }
      })
    })
    const dragListeners = computed(() => {
      let result = {}
      if (props.draggable && !props.disableAll && !props.data?.disabled) {
        result = {
          dragstart: handleDragStart
        }
      }
      return result
    })
    const dropListeners = computed(() => {
      let result = {}
      if (props.droppable) {
        result = {
          dragenter: handleDragEnter.bind(getCurrentInstance()),
          dragover: handleDragOver.bind(getCurrentInstance()),
          dragleave: handleDragLeave.bind(getCurrentInstance()),
          drop: handleDrop.bind(getCurrentInstance())
        }
      }
      return result
    })

    function handleExpand(): void {
      if (props.data?.isLeaf) return
      emit('expand', fullData.value)
    }

    function handleCheck(): void {
      if (props.disableAll || props.data?.disabled || !props.checkable) return
      emit('check', fullData.value)
    }
    function onSelectChange(): void {
      console.log(scope, fullData.value, props, props.getTreeNode?.(), 'this')
    }
    function deepsetVisieble() {

    }

    function handleSelect(e: MouseEvent): void {
      emit('click', fullData.value, e)
      if (props.selectable) {
        if (props.disableAll || props.data?.disabled) return
        if (props.data?.selected && !props.unselectOnClick) return
        emit('select', fullData.value)
      } else if (props.checkable) {
        handleCheck()
      } else {
        handleExpand()
      }
      onSelectChange()
    }

    function handleDblclick(e: MouseEvent): void {
      emit('node-dblclick', fullData.value, e)
    }

    function handleRightClick(e: MouseEvent): void {
      emit('node-right-click', fullData.value, e)
    }

    //#region Drag handlers
    /** 计算拖拽到节点的哪个部分 */
    const nodeBody = ref()
    function getHoverPart(e: DragEvent) {
      const boundingClientRect = nodeBody.value.getBoundingClientRect()
      const height = boundingClientRect.height
      const y = e.clientY - boundingClientRect.top
      if (y <= height * 0.3) return dragHoverPartEnum.before
      if (y <= height * (0.3 + 0.4)) return dragHoverPartEnum.body
      return dragHoverPartEnum.after
    }

    /**
     * 重置 dragover 标志位
     * @param hoverPart 计算出的拖拽部分
     * @param isLeaveOrDrop 是否是 dragleave 或者 drop 事件，如果是则不再把标志位置为 true
     */
    function resetDragoverFlags(
      hoverPart: dragHoverPartEnum,
      isLeaveOrDrop = false
    ) {
      dragoverBefore.value = false
      dragoverBody.value = false
      dragoverAfter.value = false
      if (!isLeaveOrDrop) {
        if (hoverPart === dragHoverPartEnum.before) dragoverBefore.value = true
        else if (hoverPart === dragHoverPartEnum.body) dragoverBody.value = true
        else if (hoverPart === dragHoverPartEnum.after)
          dragoverAfter.value = true
      }
    }

    function handleDragStart(e: DragEvent): void {
      if (e.dataTransfer) {
        e.dataTransfer.setData('node', JSON.stringify(props.data))
      }
      if (props.data?.expand) handleExpand()
      emit('node-dragstart', fullData.value, e)
    }

    function handleDragEnter(e: DragEvent): void {
      e.preventDefault()
      const hoverPart = getHoverPart(e)
      resetDragoverFlags(hoverPart)
      emit('node-dragenter', fullData.value, e, hoverPart)
    }

    function handleDragOver(e: DragEvent): void {
      e.preventDefault()
      const hoverPart = getHoverPart(e)
      resetDragoverFlags(hoverPart)
      emit('node-dragover', fullData.value, e, hoverPart)
    }

    function handleDragLeave(e: DragEvent): void {
      const hoverPart = getHoverPart(e)
      resetDragoverFlags(hoverPart, true)
      emit('node-dragleave', fullData.value, e, hoverPart)
    }

    function handleDrop(e: DragEvent): void {
      const hoverPart = getHoverPart(e)
      resetDragoverFlags(hoverPart, true)
      emit('node-drop', fullData.value, e, hoverPart)
    }
    const scope = this
    function isSubActive() {
      return props.data?.subSelected
    }

    return {
      /** 节点拖拽 dragover */
      dragoverBody,
      /** 节点前拖拽 dragover */
      dragoverBefore,
      /** 节点后拖拽 dragover */
      dragoverAfter,
      wrapperCls,
      nodeBodyCls,
      dropBeforeCls,
      dropAfterCls,
      // squareCls,
      expandCls,
      loadingIconCls,
      titleCls,
      fullData,
      renderFunction,
      renderComponent,
      renderIconFunction,
      renderIconComponent,
      dragListeners,
      dropListeners,
      // titleField,
      handleExpand,
      handleCheck,
      handleSelect,
      handleDblclick,
      handleRightClick,
      nodeBody
    }
  }
})
</script>
