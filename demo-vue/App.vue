<template>
    <j-jflow
        style="width: 600px; height: 300px; border: 1px solid #000"
        :genVueComponentKey="genVueComponentKey"
        :configs="configs">
        <template #VirtualNode="{ source }">
            <virtual-node :node="source" ></virtual-node>
        </template>
        <template #plainlink="{ configs }">
            <jBezierLink
                :configs="{
                    ...configs,
                    content: configs.part,
                    backgroundColor: '#EB6864',
                    fontSize: '24px'
                }"
                :from="configs.from.source"
                :to="configs.to.source">
            </jBezierLink>
        </template>
    </j-jflow>
</template>
<script>
import DemoLayout from '../demo-layout';
import VirtualNode from './virtual-node.vue';
import { commonEventAdapter } from '@joskii/jflow';
import source from '../data.json'
const layout = new DemoLayout(source);
export default {
    components: {
        VirtualNode,
    },
    data() {
        return {
            configs: {
                allowDrop: false,
                layout,
                eventAdapter: commonEventAdapter
            }
        }
    },
    methods: {
        genVueComponentKey(source){
            console.log(source)
            return source.name;
        }
    }
};
</script>