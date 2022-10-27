<template>
    <div style="display: block;
    width: 100vw; height: 90vh;
    border: 1px solid #000;
    overflow: visible;
    position: relative;">
        <div style="display: block;
        width: 100%; height: 100%;">
        <j-jflow
            v-if="curData"
            ref="jflow"
            style="width: 100%;height: 100%;"
            :configs="configs"
            :gen-vue-component-key="genVueComponentKey">
            <template #Structure="{ source }">
                <j-er-node-comp
                    v-if="showProperty"
                    :node="source">
                </j-er-node-comp>
                <j-plain-node
                    v-else
                    :node="source">
                </j-plain-node>
            </template>
            <template #Logic="{ source }">
                <j-er-node-comp
                    v-if="showProperty"
                    :node="source">
                </j-er-node-comp>
                <j-plain-node
                    v-else
                    :node="source">
                </j-plain-node>
            </template>
            <template #View="{ source }">
                <j-plain-node
                    :node="source">
                </j-plain-node>
            </template>
            <template #Entity="{ source }">
                <j-plain-node
                    :node="source">
                </j-plain-node>
            </template>
            <template #plainlink="{ configs }">
                <jBezierLink
                    :configs="configs"
                    :from="configs.from.source"
                    :to="configs.to.source">
                </jBezierLink>
            </template>
        </j-jflow>
        </div>

        <div>
            <button @click="$refs.scriptdialog.showModal()">get script</button>
            <button @click="importData">import data</button> 
            <!-- <select @change="onChange">
                <option v-for="op in options"
                    :value="op.value" 
                    :key="op.value">
                    {{ op.text }}
                </option>
            </select> -->

            <button @click="toggleView">toggle View ({{ configs.layout.viewVisible }})</button>
            <button @click="toggleLogic">toggle Logic ({{ configs.layout.logicVisible }})</button>
            <button @click="toggleStructure">toggle Sturcture ({{ configs.layout.structureVisible }})</button>
            <button @click="toggleLcap">toggle LCAP ({{ configs.layout.LCAPvisible }})</button>
            <button @click="toggleFilterMultiRef">toggle multiRef Filter ({{ configs.layout.multiRefFilter }})</button>
            <button @click="toggleFilterMultiRefLogic">toggle multiRef Logic Filter ({{ configs.layout.multiLogicRefFilter }})</button>
            <button @click="togglePrimary">toggle Primary Filter ({{ configs.layout.primaryFilter }})</button>
           <br>
            <label>
                filterBy: <input v-model="filterContent" /> 
                <button @click="doFilter('structure')">Struture</button>
                <button @click="doFilter('logic')">Logic</button>
                <button @click="doFilter('view')">View</button>
            </label>
            <button @click="toggleProperty">toggle property ({{ showProperty }})</button>
        </div>
        <dialog ref="datamodal">
            <form method="dialog">
                <p>
                <label>
                    <span style="vertical-align: top;">json: </span>
                    <textarea style="white-space: pre;width: 600px; height:400px" v-model="currJSON"></textarea>
                </label>
                </p>
                <div>
                    <button value="cancel">close</button>
                    <button id="confirmBtn" value="default" @click="importJSON">confirm</button>
                </div>
            </form>
        </dialog>
        <dialog ref="scriptdialog">
            <form method="dialog">
            <textarea style="white-space: pre;width: 600px; height:400px">
                function figureOutRefs(result) {
                    const refByLogic = [];
                    const refByView = [];
                    const refByOther = [];
                    for (const entry of result) {
                        const n = entry[0];
                        
                        switch(n.concept) {
                            case 'Logic': 
                                refByLogic.push(entry[0].name);
                                break;
                            case 'View':
                                let v = entry[1];
                                function iterate(node, lastName) {
                                    node.children.forEach(c => {
                                        if(c.node.concept === 'View') {
                                            iterate(c, c.node.name);
                                        } else {
                                            if(lastName) {
                                                refByView.push(lastName)
                                            }
                                        }
                                    })
                                }
                                iterate(v, v.node.name);
                                break;
                            default: 
                                refByOther.push(entry[0].name);
                        }
                    }
                    return {
                        refByLogic,
                        refByView,
                        refByOther,
                    }
                }
                Promise.all([
                    Promise.all($data.app.logics.map(async s => { 
                        const result = await window.globalData.naslServer.findReferences(s);
                        const {
                            refByLogic,
                            refByView,
                            refByOther,
                        } = figureOutRefs(result);

                        return {
                            name: s.name,
                            param: s.params.map(p => ({
                                ref: p.typeAnnotation.typeKey,
                                name: p.name,
                            })),
                            return: s.returns.map(p => ({
                                ref: p.typeAnnotation.typeKey,
                                name: p.name,
                            })),
                            refByLogic:  Array.from(new Set(refByLogic)),
                            refByView: Array.from(new Set(refByView)),
                            refByOther
                        }
                    })).then(res => {
                        return res
                    }),
                    Promise.all($data.app.structures.map(async s => { 
                        const result = await window.globalData.naslServer.findReferences(s);
                        const {
                            refByLogic,
                            refByView,
                            refByOther,
                        } = figureOutRefs(result);
                        
                        return {
                            structure: s.name,
                            properties: s.properties.map(p => {
                                return {
                                    ref: p.typeAnnotation.typeKey,
                                    name: p.name
                                }
                            }),
                            refByLogic,
                            refByView: Array.from(new Set(refByView)),
                            refByOther
                        }
                    })).then(res => {
                        return res
                    })
                ]).then(([logics, structures]) => {
                    console.log(JSON.stringify({ logics, structures }, null, '\t'));
                })
            </textarea>
            <button value="cancel">close</button>
            </form>
        </dialog>
    </div>
