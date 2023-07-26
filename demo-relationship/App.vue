<template>
    <div style="display: block;
    width: 100vw; height: 90vh;
    border: 1px solid #000;
    overflow: visible;
    position: relative;">
    <div style="position:absolute; left: 20px; top: 10px;z-index: 1000;">
        <span class="legend entity">实体</span>
        <span class="legend structure">结构</span>
        <span class="legend globallogic">全局逻辑</span>
        <span class="legend viewlogic">页面逻辑</span>
        <span class="legend viewevent">页面事件</span>
        <span class="legend view">页面</span>
        <label class="legend">
            搜索: <input v-model="searchContent" @keydown="onkeydown" /> 
            <span>{{ count }}</span> of <span>{{ total }}</span>
        </label>
    </div>
        <div style="display: block;
        width: 100%; height: 100%;">
        <j-jflow
            v-if="curData"
            ref="jflow"
            style="width: 100%;height: 100%;"
            :configs="configs"
            :gen-vue-component-key="genVueComponentKey"
            :loading.sync="jflowloading">
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
            <template #ViewLogic="{ source }">
                <j-er-node-comp
                    v-if="showProperty"
                    :node="source">
                </j-er-node-comp>
                <j-plain-node
                    v-else
                    :node="source">
                </j-plain-node>
            </template>
            <template #ViewEvent="{ source }">
                <j-plain-node
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
        <div class="minimap">
            <div class="content" ref="minimap">
            </div>
        </div> 
        </div>

        <div>
            <button @click="$refs.scriptdialog.showModal()">get script</button>
            <button @click="importData">import data</button> 
            <span>{{ statistics }}</span>
            <br />
            <!-- <select @change="onChange">
                <option v-for="op in options"
                    :value="op.value" 
                    :key="op.value">
                    {{ op.text }}
                </option>
            </select> -->
