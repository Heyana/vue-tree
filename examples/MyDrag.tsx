import { Ref, defineComponent, ref } from 'vue'
import VTree from '../src'
import treeDataGenerator from '../tests/tree-data-generator'

export default defineComponent({
  name: 'MyDrag',
  setup: () => () => com()
})
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
const tree:Ref< any> = ref(null as any)
const com = () => (
  <div>
    <VTree
      data={data.value}
      selectable
      draggable
      ref={tree}
      droppable
      onNodeDrop="handleDrop"
      unselectOnClick={false}
      render={
        ({data,emit,nodeData}) => {
          console.log(data,'item');
          return <div class='my_drag_item'>
            <div class='test'>{data.title}</div>
            <div class='main' onClick={()=>{
              console.log(nodeData,'nodeData');
              const newState = !nodeData.reacData.showElement
              data.children?.map((i)=>{
                i.reacData.showElement = newState
              })
              nodeData.reacData.showElement = newState
              // console.log(tree.value.nonReactive,refData.value.children,data.children,'tree.value.nonReactive');
              // tree.value.nonReactive.store.changeNode({
              //   type:"showElement",
              //   data,
              // })
            }}>{nodeData.reacData.showElement===false?'隐藏' : "显示"}</div>
          </div>
        }
      }
    ></VTree>
  </div>
)
