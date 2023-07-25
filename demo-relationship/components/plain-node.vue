<template>
    <j-group :source="node" :configs="configs" v-on="$listeners">
        <j-text
            :configs="{
                fontSize: '16px',
                fontWeight: 'bold',
                textColor,
                textAlign: 'center',
                content: node.name
            }"></j-text>
    </j-group>
</template>

<script>
import { LinearLayout } from '@joskii/jflow';
export default {
    props: {
        node: Object,
    },
    data() {
        let backgroundColor;
        let color;
        
        if(this.node.concept === 'entity') {
            backgroundColor = '#37371F'
            color = "#fff"
        }
        if(this.node.isStructure || this.node.concept === 'structure') {
            backgroundColor = '#EA9010'
            color = "#fff"
        }
        if(this.node.concept === 'logic') {
            backgroundColor = '#90BE6D'
            color = "#000"
        }
        if(this.node.concept === 'viewlogic') {
            backgroundColor = '#C9E3AC'
            color = "#000"
        }
        if(this.node.concept === 'viewevents') {
            backgroundColor = '#CECE5A'
            color = "#000"
        }
        if(this.node.concept === 'view') {
            backgroundColor = '#EAEFBD'
            color = "#000"
        }
        return {
            folded: false,
            textColor: color,
            configs: {
                layout: new LinearLayout({
                    direction: 'vertical',
                    gap: 0,
                }),
                borderColor: '#A3BF69',
                backgroundColor,
                borderWidth: 2,
                borderRadius: 0,
                padding: 20,
            },
        };
    },
};
</script>

<style>
</style>