<!-- 
            <button @click="toggleView">toggle View ({{ configs.layout.viewVisible }})</button>
            <button @click="toggleLogic">toggle Logic ({{ configs.layout.logicVisible }})</button>
            <button @click="toggleStructure">toggle Sturcture ({{ configs.layout.structureVisible }})</button> -->
            <!-- <button @click="toggleLcap">toggle LCAP ({{ configs.layout.LCAPvisible }})</button> -->
            <!-- <button @click="toggleFilterMultiRef">toggle multiRef Filter ({{ configs.layout.multiRefFilter }})</button> -->
            <!-- <button @click="toggleFilterMultiRefLogic">toggle multiRef Logic Filter ({{ configs.layout.multiLogicRefFilter }})</button> -->
            <!-- <button @click="togglePrimary">toggle Primary Filter ({{ configs.layout.primaryFilter }})</button> -->
           <!-- <br>
            <label>
                filterBy: <input v-model="filterContent" /> 
                <button @click="doFilter('Structure')">Struture</button>
                <button @click="doFilter('Logic')">Logic</button>
                <button @click="doFilter('ViewLogic')">ViewLogic</button>
                <button @click="doFilter('View')">View</button>
            </label>
            <button @click="toggleProperty">toggle property ({{ showProperty }})</button> -->
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
                function getFullName(node) {
                    return `${node.getNamespace()}.${node.name}`;
                }
                function figureOutRefs(result) {
                    const refByLogic = [];
                    const refByView = [];
                    const refByViewEvent = [];
                    const refByViewLogic = [];
                    const refBySturcture = [];
                    const refByOther = [];
                    for (const entry of result) {
                        const n = entry[0];
                        
                        switch(n.concept) {
                            
                            case 'Logic': 
                                refByLogic.push(getFullName(entry[0]));
                                break;
                            case 'Structure':
                                refBySturcture.push(getFullName(entry[0]));
                                break;
                            case 'View':
                            case 'Frontend':
                
                                let v = entry[1];
                                function iterate(node, lastName) {
                                    node.children.forEach(c => {
                                        switch(c.node.concept) {
                                            case 'View':
                                            case 'Frontend': 
                                                iterate(c, `${lastName}/${c.node.name}`);
                                                break
                                            case 'ViewElement':
                                                iterate(c, lastName);
                                                break;
                                            case 'Logic':
                                                refByViewLogic.push({
                                                    view: lastName,
                                                    logic: c.node.name,
                                                })
                                                break;
                                            case 'BindEvent':
                                                refByViewEvent.push({
                                                    view: lastName,
                                                    element: c.node.parentNode.name,
                                                    event: 'click',
                                                })
                                                break;
                                            default: 
                                                refByView.push(lastName)
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
                        refByViewLogic,
                        refByViewEvent,
                        refBySturcture,
                    }
                }
                
                function getTypeKey(node) {
                    return (node.typeAnnotation || node.__TypeAnnotation)?.typeKey;
                }
                Promise.all([
                    Promise.all($data.app.dataSources.map(async ds => {
                            // const dsname = ds.name;
                            const r = await Promise.all(ds.entities.map(async entity => {
                                const result = await window.globalData.naslServer.findReferences(entity);
                                const {
                                    refByLogic,
                                    refByView,
                                    refByOther,
                                    refByViewLogic,
                                    refByViewEvent,
                                    refBySturcture
                                } = figureOutRefs(result);
                                return {
                                    entity: getFullName(entity),
                                    refByLogic,
                                    refByView: Array.from(new Set(refByView)),
                                    refByViewLogic,
                                    refByViewEvent,
                                    refBySturcture,
                                    refByOther
                                }
                            }));
                            return r;
                        })).then(res => {
                            return res.flat();
                        }),
                    Promise.all($data.app.logics.map(async s => { 
                        const result = await window.globalData.naslServer.findReferences(s);
                        const {
                            refByLogic,
                            refByView,
                            refByOther,
                            refByViewLogic,
                            refByViewEvent
                        } = figureOutRefs(result);
                
                        return {
                            name: getFullName(s),
                            param: s.params.map(p => ({
                                ref: getTypeKey(p),
                                name: p.name,
                            })),
                            return: s.returns.map(p => ({
                                ref: getTypeKey(p),
                                name: p.name,
                            })),
                            refByLogic: Array.from(new Set(refByLogic)),
                            refByView: Array.from(new Set(refByView)),
                            refByViewLogic,
                            refByViewEvent,
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
                            refByViewLogic,
                            refByViewEvent,
                            refBySturcture,
                            refByOther,
                        } = figureOutRefs(result);
                        
                        return {
                            structure: getFullName(s),
                            properties: s.properties.map(p => {
                                return {
                                    ref: getTypeKey(p),
                                    name: p.name
                                }
                            }),
                            refByLogic,
                            refByView: Array.from(new Set(refByView)),
                            refByViewLogic,
                            refByViewEvent,
                            refBySturcture,
                            refByOther
                        }
                    })).then(res => {
                        return res
                    }),
                    Promise.resolve(
                        $data.app.frontends.map(f => f.views.map(v => {
                            const viewNames = [];
                            function iterate(viewNode, lastName) {
                
                                viewNode.getViewBindEvents();
                
                                viewNames.push({
                                    name: lastName,
                                    logics: viewNode.logics.map(l => ({
                                        name: l.name,
                                        param: l.params.map(p => ({
                                            ref: getTypeKey(p),
                                            name: p.name,
                                        })),
                                        return: l.returns.map(p => ({
                                            ref: getTypeKey(p),
                                            name: p.name,
                                        }))
                                    })),  
                                    events: viewNode.getViewBindEvents().map(bindEvent => ({
                                        element: bindEvent.parentNode.name,
                                        event: bindEvent.name,
                                    }))
                                });
                                viewNode.children.forEach(c => {
                                    iterate(c, `${lastName}/${c.name}`);
                                })
                            }
                            iterate(v, `${f.name}/${v.name}`);
                            return viewNames;
                        }).reduce((accu, curr) => accu.concat(curr), [])).flat())
                ]).then(([entities, logics, structures, views]) => {
                    console.log(JSON.stringify({ entities, logics, structures, views }, null, '\t'));
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
import ERLayout from './layout/er-layout2';
// import data1 from './relations-devops.json';
// import data2 from './relations-jiaolian.json';
// import data3 from './relations-wenjuan.json';
// import data4 from './relations-zichan.json';
import { createRelataion } from './relation';
// const DATA1 = createRelataion(data1);
// const DATA1 = createRelataion(data1);
// const DATA2 = createRelataion(data2);
// const DATA3 = createRelataion(data3);
// const DATA4 = createRelataion(data4);
import SearchTool from './search-tool';
export default {
    name: 'jflow-er-diagram',
    components: {
        'j-er-node-comp': erNodeComp,
        'j-plain-node': plainNode,
    },
    provide() {
        return {
            recordAsIndex: this.recordAsIndex,
        }
    },
    data() {
        // const layout = new ERLayout({ });
        // this.curData = [];        
        return {
            jflowloading: true,
            configs: {
                allowDrop: true,
                layout: {},
                initialZoom: 1,
                minZoom: 0.0001,
                NodeRenderTop: true,
            },
            searchContent: '',
            filterContent: '',
            showProperty: false,
            curData: null,
            currJSON: '',
            total: 0,
            count: 0,
            // options: [
            //     { text: '有数', value: '1', data: Object.freeze(DATA1), },
            //     { text: '教练管理', value: '2', data: Object.freeze(DATA2) },
            //     { text: '问卷', value: '3', data: Object.freeze(DATA3) },
            // ]
        };
    },
    computed: {
        statistics() {
            if(this.curData) {
                return `entities: ${this.curData.entities.length}, structures: ${this.curData.structures.length}, logics: ${this.curData.logics.length}, views: ${this.curData.views.length}`
            }
            return ''
        }
    },
    watch: {
        searchContent(content) {
            this.searchTool.request(content);
            this.searchTool.toggleFirstSeach(true);
            this.total = this.searchTool.total;
            const jflow = this.getJFlowInstance();
            jflow.scheduleRender(() => {
                this.count = this.searchTool.current;
                // this.searchTool.toggleFirstSeach(false);
            });

        },
        jflowloading(val) {
            if(!val) {
                const searchTool = new SearchTool();
                searchTool.index(this.curData);
                searchTool.registToJflow(this.getJFlowInstance());
                this.searchTool = searchTool;
                this.captureMap();
            }
        }
    },
    // mounted() {
    //     const data = Object.freeze(createRelataion(data1));
    //     this.curData = data;
    //     if(this.$refs.jflow) {
    //         this.rerender();
    //     } else {
    //             this.configs.layout = new ERLayout(data);
    //     }
    // },
    methods: {
        getJFlowInstance() {
            try {
                return this.$refs.jflow.getInstance();
            } catch (err) {
                // eslint-disable-next-line no-throw-literal
                throw 'jflow has been destroyed!';
            }
        },
        onkeydown(event) {
            
            if(event.code === 'Enter') {
                console.log('Enter');
                const jflow = this.getJFlowInstance();
                this.searchTool.next(jflow);
                this.count = this.searchTool.current;
                
            }
        },
        captureMap() {
            if (!this.$refs.jflow) {
                return;
            }
            const jflowInstance = this.getJFlowInstance();
            jflowInstance.captureMap(this.$refs.minimap, {
                padding: 10,
                placement: 'center',
            });
        },

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