</template>

<script>
import erNodeComp from './components/er-node.vue';
import plainNode from './components/plain-node.vue';
import ERLayout from './layout/er-layout';
// import data1 from './relations-youdata.json';
// import data2 from './relations-jiaolian.json';
// import data3 from './relations-wenjuan.json';
// import data4 from './relations-zichan.json';
import { createRelataion } from './relation';
// const DATA1 = createRelataion(data1);
// const DATA2 = createRelataion(data2);
// const DATA3 = createRelataion(data3);
// const DATA4 = createRelataion(data4);
export default {
    name: 'jflow-er-diagram',
    components: {
        'j-er-node-comp': erNodeComp,
        'j-plain-node': plainNode,
    },
    data() {
        // const layout = new ERLayout({ });
        // this.curData = [];        
        return {
            jflowloading: false,
            configs: {
                allowDrop: true,
                layout: {},
                initialZoom: 1,
                minZoom: 0.0001,
                NodeRenderTop: true,
            },
            filterContent: '',
            showProperty: false,
            curData: null,
            currJSON: '',
            // options: [
            //     { text: '有数', value: '1', data: Object.freeze(DATA1), },
            //     { text: '教练管理', value: '2', data: Object.freeze(DATA2) },
            //     { text: '问卷', value: '3', data: Object.freeze(DATA3) },
            // ]
        };
    },
    methods: {
        // onChange(event) {
        //     switch(event.target.value) {
        //         case '1':
        //             this.configs.layout.reOrder(DATA1);
        //             this.curData = DATA1
        //             break;
        //         case '2':
        //             this.configs.layout.reOrder(DATA2);
        //             this.curData = DATA2
        //             break;
        //         case '3':
        //             this.configs.layout.reOrder(DATA3);
        //             this.curData = DATA3
        //             break;
        //         case '4':
        //             this.configs.layout.reOrder(DATA4);
        //             this.curData = DATA4
        //             break;
        //     }
            
        //      this.$refs.jflow.reflow();
        // },
        genVueComponentKey(source) {
            return source.id;
        },
        rerender(){
            this.configs.layout.reOrder(this.curData);
            this.$refs.jflow.reflow();
        },
        toggleView() {
            this.configs.layout.toggleView();
            this.rerender();
        },
        toggleLogic() {
            this.configs.layout.toggleLogic();
            this.rerender();
        },
        toggleStructure() {
            this.configs.layout.toggleStructure();
            this.rerender();
        },

        toggleLcap() {
            this.configs.layout.toggleLcap();
            this.rerender();
        },

        toggleFilterMultiRef() {
            this.configs.layout.toggleFilterMultiRef();
            this.rerender();
        },
        togglePrimary() {
            this.configs.layout.togglePrimaryFilter();
            this.rerender();
        },
        toggleFilterMultiRefLogic() {
            this.configs.layout.toggleMultiLogicRefFilter();
            this.rerender();
        },
        doFilter(part) {
            this.configs.layout.doFilter(this.filterContent, part);
            this.rerender();
        },
        toggleProperty() {
            this.showProperty = !this.showProperty;
            this.configs.layout.toggleProperty(this.showProperty);
            this.rerender();
        },
        importData() {
            this.$refs.datamodal.showModal()
        },
        importJSON () {
            const data = Object.freeze(createRelataion(JSON.parse(this.currJSON)));
            this.curData = data;
            if(this.$refs.jflow) {
                this.rerender();
            } else {
                 this.configs.layout = new ERLayout(data);
            }
        }
    },
};
</script>

