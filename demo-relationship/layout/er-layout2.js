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
            logics,
            entities
        } = source;

        let structureRefFilter = new Set();
        let logicRefsAfterFilter = new Set();
        let viewRefsAfterFilter = new Set();
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
        
        

        let viewLogicsNodes = viewLogics.map(i => new PlainERnode(i, 'ViewLogic'));
        let viewNodes = views.map(i => new PlainERnode(i, 'View'));
        
        if(filterContent && this.filterPart === 'View') {
            viewNodes.filter(filterByContent('View')).forEach(s => {
                viewRefsAfterFilter.add(s.source);
            });
            viewLogicsNodes.forEach(s => {
                if(ArrayInsectLeft(s.source.refByView, viewRefsAfterFilter)) {
                    viewLogicRefsAfterFilter.add(s.source)
                }
            });
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
        }

        if(filterContent && this.filterPart === 'ViewLogic') {
            viewLogicsNodes.filter(filterByContent('ViewLogic')).forEach(vn => {
                viewLogicRefsAfterFilter.add(vn.source);
                vn.source.refByView.forEach(v => {
                    viewRefsAfterFilter.add(v);
                });
            });
            logicNodes.forEach(s => {
                if(ArrayInsectLeft(s.source.refByViewLogic, viewLogicRefsAfterFilter)) {
                    logicRefsAfterFilter.add(s.source)
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
        }

        if(filterContent && this.filterPart === 'Logic') {
            logicNodes.filter(filterByContent('Logic')).forEach(s => {
                logicRefsAfterFilter.add(s.source);

                s.source.refByViewLogic.forEach(l => {
                    viewLogicRefsAfterFilter.add(l);
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

        [
            ...entityNodes,
            ...structNodes,
            ...logicNodes,
            ...viewLogicsNodes,
            ...viewNodes
        ].forEach(n => {
            this.flowStack.push({
                type: n.type,
                source: n.source,
                layoutNode: n,
            });
        });

        const genLinks = (sNode) => {
            const isLogic = sNode.source.concept === 'logic';
            const source = sNode.source;
            source.refByLogic.forEach(l => {
                const node = logicNodes.find(n => n.name === l.name); 
                if(node) {
                    if(isLogic) {
                        this.flowLinkStack.push({
                            from: sNode,
                            to: node,
                            fromDir: 2,
                            toDir: 0,
                            part: id++,
                        })
                    } else  {
                        this.flowLinkStack.push({
                            from: sNode,
                            to: node,
                            fromDir: 0,
                            toDir: 2,
                            part: id++,
                        })
                    }
                }
            });
            source.refByViewLogic.forEach(l => {
                const node = viewLogicsNodes.find(n => n.name === l.name); 
                if(node) {
                    this.flowLinkStack.push({
                        from: sNode,
                        to: node,
                        fromDir: 0,
                        toDir: 2,
                        part: id++,
                    })
                }
            });
            source.refByView.forEach(l => {
                const node = viewNodes.find(n => n.name === l.name); 
                if(node) {
                    this.flowLinkStack.push({
                        from: sNode,
                        to: node,
                        fromDir: 0,
                        toDir: 2,
                        part: id++,
                    })
                }
            })
        }

        structNodes.forEach(sNode => {
            const source = sNode.source;
            source.properties.forEach(p => {
                const node = entityNodes.find(n => n.name === p.ref.name); 
                if(node) {
                    this.flowLinkStack.push({
                        from: node,
                        to: sNode,
                        fromDir: 0,
                        toDir: 2,
                        part: id++,
                    })
                }
            });
            genLinks(sNode);
        });

        logicNodes.forEach(sNode => {
            genLinks(sNode);
        });

        viewLogicsNodes.forEach(sNode => {
            const v = sNode.source.refByView[0];
            const node = viewNodes.find(n => n.name === v.name); 
            if(node) {
                this.flowLinkStack.push({
                    from: sNode,
                    to: node,
                    fromDir: 0,
                    toDir: 2,
                    part: id++,
                })
            }
        })

        let logicLevelNodes = Array.from(logicNodes.reduce((accu, curr) => {
            const l = curr.source.level;
            if(!accu.has(l)) {
                accu.set(l, { level: l, nodes: []}); 
            }
            accu.get(l).nodes.push(curr);
            return accu;
        }, new Map()).values()).sort((a, b) => b.level - a.level);
        
        Object.assign(this, {
            entityNodes,
            structNodes, 
            logicNodes, 
            viewLogicsNodes, 
            viewNodes,

            logicLevelNodes
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
            viewNodes,
            logicLevelNodes
        } = this;
        function layoutMath(
            nodes, 
            columnPos = 0,
            callback
        ) {
            let reduceHeight = 0;
            let reduceWidth = 0;
            nodes.forEach((n, idx) => {
                const instance = jflow.getRenderNodeBySource(n.source);
                const { width, height } = instance.getBoundingDimension();
                reduceWidth = Math.max(width, reduceWidth);
            
                const halfHeight = height/2;
                if (idx > 0) {
                    reduceHeight += halfHeight
                }
                instance.anchor[1] = reduceHeight;
                if(callback){
                    callback(n, reduceHeight)
                }
                reduceHeight += (halfHeight + gap);
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
            logicLevelNodes, 
        ].reduce((columnpos, nodes) => {
            if(nodes.length === 0) {
                return columnpos;
            }
            if(nodes[0].nodes) {
                return nodes.reduce((subcolumnpos, subNodes) => {
                    
                    return layoutMath(subNodes.nodes, subcolumnpos) + 200
                }, columnpos);
            }
            return layoutMath(nodes, columnpos) + 200
        }, 0);
        let lastSource = null;
        let reduceWidth = 0;
        columnspan = layoutMath(viewLogicsNodes, columnspan, (node, height) => {
            const s = node.source.refByView[0].name;
            if(s !== lastSource) {
                
                // const view = viewNodes.find(v => v.source.name === s);
                const source = node.source.refByView[0];
                const instance = jflow.getRenderNodeBySource(source);
                const { width } = instance.getBoundingDimension();
                reduceWidth = Math.max(width, reduceWidth);
                instance.anchor[1] = height;
                lastSource = s;
            }
        }) + 200;
        columnspan = columnspan + reduceWidth / 2;
        viewNodes.forEach(n => {
            const instance = jflow.getRenderNodeBySource(n.source);
            instance.anchor[0]= columnspan;
        });
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
