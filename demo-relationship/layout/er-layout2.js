import { Property, PlainERnode } from './er-node';
import { lcapFilterEntityName, lcapFilterStructureName, lcapFilterLogicName, primaryFilter } from '../lcap-constants';
const gap = 20;
let id = 0;

function ArrayInsectLeft(a, b) {
    return a.find(t => {
        for (const elem of b) {
            if (elem === t){
               return true;
            }
        }
        return false
    })
}
function intersection(a, b) {
    if(b.length === 0) {
        return [];
    }
    return a.filter(value => b.includes(value.source));
}
class ERLayout {
    constructor(source) {
        this.static = false;
        this.flowStack = [];
        this.flowLinkStack = [];
        this.erNodes = [];

        this.viewVisible = true;
        this.logicVisible = true;
        this.structureVisible = true;
        // dismiss
        this.LCAPvisible = false;
        this.multiRefFilter = false;
        this.multiLogicRefFilter = false;
        this.primaryFilter = false;
        // dismiss

        this.filterContent = '';
        this.filterPart = '';
        this.showProperty = false;
        this.reOrder(source);
    }
    /**
     * 从 tree 计算布局
     * @param {AstNode} tree - ER 树
     */
    reOrder(source) {
        this.flowStack = [];
        this.flowLinkStack = [];
        this.source = source;
        
        const {
            structures,
            views,
            viewLogics,
            viewEvents,
            logics,
            entities
        } = source;

        let structureRefFilter = new Set();
        let logicRefsAfterFilter = new Set();
        let viewRefsAfterFilter = new Set();
        let viewEventRefsAfterFilter = new Set();
        let viewLogicRefsAfterFilter = new Set();
        let entityRefsAfterFilter = new Set();

        const filterContent = this.filterContent.toLocaleLowerCase();
        const filterByContent = definePart => s => {
            if(this.filterPart === definePart) {
                return s.name.toLowerCase().includes(filterContent);
            } 
        }
        let entityNodes = entities.map(i => new PlainERnode(i, 'Entity'));
        let structNodes = structures.map(i => new PlainERnode(i, 'Structure'));
        let logicNodes = logics.map(i => new PlainERnode(i, 'Logic'));
        let viewEventsNodes = viewEvents.map(i => new PlainERnode(i, 'ViewEvent'));
        let viewLogicsNodes = viewLogics.map(i => new PlainERnode(i, 'ViewLogic'));
        let viewNodes = views.map(i => new PlainERnode(i, 'View'));
        
      /*  if(filterContent && this.filterPart === 'View') {
            viewNodes.filter(filterByContent('View')).forEach(s => {
                viewRefsAfterFilter.add(s.source);
            });
            viewLogicsNodes.forEach(s => {
                if(ArrayInsectLeft(s.source.refByView, viewRefsAfterFilter)) {
                    viewLogicRefsAfterFilter.add(s.source)
                }
            });
            viewEventsNodes.forEach(s => {
                if(ArrayInsectLeft(s.source.refByView, viewRefsAfterFilter)) {
                    viewEventRefsAfterFilter.add(s.source)
                }
            })
            logicNodes.forEach(s => {
                if(ArrayInsectLeft(s.source.refByViewLogic, viewLogicRefsAfterFilter) 
                || ArrayInsectLeft(s.source.refByView, viewRefsAfterFilter)) {
                    logicRefsAfterFilter.add(s.source);
                }
            });

            structNodes.forEach(s => {
                if(ArrayInsectLeft(s.source.refByViewLogic, viewLogicRefsAfterFilter) 
                || ArrayInsectLeft(s.source.refByLogic, logicRefsAfterFilter) 
                || ArrayInsectLeft(s.source.refByView, viewRefsAfterFilter)) {
                    s.source.properties.forEach((p) => {
                        entityRefsAfterFilter.add(p.ref)
                    })
                    structureRefFilter.add(s.source);
                }
            });
            
        }*/

        // if(filterContent && this.filterPart === 'ViewLogic') {
        //     viewLogicsNodes.filter(filterByContent('ViewLogic')).forEach(vn => {
        //         viewLogicRefsAfterFilter.add(vn.source);
        //         vn.source.refByView.forEach(v => {
        //             viewRefsAfterFilter.add(v);
        //         });
        //     });
        //     logicNodes.forEach(s => {
        //         if(ArrayInsectLeft(s.source.refByViewLogic, viewLogicRefsAfterFilter)) {
        //             logicRefsAfterFilter.add(s.source)
        //         }
        //     });
        //     structNodes.forEach(s => {
        //         if(ArrayInsectLeft(s.source.refByViewLogic, viewLogicRefsAfterFilter) 
        //         || ArrayInsectLeft(s.source.refByLogic, logicRefsAfterFilter) 
        //         || ArrayInsectLeft(s.source.refByView, viewRefsAfterFilter)) {
        //             s.source.properties.forEach((p) => {
        //                 entityRefsAfterFilter.add(p.ref)
        //             })
        //             structureRefFilter.add(s.source);
        //         }
        //     });
        // }
/*
        if(filterContent && this.filterPart === 'Logic') {
            logicNodes.filter(filterByContent('Logic')).forEach(s => {
                logicRefsAfterFilter.add(s.source);

                s.source.refByViewLogic.forEach(l => {
                    viewLogicRefsAfterFilter.add(l);
                    l.refByView.forEach(v => {
                        viewRefsAfterFilter.add(v);
                    });
                });
                s.source.refByViewEvent.forEach(l => {
                    viewEventRefsAfterFilter.add(l);
                    l.refByView.forEach(v => {
                        viewRefsAfterFilter.add(v);
                    });
                })
            });
            structNodes.forEach(s => {
                if(ArrayInsectLeft(s.source.refByViewLogic, viewLogicRefsAfterFilter) 
                || ArrayInsectLeft(s.source.refByLogic, logicRefsAfterFilter) 
                || ArrayInsectLeft(s.source.refByView, viewRefsAfterFilter)) {
                    s.source.properties.forEach((p) => {
                        entityRefsAfterFilter.add(p.ref)
                    })
                    structureRefFilter.add(s.source);
                }
            });
        }

        if(filterContent && this.filterPart === 'Structure') {
            structNodes.filter(filterByContent('Structure')).forEach(s => {
                structureRefFilter.add(s.source);
                s.source.properties.forEach((p) => {
                    entityRefsAfterFilter.add(p.ref)
                })
                s.source.refByLogic.forEach(l => {
                    logicRefsAfterFilter.add(l);
                    l.refByViewLogic.forEach(p => {
                        viewLogicRefsAfterFilter.add(p);
                        p.refByView.forEach(v => {
                            viewRefsAfterFilter.add(v);
                        });
                    })
                })
                s.source.refByViewLogic.forEach(l => {
                    viewLogicRefsAfterFilter.add(l);
                    l.refByView.forEach(v => {
                        viewRefsAfterFilter.add(v);
                    });
                })
            });
           
        }
        

        
        if(filterContent) {
            entityNodes = intersection(entityNodes, Array.from(entityRefsAfterFilter));
            structNodes = intersection(structNodes, Array.from(structureRefFilter)); 
            logicNodes = intersection(logicNodes, Array.from(logicRefsAfterFilter));
            viewLogicsNodes = intersection(viewLogicsNodes, Array.from(viewLogicRefsAfterFilter));
            viewNodes = intersection(viewNodes, Array.from(viewRefsAfterFilter));
        }
        if(!this.viewVisible) {
            viewNodes = []
            viewLogicsNodes = []
        }
        if(!this.logicVisible) {
            logicNodes = []
        }
        if(!this.structureVisible) {
            structNodes = []
            entityNodes = []
        }


*/
        [
            ...entityNodes,
            ...structNodes,
            ...logicNodes,
            ...viewEventsNodes,
            ...viewLogicsNodes,
            ...viewNodes
        ].forEach(n => {
            this.flowStack.push({
                type: n.type,
                source: n.source,
                layoutNode: n,
            });
        });

        const genLink = (list, targetList, source) => {
            if(list) {
                list.forEach(s => {
                    const node = targetList.find(n => n.source === s); 
                    if(node) {
                        this.flowLinkStack.push({
                            from: source,
                            to: node,
                            part: id++,
                        })
                    }
                })
            }
        }

        const genLinks = (sNode) => {
            const source = sNode.source;
            genLink(source.refByStructure, structNodes, sNode);
            genLink(source.refByLogic, logicNodes, sNode);
            genLink(source.refByView, viewNodes, sNode);
            genLink(source.refByViewLogic, viewLogicsNodes, sNode);
            genLink(source.refByViewEvent, viewEventsNodes, sNode);
        }

        entityNodes.forEach(genLinks);
        structNodes.forEach(genLinks);
        logicNodes.forEach(genLinks);
        viewEventsNodes.forEach(genLinks);
        viewLogicsNodes.forEach(genLinks);


        // logicNodes.forEach(sNode => {
        //     genLinks(sNode);
        // });

        // viewLogicsNodes.forEach(sNode => {
        //     const v = sNode.source.refByView[0];
        //     const node = viewNodes.find(n => n.name === v.name); 
        //     if(node) {
        //         this.flowLinkStack.push({
        //             from: sNode,
        //             to: node,
        //             fromDir: 0,
        //             toDir: 2,
        //             part: id++,
        //         })
        //     }
        // })

        // let logicLevelNodes = Array.from(logicNodes.reduce((accu, curr) => {
        //     const l = curr.source.level;
        //     if(!accu.has(l)) {
        //         accu.set(l, { level: l, nodes: []}); 
        //     }
        //     accu.get(l).nodes.push(curr);
        //     return accu;
        // }, new Map()).values()).sort((a, b) => b.level - a.level);
        
        Object.assign(this, {
            entityNodes,
            structNodes, 
            logicNodes, 
            viewLogicsNodes, 
            viewEventsNodes,
            viewNodes,
            // logicLevelNodes
        });

    }

