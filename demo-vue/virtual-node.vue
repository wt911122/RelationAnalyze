<template>
    <!-- jflowId 就是 layoutNode 中 ID -->
    <j-group 
        :source="node"
        @click="onClick" 
        :configs="configs">
        <j-text :configs="{
            textColor: '#EB6864',
            content: node.name,
        }">
        </j-text>
    </j-group>
</template>
<script>
import { LinearLayout } from '@joskii/jflow';
const layout = new LinearLayout({
    direction: 'vertical',
    gap: 0,
});
export default {
    props: {
        node: Object,
    },
    data() {
        return {
            configs: {
                layout,
                borderRadius: 8,
                borderColor: '#EB6864',
                borderWidth: 2,
                padding: 20,
            }
        }
    },
    methods: {
        onClick() {
            console.log('click', this.meta)
        }
    }
}
</script>