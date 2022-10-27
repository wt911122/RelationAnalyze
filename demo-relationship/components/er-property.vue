<template>
    <j-group
        :source="node"
        :configs="groupConfig"
        v-on="$listeners">
        <j-text :configs="{
            fontSize: '12px',
            minWidth: 110,
            textAlign: 'left',
            textColor: '#1C1E21',
            content: `${node.name}<${typeof node.ref === 'string' ? node.ref : node.ref.name }>`,
        }"></j-text>
        <!-- <j-text :configs="{
            fontSize: '12px',
            minWidth: 220,
            textAlign: 'left',
            textColor: '#1C1E21',
            content: node.label,
        }"></j-text> -->

    </j-group>
</template>

<script>
import { LinearLayout } from '@joskii/jflow';
export default {
    props: {
        node: Object,
        odd: Boolean,
    },
    computed: {
        groupConfig() {
            return {
                layout: new LinearLayout({
                    direction: 'horizontal',
                    gap: 5,
                }),
                paddingTop: 4,
                paddingBottom: 4,
                margin: 2,
                paddingLeft: 10,
                backgroundColor: 'transparent',
                borderWidth: 0,
            };
        },
    },
};
</script>

<style>

</style>