    staticCheck(instance, jflow) {
        return false;
    }
    reflow(jflow) {
        const {
            entityNodes,
            structNodes, 
            logicNodes, 
            viewLogicsNodes, 
            viewEventsNodes,
            viewNodes,
            // logicLevelNodes
        } = this;
        // debugger
        function layoutMath(
            nodes, 
            columnPos = 0,
            callback,
            onlyX = false,
        ) {
            let reduceHeight = 0;
            let reduceWidth = 0;
            nodes.forEach((n, idx) => {
                const instance = jflow.getRenderNodeBySource(n.source);
                const { width, height } = instance.getBoundingDimension();
                reduceWidth = Math.max(width, reduceWidth);
                if(!onlyX) {
                    const halfHeight = height/2;
                    if (idx > 0) {
                        reduceHeight += halfHeight
                    }
                    instance.anchor[1] = reduceHeight;
                    if(callback){
                        callback(n, reduceHeight)
                    }
                    reduceHeight += (halfHeight + gap);
                }
            });
            columnPos = columnPos + reduceWidth / 2;
            nodes.forEach(n => {
                const instance = jflow.getRenderNodeBySource(n.source);
                instance.anchor[0]= columnPos;
            });
            columnPos = columnPos + reduceWidth /2;
            return columnPos
        }

        let columnspan = [
            entityNodes,
            structNodes, 
            // logicNodes, 
        ].reduce((columnpos, nodes) => {
            if(nodes.length === 0) {
                return columnpos;
            }
            return layoutMath(nodes, columnpos) + 200
        }, 0);

        let _nodeMap = new Map();
        logicNodes.forEach(node => {
            const source = node.source;
            const name = source.name 
            if(!_nodeMap.has(name)) {
                _nodeMap.set(name, {
                    node, 
                    level: 0
                })
            }
            source.refByLogic.forEach(logic => {
                const node = logicNodes.find(node => node.source.name === logic.name);
                const name = node.name;
                if(!_nodeMap.has(name)) {
                    _nodeMap.set(name, {
                        node, 
                        level: 0
                    })
                }
                const t = _nodeMap.get(name);
                t.level ++;
            });
        });
        const levelMap = {};
        _nodeMap.forEach((val) => {
            const level = val.level;
            if(!levelMap[level]) {
                levelMap[level] = [];
            }
            levelMap[level].push(val.node);
        });

        const leveledLogic = Object.keys(levelMap).sort((a, b) => b-a);

 
        // const viewInnerHeight = new WeakMap();
        let reduceHeight = 0;
        viewNodes.forEach(vnode => {
            const source = vnode.source
            let startHeight = reduceHeight;
            const instance = jflow.getRenderNodeBySource(source);
            const { height } = instance.getBoundingDimension();
            instance.anchor[1] = height/2 + startHeight;
            function getHeight(list) {
                let _reduceHeight = startHeight;
                list.forEach((n, idx) => {
                    const instance = jflow.getRenderNodeBySource(n.source);
                    const { height } = instance.getBoundingDimension();
                    const halfHeight = height/2;
                    _reduceHeight += halfHeight
                    instance.anchor[1] = _reduceHeight;
                    _reduceHeight += (halfHeight + gap);

                });
                return _reduceHeight;
            }
            const logiclist = viewLogicsNodes.filter(n => n.source.refByView.includes(source));
            const eventlist = viewEventsNodes.filter(n => n.source.refByView.includes(source));
            const h = Math.max(getHeight(logiclist), getHeight(eventlist));
            reduceHeight = h + gap * 2;
        });

        // const logicRemains = [];
        leveledLogic.forEach(level => {
            const logicNodes = levelMap[level];
            logicNodes.forEach(node => {
                const source = node.source
                let height = 0;
                let count = 0;
                function reduceHeight(s) {
                    const instance = jflow.getRenderNodeBySource(s);
                    height += instance.anchor[1];
                    count++;
                }
                source.refByLogic.forEach(reduceHeight);
                source.refByView.forEach(reduceHeight);
                source.refByViewLogic.forEach(reduceHeight)
                source.refByViewEvent.forEach(reduceHeight);
                if(count === 0) {
                    // logicRemains.push(node);
                } else {
                    const instance = jflow.getRenderNodeBySource(source);
                    instance.anchor[1] = height/count
                }
            });
            columnspan = layoutMath(logicNodes, columnspan, null, true) + 200
        });
       
        const structRemains = [];
        structNodes.forEach(node => {
            const source = node.source
            let height = 0;
            let count = 0;
            function reduceHeight(s) {
                const instance = jflow.getRenderNodeBySource(s);
                height += instance.anchor[1];
                count++;
            }
            source.refByLogic.forEach(reduceHeight);
            source.refByView.forEach(reduceHeight)
            source.refByViewLogic.forEach(reduceHeight)
            source.refByViewEvent.forEach(reduceHeight);
            if(count === 0) {
                structRemains.push(node);
            } else {
                const instance = jflow.getRenderNodeBySource(source);
                instance.anchor[1] = height/count
            }
        });
        const entityRemains = [];
        entityNodes.forEach(node => {
            const source = node.source
            let height = 0;
            let count = 0;
            function reduceHeight(s) {
                const instance = jflow.getRenderNodeBySource(s);
                height += instance.anchor[1];
                count++;
            }
            source.refByStructure.forEach(reduceHeight);
            source.refByLogic.forEach(reduceHeight);
            source.refByView.forEach(reduceHeight)
            source.refByViewLogic.forEach(reduceHeight)
            source.refByViewEvent.forEach(reduceHeight);
            if(count === 0) {
                entityRemains.push(node);
            } else {
                console.log(node, height, count)
                const instance = jflow.getRenderNodeBySource(source);
                instance.anchor[1] = height/count
            }
        });



        [
            viewLogicsNodes,
            viewEventsNodes, 
            viewNodes, 
        ].reduce((columnpos, nodes) => {
            if(nodes.length === 0) {
                return columnpos;
            }
            return layoutMath(nodes, columnpos, null, true) + 200
        }, columnspan);

    }

    toggleView() {
        this.viewVisible = !this.viewVisible;
    }
    toggleLogic() {
        this.logicVisible = !this.logicVisible
    }
    toggleStructure() {
        this.structureVisible = !this.structureVisible
    }
    toggleLcap() {
        this.LCAPvisible = !this.LCAPvisible;
    }
    toggleFilterMultiRef() {
        this.multiRefFilter = !this.multiRefFilter;
    }
    togglePrimaryFilter() {
        this.primaryFilter = !this.primaryFilter;
    }
    toggleMultiLogicRefFilter() {
        this.multiLogicRefFilter = !this.multiLogicRefFilter;
    }
    doFilter(filterContent, part) {
        this.filterPart = part;
        this.filterContent = filterContent;
    }
    toggleProperty(val) {
        this.showProperty = val;
    }
}

export default ERLayout;
