<template>
    <j-group :source="node" :configs="configs" v-on="$listeners">
        <j-group :configs="headerConfigs">
            <j-text
                :configs="{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textColor: '#1C1E21',
                    textAlign: 'center',
                    content: node.name
                }"></j-text>
        </j-group>
        <j-group :configs="bodyConfigs">
            <j-group :configs="propertyConfig">
                <template v-if="node.properties && node.properties.length">
                    <er-property v-for="(property) in node.properties" :node="property" :key="property.name"></er-property>
                </template>
                <template v-if="node.param && node.param.length">
                    <j-text
                        :configs="{
                        fontSize: '12px',
                        textColor: '#1C1E21',
                        textAlign: 'left',
                        content: 'params:'
                    }"></j-text>
                    <er-property v-for="(property) in node.param" :node="property" :key="property.name"></er-property>
                </template>
                <template v-if="node.return && node.return.length">
                    <j-text
                        :configs="{
                        fontSize: '12px',
                        textColor: '#1C1E21',
                        textAlign: 'left',
                        content: 'returns:'
                    }"></j-text>
                    <er-property v-for="(property) in node.return" :node="property" :key="property.name"></er-property>
                </template>
            </j-group>
        </j-group>
    </j-group>
</template>

<script>
import { LinearLayout } from '@joskii/jflow';
import erProperty from './er-property.vue';
export default {
    components: {
        'er-property': erProperty,
    },
    props: {
        node: Object,
    },
    data() {
        console.log(this.node)
        return {
            folded: false,
            configs: {
                layout: new LinearLayout({
                    direction: 'vertical',
                    gap: 0,
                }),
                borderColor: '#A3BF69',
                backgroundColor: '#ECF2E1',
                borderWidth: 2,
                borderRadius: 0,
            },
            bodyConfigs: {
                layout: new LinearLayout({
                    direction: 'vertical',
                    gap: 0,
                    alignment: 'start',
                }),
                display: 'block',
                backgroundColor: '#fff',
                borderRadius: 0,
                borderColor: '#A3BF69',
                borderWidth: 2,
            },
            headerConfigs: {
                layout: new LinearLayout({
                    direction: 'horizontal',
                    gap: 0,
                    alignment: 'center',
                }),
                paddingTop: 2,
                paddingBottom: 2,
                paddingLeft: 15,
                paddingRight: 15,
            },
            propertyConfig: {
                layout: new LinearLayout({
                    direction: 'vertical',
                    gap: 0,
                    alignment: 'start',
                }),
                border: {
                    bottom: {
                        borderColor: '#A3BF69',
                        borderWidth: 2,
                    },
                },
            },
        };
    },
};
</script>

<style>
</style>
