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
            :loading.sync="jflowloading"
            @zoompan="onZoompan">
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
import MiniMapTool from './minimap-tool';
export default {
    name: 'jflow-er-diagram',
    components: {
        'j-er-node-comp': erNodeComp,
        'j-plain-node': plainNode,
    },
    provide() {
        return {
            recordAsIndex: this.recordAsIndex,
            hoverNode: this.hoverNode,
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
            currJSON: `{
	"entities": [
		{
			"entity": "app.dataSources.defaultDS.entities.Student",
			"refByLogic": [
				"app.logics.loadSssTableView",
				"app.logics.loadStudentTableView"
			],
			"refByView": [
				"pc",
				"pc/sss",
				"pc/dashboard/student"
			],
			"refByViewLogic": [],
			"refByViewEvent": [
				{
					"view": "pc/sss",
					"element": "link2",
					"event": "click"
				},
				{
					"view": "pc/sss",
					"element": "button3",
					"event": "click"
				},
				{
					"view": "pc/sss",
					"element": "button4",
					"event": "click"
				},
				{
					"view": "pc/dashboard/student",
					"element": "link2",
					"event": "click"
				},
				{
					"view": "pc/dashboard/student",
					"element": "button3",
					"event": "click"
				},
				{
					"view": "pc/dashboard/student",
					"element": "button4",
					"event": "click"
				}
			],
			"refBySturcture": [],
			"refByOther": []
		},
		{
			"entity": "app.dataSources.defaultDS.entities.School",
			"refByLogic": [
				"app.logics.loadSchoolTableView",
				"app.logics.loadSssSelectSchool",
				"app.logics.loadSssTableView",
				"app.logics.loadStudentSelectSchool",
				"app.logics.loadStudentTableView"
			],
			"refByView": [
				"pc/dashboard/school"
			],
			"refByViewLogic": [],
			"refByViewEvent": [
				{
					"view": "pc/dashboard/school",
					"element": "link2",
					"event": "click"
				},
				{
					"view": "pc/dashboard/school",
					"element": "button3",
					"event": "click"
				},
				{
					"view": "pc/dashboard/school",
					"element": "button4",
					"event": "click"
				}
			],
			"refBySturcture": [],
			"refByOther": [
				"defaultDS"
			]
		},
		{
			"entity": "app.dataSources.defaultDS.entities.LCAPLogicViewMapping",
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refBySturcture": [],
			"refByOther": []
		},
		{
			"entity": "app.dataSources.defaultDS.entities.LCAPUser",
			"refByLogic": [
				"app.logics.LCAPGetAllUsers",
				"app.logics.LCAPGetUserByUserId",
				"app.logics.LCAPGetUserList",
				"app.logics.LCAPGetUserTableView"
			],
			"refByView": [
				"pc/permission_center/userManagement"
			],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/addRoleUser",
					"logic": "getUsersListFromNumis"
				},
				{
					"view": "pc/permission_center/userManagement",
					"logic": "submit"
				}
			],
			"refByViewEvent": [
				{
					"view": "pc/permission_center/addRoleUser",
					"element": "uButton2",
					"event": "click"
				},
				{
					"view": "pc/permission_center/userManagement",
					"element": "button5",
					"event": "click"
				}
			],
			"refBySturcture": [],
			"refByOther": [
				"defaultDS"
			]
		},
		{
			"entity": "app.dataSources.defaultDS.entities.LCAPRolePerMapping",
			"refByLogic": [
				"app.logics.LCAPGetPermissionByRoleId",
				"app.logics.LCAPGetResourceListByRoleId",
				"app.logics.LCAPGetRolePermissionList",
				"app.logics.LCAPGetScopeResourceByRoleId",
				"app.logics.LCAPGetUserResources"
			],
			"refByView": [
				"pc/permission_center/roleManagement"
			],
			"refByViewLogic": [],
			"refByViewEvent": [
				{
					"view": "pc/permission_center/roleManagement",
					"element": "uLink2",
					"event": "click"
				},
				{
					"view": "pc/permission_center/roleManagement",
					"element": "uButton6",
					"event": "click"
				}
			],
			"refBySturcture": [],
			"refByOther": []
		},
		{
			"entity": "app.dataSources.defaultDS.entities.LCAPPerResMapping",
			"refByLogic": [
				"app.logics.LCAPGetMappingByPermissionIdAndResourceId",
				"app.logics.LCAPGetResourceListByRoleId",
				"app.logics.LCAPGetScopeResourceByRoleId",
				"app.logics.LCAPGetUserResources"
			],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [
				{
					"view": "pc/permission_center/resourceManagement",
					"element": "uButton2",
					"event": "click"
				},
				{
					"view": "pc/permission_center/resourceManagement",
					"element": "uButton4",
					"event": "click"
				}
			],
			"refBySturcture": [],
			"refByOther": []
		},
		{
			"entity": "app.dataSources.defaultDS.entities.LCAPUserRoleMapping",
			"refByLogic": [
				"app.logics.LCAPGetMappingIdByRoleIdAndUserId",
				"app.logics.LCAPGetRoleBindUserList",
				"app.logics.LCAPGetUserResources",
				"app.logics.LCAPIsAlreadBindUserIdList",
				"app.logics.LCAPLoadUserRoleMappingTableView",
				"app.logics.LCAPRoleBindUsers",
				"app.logics.LCAPUnBindUsers",
				"app.logics.loadAddRoleUserTableView"
			],
			"refByView": [
				"pc/permission_center/addRoleUser"
			],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/addRoleUser",
					"logic": "submit"
				},
				{
					"view": "pc/permission_center/addRoleUser",
					"logic": "modify"
				}
			],
			"refByViewEvent": [
				{
					"view": "pc/permission_center/addRoleUser",
					"element": "uLink1",
					"event": "click"
				},
				{
					"view": "pc/permission_center/addRoleUser",
					"element": "uButton2",
					"event": "click"
				}
			],
			"refBySturcture": [],
			"refByOther": []
		},
		{
			"entity": "app.dataSources.defaultDS.entities.LCAPRole",
			"refByLogic": [
				"app.logics.LCAPIsExistRoleId",
				"app.logics.LCAPIsRoleNameRepeated",
				"app.logics.LCAPLoadAddRoleUserSelectLCAPRole",
				"app.logics.LCAPLoadRoleManagementTableView",
				"app.logics.LCAPLoadUserRoleMappingTableView",
				"app.logics.loadAddRoleUserTableView"
			],
			"refByView": [
				"pc/permission_center/roleManagement"
			],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/addRoleUser",
					"logic": "modify"
				},
				{
					"view": "pc/permission_center/roleManagement",
					"logic": "submit"
				},
				{
					"view": "pc/permission_center/roleManagement",
					"logic": "modify"
				},
				{
					"view": "pc/permission_center/roleManagement",
					"logic": "remove"
				}
			],
			"refByViewEvent": [
				{
					"view": "pc/permission_center/roleManagement",
					"element": "uButton9",
					"event": "click"
				},
				{
					"view": "pc/permission_center/roleManagement",
					"element": "uButton2",
					"event": "click"
				},
				{
					"view": "pc/permission_center/roleManagement",
					"element": "uButton6",
					"event": "click"
				}
			],
			"refBySturcture": [],
			"refByOther": [
				"defaultDS"
			]
		},
		{
			"entity": "app.dataSources.defaultDS.entities.LCAPPermission",
			"refByLogic": [
				"app.logics.LCAPGetPermissionByRoleId",
				"app.logics.LCAPGetResourceListByRoleId",
				"app.logics.LCAPGetRolePermissionList",
				"app.logics.LCAPGetScopeResourceByRoleId",
				"app.logics.LCAPLoadPermissionManagementTableView"
			],
			"refByView": [
				"pc/permission_center/roleManagement"
			],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/roleManagement",
					"logic": "getRolePermission"
				}
			],
			"refByViewEvent": [
				{
					"view": "pc/permission_center/resourceManagement",
					"element": "uButton2",
					"event": "click"
				},
				{
					"view": "pc/permission_center/resourceManagement",
					"element": "uButton4",
					"event": "click"
				},
				{
					"view": "pc/permission_center/roleManagement",
					"element": "uLink2",
					"event": "click"
				},
				{
					"view": "pc/permission_center/roleManagement",
					"element": "uButton6",
					"event": "click"
				}
			],
			"refBySturcture": [],
			"refByOther": [
				"defaultDS"
			]
		},
		{
			"entity": "app.dataSources.defaultDS.entities.LCAPResource",
			"refByLogic": [
				"app.logics.LCAPGetResourceListByRoleId",
				"app.logics.LCAPGetScopeResourceByRoleId",
				"app.logics.LCAPGetUserResources",
				"app.logics.LCAPLoadPermissionResourceListView",
				"app.logics.LCAPLoadResourceTableView"
			],
			"refByView": [
				"pc/permission_center/resourceManagement"
			],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/resourceManagement",
					"logic": "addResource"
				},
				{
					"view": "pc/permission_center/resourceManagement",
					"logic": "loadResourceByRoleId"
				},
				{
					"view": "pc/permission_center/resourceManagement",
					"logic": "remove"
				}
			],
			"refByViewEvent": [],
			"refBySturcture": [],
			"refByOther": [
				"defaultDS"
			]
		}
	],
	"logics": [
		{
			"name": "app.logics.loadSssTableView",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "page"
				},
				{
					"ref": "nasl.core.Long",
					"name": "size"
				},
				{
					"ref": "nasl.core.String",
					"name": "sort"
				},
				{
					"ref": "nasl.core.String",
					"name": "order"
				},
				{
					"ref": "app.dataSources.defaultDS.entities.Student",
					"name": "filter"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ student: app.dataSources.defaultDS.entities.Student, school: app.dataSources.defaultDS.entities.School }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/sss",
					"logic": "load"
				}
			],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.loadSssSelectSchool",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "page"
				},
				{
					"ref": "nasl.core.Long",
					"name": "size"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ school: app.dataSources.defaultDS.entities.School }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/sss",
					"logic": "loadSelectSchool"
				}
			],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.logictestdebug",
			"param": [
				{
					"ref": "nasl.core.String",
					"name": "varstr"
				}
			],
			"return": [
				{
					"ref": "nasl.collection.List<nasl.core.String>",
					"name": "varlist"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [
				{
					"view": "pc/dashboard/testdebug",
					"element": "button2",
					"event": "click"
				}
			],
			"refByOther": []
		},
		{
			"name": "app.logics.loadSchoolTableView",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "page"
				},
				{
					"ref": "nasl.core.Long",
					"name": "size"
				},
				{
					"ref": "nasl.core.String",
					"name": "sort"
				},
				{
					"ref": "nasl.core.String",
					"name": "order"
				},
				{
					"ref": "app.dataSources.defaultDS.entities.School",
					"name": "filter"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ school: app.dataSources.defaultDS.entities.School }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/dashboard/school",
					"logic": "load"
				}
			],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.loadStudentTableView",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "page"
				},
				{
					"ref": "nasl.core.Long",
					"name": "size"
				},
				{
					"ref": "nasl.core.String",
					"name": "sort"
				},
				{
					"ref": "nasl.core.String",
					"name": "order"
				},
				{
					"ref": "app.dataSources.defaultDS.entities.Student",
					"name": "filter"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ student: app.dataSources.defaultDS.entities.Student, school: app.dataSources.defaultDS.entities.School }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/dashboard/student",
					"logic": "load"
				}
			],
			"refByViewEvent": [
				{
					"view": "pc/dashboard/testvariable",
					"element": "button1",
					"event": "click"
				}
			],
			"refByOther": []
		},
		{
			"name": "app.logics.loadStudentSelectSchool",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "page"
				},
				{
					"ref": "nasl.core.Long",
					"name": "size"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ school: app.dataSources.defaultDS.entities.School }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/dashboard/student",
					"logic": "loadSelectSchool"
				}
			],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPGetUserList",
			"param": [
				{
					"ref": "nasl.core.String",
					"name": "queryParam"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ lCAPUser: app.dataSources.defaultDS.entities.LCAPUser }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPGetUserByUserId",
			"param": [
				{
					"ref": "nasl.core.String",
					"name": "userId"
				}
			],
			"return": [
				{
					"ref": "app.dataSources.defaultDS.entities.LCAPUser",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [
				{
					"view": "pc/permission_center/addRoleUser",
					"element": "uButton2",
					"event": "click"
				}
			],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPGetAllUsers",
			"param": [],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ lCAPUser: app.dataSources.defaultDS.entities.LCAPUser }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/addRoleUser",
					"logic": "getUsersListFromNumis"
				},
				{
					"view": "pc/permission_center/userManagement",
					"logic": "getUserNameList"
				}
			],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPGetUserTableView",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "page"
				},
				{
					"ref": "nasl.core.Long",
					"name": "size"
				},
				{
					"ref": "nasl.core.String",
					"name": "sort"
				},
				{
					"ref": "nasl.core.String",
					"name": "order"
				},
				{
					"ref": "app.dataSources.defaultDS.entities.LCAPUser",
					"name": "filter"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ lCAPUser: app.dataSources.defaultDS.entities.LCAPUser }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/userManagement",
					"logic": "load"
				}
			],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPRoleBindUsers",
			"param": [
				{
					"ref": "app.structures.LCAPRoleBindUsersBody",
					"name": "roleBindUsersBody"
				}
			],
			"return": [
				{
					"ref": "nasl.core.Long",
					"name": "resultBindNum"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPLoadPermissionManagementTableView",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "page"
				},
				{
					"ref": "nasl.core.Long",
					"name": "size"
				},
				{
					"ref": "nasl.core.String",
					"name": "sort"
				},
				{
					"ref": "nasl.core.String",
					"name": "order"
				},
				{
					"ref": "app.dataSources.defaultDS.entities.LCAPPermission",
					"name": "filter"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ lCAPPermission: app.dataSources.defaultDS.entities.LCAPPermission }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPIsExistRoleId",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "roleId"
				}
			],
			"return": [
				{
					"ref": "nasl.core.Boolean",
					"name": "result"
				}
			],
			"refByLogic": [
				"app.logics.LCAPRoleBindUsers",
				"app.logics.LCAPUnBindUsers"
			],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPLoadPermissionResourceListView",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "page"
				},
				{
					"ref": "nasl.core.Long",
					"name": "size"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ lCAPResource: app.dataSources.defaultDS.entities.LCAPResource }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/resourceManagement",
					"logic": "loadListView"
				}
			],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPGetMappingByPermissionIdAndResourceId",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "permissionId"
				},
				{
					"ref": "nasl.core.Long",
					"name": "resourceId"
				}
			],
			"return": [
				{
					"ref": "nasl.collection.List<nasl.core.Long>",
					"name": "mappingIdList"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [
				{
					"view": "pc/permission_center/resourceManagement",
					"element": "uButton2",
					"event": "click"
				},
				{
					"view": "pc/permission_center/resourceManagement",
					"element": "uButton4",
					"event": "click"
				}
			],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPGetScopeResourceByRoleId",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "roleId"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ lCAPRolePerMapping: app.dataSources.defaultDS.entities.LCAPRolePerMapping, lCAPPermission: app.dataSources.defaultDS.entities.LCAPPermission, lCAPPerResMapping: app.dataSources.defaultDS.entities.LCAPPerResMapping, lCAPResource: app.dataSources.defaultDS.entities.LCAPResource }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/resourceManagement",
					"logic": "loadResourceByRoleId"
				}
			],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.loadAddRoleUserTableView",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "page"
				},
				{
					"ref": "nasl.core.Long",
					"name": "size"
				},
				{
					"ref": "nasl.core.String",
					"name": "sort"
				},
				{
					"ref": "nasl.core.String",
					"name": "order"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ lCAPUserRoleMapping: app.dataSources.defaultDS.entities.LCAPUserRoleMapping, lCAPRole: app.dataSources.defaultDS.entities.LCAPRole }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPGetRoleBindUserList",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "inputRoleId"
				}
			],
			"return": [
				{
					"ref": "nasl.collection.List<{ lCAPUserRoleMapping: app.dataSources.defaultDS.entities.LCAPUserRoleMapping }>",
					"name": "result"
				}
			],
			"refByLogic": [
				"app.logics.LCAPIsAlreadBindUserIdList"
			],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/addRoleUser",
					"logic": "roleAddUserReduplicate"
				}
			],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPLoadRoleManagementTableView",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "page"
				},
				{
					"ref": "nasl.core.Long",
					"name": "size"
				},
				{
					"ref": "nasl.core.String",
					"name": "sort"
				},
				{
					"ref": "nasl.core.String",
					"name": "order"
				},
				{
					"ref": "app.dataSources.defaultDS.entities.LCAPRole",
					"name": "filter"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ lCAPRole: app.dataSources.defaultDS.entities.LCAPRole }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/roleManagement",
					"logic": "load"
				}
			],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPUnBindUsers",
			"param": [
				{
					"ref": "app.structures.LCAPRoleBindUsersBody",
					"name": "unBindUsersBody"
				}
			],
			"return": [
				{
					"ref": "nasl.core.Long",
					"name": "resultUnBindUsers"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPLoadUserRoleMappingTableView",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "page"
				},
				{
					"ref": "nasl.core.Long",
					"name": "size"
				},
				{
					"ref": "nasl.core.String",
					"name": "sort"
				},
				{
					"ref": "nasl.core.String",
					"name": "order"
				},
				{
					"ref": "app.dataSources.defaultDS.entities.LCAPUserRoleMapping",
					"name": "filter"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ lCAPUserRoleMapping: app.dataSources.defaultDS.entities.LCAPUserRoleMapping, lCAPRole: app.dataSources.defaultDS.entities.LCAPRole }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/addRoleUser",
					"logic": "load"
				}
			],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPGetRolePermissionList",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "inputRoleId"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ lCAPRolePerMapping: app.dataSources.defaultDS.entities.LCAPRolePerMapping, lCAPPermission: app.dataSources.defaultDS.entities.LCAPPermission }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [
				{
					"view": "pc/permission_center/roleManagement",
					"element": "uLink2",
					"event": "click"
				}
			],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPLoadAddRoleUserSelectLCAPRole",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "page"
				},
				{
					"ref": "nasl.core.Long",
					"name": "size"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ lCAPRole: app.dataSources.defaultDS.entities.LCAPRole }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPGetUserResources",
			"param": [
				{
					"ref": "nasl.core.String",
					"name": "userId"
				}
			],
			"return": [
				{
					"ref": "nasl.collection.List<app.structures.LCAPGetResourceResult>",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refByOther": [
				"LCAPGetResourceResult"
			]
		},
		{
			"name": "app.logics.LCAPGetPermissionByRoleId",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "roleId"
				}
			],
			"return": [
				{
					"ref": "nasl.collection.List<app.dataSources.defaultDS.entities.LCAPPermission>",
					"name": "permissionList"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/roleManagement",
					"logic": "getRolePermission"
				}
			],
			"refByViewEvent": [
				{
					"view": "pc/permission_center/resourceManagement",
					"element": "uButton2",
					"event": "click"
				},
				{
					"view": "pc/permission_center/resourceManagement",
					"element": "uButton4",
					"event": "click"
				}
			],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPGetResourceListByRoleId",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "roleId"
				}
			],
			"return": [
				{
					"ref": "nasl.collection.List<app.dataSources.defaultDS.entities.LCAPResource>",
					"name": "resultResourceList"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPGetMappingIdByRoleIdAndUserId",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "roleId"
				},
				{
					"ref": "nasl.core.String",
					"name": "userId"
				}
			],
			"return": [
				{
					"ref": "nasl.core.Long",
					"name": "result"
				}
			],
			"refByLogic": [
				"app.logics.LCAPUnBindUsers"
			],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPIsAlreadBindUserIdList",
			"param": [
				{
					"ref": "nasl.core.String",
					"name": "newUserId"
				},
				{
					"ref": "nasl.core.Long",
					"name": "inputRoleId"
				}
			],
			"return": [
				{
					"ref": "nasl.core.Boolean",
					"name": "result"
				}
			],
			"refByLogic": [
				"app.logics.LCAPRoleBindUsers",
				"app.logics.LCAPUnBindUsers"
			],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPLoadResourceTableView",
			"param": [
				{
					"ref": "nasl.core.Long",
					"name": "page"
				},
				{
					"ref": "nasl.core.Long",
					"name": "size"
				},
				{
					"ref": "nasl.core.String",
					"name": "sort"
				},
				{
					"ref": "nasl.core.String",
					"name": "order"
				}
			],
			"return": [
				{
					"ref": "{ list: nasl.collection.List<{ lCAPResource: app.dataSources.defaultDS.entities.LCAPResource }>, total: nasl.core.Long }",
					"name": "result"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/resourceManagement",
					"logic": "load"
				}
			],
			"refByViewEvent": [],
			"refByOther": []
		},
		{
			"name": "app.logics.LCAPIsRoleNameRepeated",
			"param": [
				{
					"ref": "nasl.core.String",
					"name": "roleName"
				}
			],
			"return": [
				{
					"ref": "nasl.core.Boolean",
					"name": "isExist"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [
				{
					"view": "pc/permission_center/roleManagement",
					"logic": "isRoleNameRepeated"
				}
			],
			"refByViewEvent": [],
			"refByOther": []
		}
	],
	"structures": [
		{
			"structure": "app.structures.LCAPGetResourceResult",
			"properties": [
				{
					"ref": "nasl.core.String",
					"name": "resourceValue"
				},
				{
					"ref": "nasl.core.String",
					"name": "resourceType"
				}
			],
			"refByLogic": [
				"app.logics.LCAPGetUserResources"
			],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refBySturcture": [],
			"refByOther": [
				"LCAPGetResourceResult"
			]
		},
		{
			"structure": "app.structures.LCAPRoleBindUsersBody",
			"properties": [
				{
					"ref": "nasl.core.Long",
					"name": "roleId"
				},
				{
					"ref": "nasl.collection.List<nasl.core.String>",
					"name": "userIdList"
				}
			],
			"refByLogic": [
				"app.logics.LCAPRoleBindUsers",
				"app.logics.LCAPUnBindUsers"
			],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [],
			"refBySturcture": [],
			"refByOther": []
		},
		{
			"structure": "app.structures.PostRequest",
			"properties": [
				{
					"ref": "nasl.http.HttpResponse<nasl.core.String>",
					"name": "response"
				},
				{
					"ref": "nasl.core.String",
					"name": "status"
				},
				{
					"ref": "nasl.collection.Map<nasl.core.String,nasl.core.String>",
					"name": "requestInfo"
				}
			],
			"refByLogic": [],
			"refByView": [],
			"refByViewLogic": [],
			"refByViewEvent": [
				{
					"view": "m",
					"element": "m",
					"event": "click"
				},
				{
					"view": "pc",
					"element": "pc",
					"event": "click"
				}
			],
			"refBySturcture": [],
			"refByOther": []
		}
	],
	"views": [
		{
			"name": "pc/sss",
			"logics": [
				{
					"name": "load",
					"param": [
						{
							"ref": "nasl.ui.DataSourceParams",
							"name": "params"
						}
					],
					"return": [
						{
							"ref": "{ list: nasl.collection.List<{ student: app.dataSources.defaultDS.entities.Student, school: app.dataSources.defaultDS.entities.School }>, total: nasl.core.Long }",
							"name": "result"
						}
					]
				},
				{
					"name": "loadSelectSchool",
					"param": [
						{
							"ref": "nasl.ui.DataSourceParams",
							"name": "params"
						}
					],
					"return": [
						{
							"ref": "{ list: nasl.collection.List<{ school: app.dataSources.defaultDS.entities.School }>, total: nasl.core.Long }",
							"name": "result"
						}
					]
				}
			],
			"events": [
				{
					"element": "sss",
					"event": "created"
				},
				{
					"element": "button2",
					"event": "click"
				},
				{
					"element": "button1",
					"event": "click"
				},
				{
					"element": "button3",
					"event": "click"
				},
				{
					"element": "button4",
					"event": "click"
				},
				{
					"element": "link1",
					"event": "click"
				},
				{
					"element": "link2",
					"event": "click"
				},
				{
					"element": "uNavbarMenuItem2",
					"event": "click"
				}
			]
		},
		{
			"name": "pc/login",
			"logics": [
				{
					"name": "onSuccess",
					"param": [],
					"return": []
				}
			],
			"events": []
		},
		{
			"name": "pc/index",
			"logics": [],
			"events": []
		},
		{
			"name": "pc/dashboard",
			"logics": [],
			"events": [
				{
					"element": "dropdown_item1",
					"event": "click"
				}
			]
		},
		{
			"name": "pc/dashboard/testapi",
			"logics": [],
			"events": []
		},
		{
			"name": "pc/dashboard/testvariable",
			"logics": [],
			"events": [
				{
					"element": "button1",
					"event": "click"
				}
			]
		},
		{
			"name": "pc/dashboard/testlayout",
			"logics": [],
			"events": []
		},
		{
			"name": "pc/dashboard/student",
			"logics": [
				{
					"name": "load",
					"param": [
						{
							"ref": "nasl.ui.DataSourceParams",
							"name": "params"
						}
					],
					"return": [
						{
							"ref": "{ list: nasl.collection.List<{ student: app.dataSources.defaultDS.entities.Student, school: app.dataSources.defaultDS.entities.School }>, total: nasl.core.Long }",
							"name": "result"
						}
					]
				},
				{
					"name": "loadSelectSchool",
					"param": [
						{
							"ref": "nasl.ui.DataSourceParams",
							"name": "params"
						}
					],
					"return": [
						{
							"ref": "{ list: nasl.collection.List<{ school: app.dataSources.defaultDS.entities.School }>, total: nasl.core.Long }",
							"name": "result"
						}
					]
				}
			],
			"events": [
				{
					"element": "student",
					"event": "created"
				},
				{
					"element": "button2",
					"event": "click"
				},
				{
					"element": "button1",
					"event": "click"
				},
				{
					"element": "button3",
					"event": "click"
				},
				{
					"element": "button4",
					"event": "click"
				},
				{
					"element": "link1",
					"event": "click"
				},
				{
					"element": "link2",
					"event": "click"
				}
			]
		},
		{
			"name": "pc/dashboard/school",
			"logics": [
				{
					"name": "load",
					"param": [
						{
							"ref": "nasl.ui.DataSourceParams",
							"name": "params"
						}
					],
					"return": [
						{
							"ref": "{ list: nasl.collection.List<{ school: app.dataSources.defaultDS.entities.School }>, total: nasl.core.Long }",
							"name": "result"
						}
					]
				}
			],
			"events": [
				{
					"element": "school",
					"event": "created"
				},
				{
					"element": "button2",
					"event": "click"
				},
				{
					"element": "button1",
					"event": "click"
				},
				{
					"element": "button3",
					"event": "click"
				},
				{
					"element": "button4",
					"event": "click"
				},
				{
					"element": "link1",
					"event": "click"
				},
				{
					"element": "link2",
					"event": "click"
				}
			]
		},
		{
			"name": "pc/dashboard/testdebug",
			"logics": [],
			"events": [
				{
					"element": "button1",
					"event": "click"
				},
				{
					"element": "button2",
					"event": "click"
				}
			]
		},
		{
			"name": "pc/permission_center",
			"logics": [],
			"events": [
				{
					"element": "dropdown_item1",
					"event": "click"
				}
			]
		},
		{
			"name": "pc/permission_center/addRoleUser",
			"logics": [
				{
					"name": "getRoleNameByRoleId",
					"param": [],
					"return": []
				},
				{
					"name": "create",
					"param": [],
					"return": []
				},
				{
					"name": "roleAddUserReduplicate",
					"param": [
						{
							"ref": "nasl.core.String",
							"name": "inputUserId"
						},
						{
							"ref": "nasl.core.Long",
							"name": "inputRoleId"
						}
					],
					"return": [
						{
							"ref": "nasl.core.Boolean",
							"name": "result"
						}
					]
				},
				{
					"name": "submit",
					"param": [],
					"return": []
				},
				{
					"name": "modify",
					"param": [
						{
							"ref": "nasl.ui.Current<{ lCAPUserRoleMapping: app.dataSources.defaultDS.entities.LCAPUserRoleMapping, lCAPRole: app.dataSources.defaultDS.entities.LCAPRole }>",
							"name": "current"
						}
					],
					"return": []
				},
				{
					"name": "getUsersListFromNumis",
					"param": [],
					"return": [
						{
							"ref": "nasl.collection.List<{ lCAPUser: app.dataSources.defaultDS.entities.LCAPUser }>",
							"name": "result"
						}
					]
				},
				{
					"name": "load",
					"param": [
						{
							"ref": "nasl.ui.DataSourceParams",
							"name": "params"
						}
					],
					"return": [
						{
							"ref": "{ list: nasl.collection.List<{ lCAPUserRoleMapping: app.dataSources.defaultDS.entities.LCAPUserRoleMapping, lCAPRole: app.dataSources.defaultDS.entities.LCAPRole }>, total: nasl.core.Long }",
							"name": "result"
						}
					]
				}
			],
			"events": [
				{
					"element": "addRoleUser",
					"event": "created"
				},
				{
					"element": "uButton1",
					"event": "click"
				},
				{
					"element": "uButton2",
					"event": "click"
				},
				{
					"element": "uButton3",
					"event": "click"
				},
				{
					"element": "uLink1",
					"event": "click"
				}
			]
		},
		{
			"name": "pc/permission_center/resourceManagement",
			"logics": [
				{
					"name": "addResource",
					"param": [],
					"return": []
				},
				{
					"name": "load",
					"param": [
						{
							"ref": "nasl.ui.DataSourceParams",
							"name": "params"
						}
					],
					"return": [
						{
							"ref": "{ list: nasl.collection.List<{ lCAPResource: app.dataSources.defaultDS.entities.LCAPResource }>, total: nasl.core.Long }",
							"name": "result"
						}
					]
				},
				{
					"name": "loadResourceByRoleId",
					"param": [],
					"return": [
						{
							"ref": "nasl.collection.List<app.dataSources.defaultDS.entities.LCAPResource>",
							"name": "result"
						}
					]
				},
				{
					"name": "remove",
					"param": [
						{
							"ref": "nasl.ui.Current<{ lCAPResource: app.dataSources.defaultDS.entities.LCAPResource }>",
							"name": "current"
						}
					],
					"return": []
				},
				{
					"name": "loadListView",
					"param": [
						{
							"ref": "nasl.ui.DataSourceParams",
							"name": "params"
						}
					],
					"return": [
						{
							"ref": "{ list: nasl.collection.List<{ lCAPResource: app.dataSources.defaultDS.entities.LCAPResource }>, total: nasl.core.Long }",
							"name": "result"
						}
					]
				}
			],
			"events": [
				{
					"element": "uButton1",
					"event": "click"
				},
				{
					"element": "uButton2",
					"event": "click"
				},
				{
					"element": "uButton3",
					"event": "click"
				},
				{
					"element": "uButton4",
					"event": "click"
				},
				{
					"element": "uButton5",
					"event": "click"
				},
				{
					"element": "uLink1",
					"event": "click"
				}
			]
		},
		{
			"name": "pc/permission_center/roleManagement",
			"logics": [
				{
					"name": "submit",
					"param": [],
					"return": []
				},
				{
					"name": "getRolePermission",
					"param": [],
					"return": [
						{
							"ref": "nasl.collection.List<app.dataSources.defaultDS.entities.LCAPPermission>",
							"name": "result"
						}
					]
				},
				{
					"name": "modify",
					"param": [
						{
							"ref": "nasl.ui.Current<{ lCAPRole: app.dataSources.defaultDS.entities.LCAPRole }>",
							"name": "current"
						}
					],
					"return": [
						{
							"ref": "nasl.core.Long",
							"name": "resultRoleId"
						}
					]
				},
				{
					"name": "load",
					"param": [
						{
							"ref": "nasl.ui.DataSourceParams",
							"name": "params"
						}
					],
					"return": [
						{
							"ref": "{ list: nasl.collection.List<{ lCAPRole: app.dataSources.defaultDS.entities.LCAPRole }>, total: nasl.core.Long }",
							"name": "result"
						}
					]
				},
				{
					"name": "isRoleNameRepeated",
					"param": [
						{
							"ref": "nasl.core.String",
							"name": "roleName"
						}
					],
					"return": [
						{
							"ref": "nasl.core.Boolean",
							"name": "result"
						}
					]
				},
				{
					"name": "create",
					"param": [],
					"return": []
				},
				{
					"name": "remove",
					"param": [
						{
							"ref": "nasl.ui.Current<{ lCAPRole: app.dataSources.defaultDS.entities.LCAPRole }>",
							"name": "current"
						}
					],
					"return": []
				}
			],
			"events": [
				{
					"element": "roleManagement",
					"event": "created"
				},
				{
					"element": "uButton1",
					"event": "click"
				},
				{
					"element": "uButton2",
					"event": "click"
				},
				{
					"element": "uButton3",
					"event": "click"
				},
				{
					"element": "uButton4",
					"event": "click"
				},
				{
					"element": "uButton5",
					"event": "click"
				},
				{
					"element": "uButton6",
					"event": "click"
				},
				{
					"element": "uButton7",
					"event": "click"
				},
				{
					"element": "uButton8",
					"event": "click"
				},
				{
					"element": "uButton9",
					"event": "click"
				},
				{
					"element": "uButton10",
					"event": "click"
				},
				{
					"element": "uLink2",
					"event": "click"
				},
				{
					"element": "uLink4",
					"event": "click"
				},
				{
					"element": "uLink5",
					"event": "click"
				}
			]
		},
		{
			"name": "pc/permission_center/userManagement",
			"logics": [
				{
					"name": "load",
					"param": [
						{
							"ref": "nasl.ui.DataSourceParams",
							"name": "params"
						}
					],
					"return": [
						{
							"ref": "{ list: nasl.collection.List<{ lCAPUser: app.dataSources.defaultDS.entities.LCAPUser }>, total: nasl.core.Long }",
							"name": "result"
						}
					]
				},
				{
					"name": "submit",
					"param": [],
					"return": []
				},
				{
					"name": "getUserNameList",
					"param": [],
					"return": [
						{
							"ref": "{ list: nasl.collection.List<{ lCAPUser: app.dataSources.defaultDS.entities.LCAPUser }>, total: nasl.core.Long }",
							"name": "result"
						}
					]
				}
			],
			"events": [
				{
					"element": "userManagement",
					"event": "created"
				},
				{
					"element": "button2",
					"event": "click"
				},
				{
					"element": "button5",
					"event": "click"
				},
				{
					"element": "button6",
					"event": "click"
				},
				{
					"element": "button1",
					"event": "click"
				},
				{
					"element": "button3",
					"event": "click"
				},
				{
					"element": "button4",
					"event": "click"
				},
				{
					"element": "link1",
					"event": "click"
				},
				{
					"element": "link2",
					"event": "click"
				}
			]
		},
		{
			"name": "pc/noAuth",
			"logics": [],
			"events": []
		},
		{
			"name": "pc/notFound",
			"logics": [],
			"events": []
		},
		{
			"name": "m/login",
			"logics": [],
			"events": []
		},
		{
			"name": "m/user",
			"logics": [],
			"events": [
				{
					"element": "logoutButton",
					"event": "click"
				}
			]
		},
		{
			"name": "m/index",
			"logics": [],
			"events": [
				{
					"element": "iconv1",
					"event": "click"
				}
			]
		},
		{
			"name": "m/noAuth",
			"logics": [],
			"events": []
		},
		{
			"name": "m/notFound",
			"logics": [],
			"events": []
		}
	]
}`,
            total: 0,
            count: 0,
            highlightNodes: new Set(),
            currentHoverNode: null,
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
            let node = this.searchTool.currentMeta?.target;
            if(node) {
                this.toggleLinkHighlight(node, false);
            }
            this.searchTool.request(content);
            this.searchTool.toggleFirstSeach(true);
            this.total = this.searchTool.total;
            const jflow = this.getJFlowInstance();
            jflow.scheduleRender(() => {
                this.count = this.searchTool.current;
                // this.searchTool.toggleFirstSeach(false);
            });
            this.minimapTool.renderMap(jflow);
            node = this.searchTool.currentMeta?.target
            if(node) {
                this.toggleLinkHighlight(node, true, '#525FE1');
            }
        },
        jflowloading(val) {
            if(!val) {
                const jflowInstance = this.getJFlowInstance();
                const searchTool = new SearchTool();
                searchTool.index(this.curData);
                searchTool.registToJflow(jflowInstance);
                this.searchTool = searchTool;
                
                const minimapTool = new MiniMapTool(this.$refs.minimap, {
                    padding: 5,
                    renderExtra(ctx) {
                        searchTool.highlight(ctx, jflowInstance);
                    }
                });
                minimapTool.registToJflow(jflowInstance);
                minimapTool.capture(jflowInstance);
                this.minimapTool = minimapTool;
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
                let node = this.searchTool.currentMeta?.target;
                if(node) {
                    this.toggleLinkHighlight(node, false);
                }
                this.searchTool.next(jflow, () => {
                    this.minimapTool.renderMap(jflow);
                });
                this.count = this.searchTool.current;
                node = this.searchTool.currentMeta?.target;
                if(node) {
                    this.toggleLinkHighlight(node, true, '#525FE1');
                }
            }
        },
        hoverNode(node, val) {
            if(this.currentHoverNode) {
                this.toggleLinkHighlight(this.currentHoverNode, false);
            }
            this.currentHoverNode = node;
            this.toggleLinkHighlight(node, val, '#F86F03');
            
        },
        toggleLinkHighlight(node, val, activeColor) {
            const jflow = this.getJFlowInstance();
            const meta = jflow.getSourceRenderMeta(node);
            meta.jflowFromLinks.forEach(l => {
                l.backgroundColor = val ? activeColor: '#000'
                l.lineWidth = val ? 5 : 1;
            });
            meta.jflowToLinks.forEach(l => {
                l.backgroundColor = val ? activeColor: '#000'
                l.lineWidth = val ? 5 : 1;
            });
            jflow.scheduleRender();
        },
        onZoompan() {
            // this.highlightNodes.forEach((node) => {
            //     this.toggleLinkHighlight(node, false);
            // })
            
        },
        // captureMap() {
        //     if (!this.$refs.jflow) {
        //         return;
        //     }
        //     const jflowInstance = this.getJFlowInstance();
        //     jflowInstance.captureMap(this.$refs.minimap, {
        //         padding: 0,
        //         placement: 'center',
        //     });
        // },

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

