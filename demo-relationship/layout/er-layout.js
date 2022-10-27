import { Property, PlainERnode } from './er-node';
import { lcapFilterEntityName, lcapFilterStructureName, lcapFilterLogicName, primaryFilter } from '../lcap-constants';
const gap = 20;
let id = 0;
class ERLayout {
    constructor(source) {
        this.static = false;
        this.flowStack = [];
        this.flowLinkStack = [];
        this.erNodes = [];
        this.viewVisible = true;
        this.logicVisible = true;
        this.structureVisible = true;
        this.LCAPvisible = false;
        this.multiRefFilter = false;
        this.multiLogicRefFilter = false;
        this.primaryFilter = false;
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
        let structureNodes = [];
        let logicNodes = [];
        let ViewNodes = [];
        let typeRefNodes = [];
        let structureFilter = [];
        let logicRefsAfterFilter = [];
        let viewRefsAfterFilter = [];
        let entityRefsAfterFilter = []
        
        if(this.filterContent) {
            if(this.filterPart === 'structure') {
                structureNodes = source.struts
                    .filter(s => s.name.toLowerCase().includes(this.filterContent.toLocaleLowerCase()))
                    .map(s => new PlainERnode(s, 'Structure'));
                structureNodes.forEach(s => {
                        logicRefsAfterFilter = logicRefsAfterFilter.concat(s.source.refByLogic);
                        s.source.refByLogic.forEach(l => {
                            viewRefsAfterFilter = viewRefsAfterFilter.concat(l.refByView);
                        })
                        viewRefsAfterFilter = viewRefsAfterFilter.concat(s.source.refByView);
                        entityRefsAfterFilter = entityRefsAfterFilter.concat(s.source.properties.map(p => p.ref))
                    });
                typeRefNodes = source.entities
                    .filter(s => entityRefsAfterFilter.includes(s))
                    .map(s => new PlainERnode(s, 'Entity'));
                logicNodes = source.logics
                    .filter(s => logicRefsAfterFilter.includes(s))
                    .map(s => new PlainERnode(s, 'Logic'));
                ViewNodes = source.views
                    .filter(s => viewRefsAfterFilter.includes(s))
                    .map(s => new PlainERnode(s, 'View'));
            }
            if(this.filterPart === 'logic') {
                logicNodes = source.logics
                    .filter(s => s.name.toLowerCase().includes(this.filterContent.toLocaleLowerCase()))
                    .map(s => new PlainERnode(s, 'Logic'));
                logicNodes.forEach(s => {
                    viewRefsAfterFilter = viewRefsAfterFilter.concat(s.source.refByView);
                    logicRefsAfterFilter.push(s.name);
                });

                structureNodes = source.struts
                    .filter(s => s.refByLogic.find(l => logicRefsAfterFilter.includes(l.name)))
                    .map(s => new PlainERnode(s, 'Structure'));
                structureNodes.forEach(s => {
                    entityRefsAfterFilter = entityRefsAfterFilter.concat(s.source.properties.map(p => p.ref))
                });

                typeRefNodes = source.entities
                    .filter(s => entityRefsAfterFilter.includes(s))
                    .map(s => new PlainERnode(s, 'Entity'));
                ViewNodes = source.views
                    .filter(s => viewRefsAfterFilter.includes(s))
                    .map(s => new PlainERnode(s, 'View'));
            }

            if(this.filterPart === 'view') {
                ViewNodes = source.views
                    .filter(s => s.name.toLowerCase().includes(this.filterContent.toLocaleLowerCase()))
                    .map(s => new PlainERnode(s, 'View'));
                ViewNodes.forEach(s => {
                    viewRefsAfterFilter.push(s.name);
                }); 
                logicNodes = source.logics
                    .filter(s =>  s.refByView.find(l => viewRefsAfterFilter.includes(l.name)))
                    .map(s => new PlainERnode(s, 'Logic'));
                logicNodes.forEach(s => {
                    logicRefsAfterFilter.push(s.name);
                }); 
                
                structureNodes = source.struts
                    .filter(s => 
                        s.refByView.find(l => viewRefsAfterFilter.includes(l.name)) || 
                        s.refByLogic.find(l => logicRefsAfterFilter.includes(l.name)))
                    .map(s => new PlainERnode(s, 'Structure'));
                structureNodes.forEach(s => {
                    entityRefsAfterFilter = entityRefsAfterFilter.concat(s.source.properties.map(p => p.ref))
                });

                typeRefNodes = source.entities
                    .filter(s => entityRefsAfterFilter.includes(s))
                    .map(s => new PlainERnode(s, 'Entity'));
            }
        } else {
            if(this.structureVisible) {
                structureNodes = source.struts
                    .filter(s => (!this.LCAPvisible || !lcapFilterStructureName(s.name)) && (!this.filterContent || s.name.toLowerCase().includes(this.filterContent.toLocaleLowerCase())))
                    .map(s => new PlainERnode(s, 'Structure'));
                if(this.multiRefFilter) {
                    structureNodes = structureNodes.filter(s => {
                        if(s.source.refByView.length > 1 || s.source.refByLogic.length > 1) {
                            logicRefsAfterFilter = logicRefsAfterFilter.concat(s.source.refByLogic);
                            viewRefsAfterFilter = viewRefsAfterFilter.concat(s.source.refByView);
                            entityRefsAfterFilter = entityRefsAfterFilter.concat(s.source.properties.map(p => p.ref))
                            return true;
                        }
                        return false;
                    });
                }
                typeRefNodes = source.entities
                    .filter(s => !this.LCAPvisible || !lcapFilterEntityName(s.name))
                    .filter(s => !this.primaryFilter || !primaryFilter(s.name))
                    .map(s => new PlainERnode(s, 'Entity'));
                if(this.multiRefFilter) {
                    typeRefNodes.sort((a, b) => {
                        const t1 = entityRefsAfterFilter.includes(a.source);
                        const t2 = entityRefsAfterFilter.includes(b.source);
                        console.log(t1, t2)
                        if(t1 && t2) {
                            return 0;
                        } 
                        if(t1) {
                            return -1;
                        }
                        if(t2) {
                            return 1;
                        }
                        return 0;
                    })
                }
            }
            
            if(this.logicVisible) {
                logicNodes = source.logics
                    .filter(s => !this.LCAPvisible || !lcapFilterLogicName(s.name))
                    .map(s => new PlainERnode(s, 'Logic'));
                if(this.multiRefFilter) {
                    logicNodes.sort((a, b) => {
                        const t1 = logicRefsAfterFilter.includes(a.source);
                        const t2 = logicRefsAfterFilter.includes(b.source);
                        if(t1 && t2) {
                            return 0;
                        } 
                        if(t1) {
                            return -1;
                        }
                        if(t2) {
                            return 1;
                        }
                        return 0;
                    })
                }
                if(this.multiLogicRefFilter) {
                    logicNodes = logicNodes.filter(s => {
                        if(s.source.refByView.length > 1) {
                            viewRefsAfterFilter = viewRefsAfterFilter.concat(s.source.refByView);
                            return true;
                        }
                        return false;
                    });
                }
            }
            
            if(this.viewVisible) {
                ViewNodes = source.views
                    .map(s => new PlainERnode(s, 'View'));
                if(this.multiRefFilter) {
                    ViewNodes.sort((a, b) => {
                        const t1 = viewRefsAfterFilter.includes(a.source);
                        const t2 = viewRefsAfterFilter.includes(b.source);
                        if(t1 && t2) {
                            return 0;
                        } 
                        if(t1) {
                            return -1;
                        }
                        if(t2) {
                            return 1;
                        }
                    })
                }
            }
        }

        [
            ...structureNodes, 
            ...logicNodes, 
            ...ViewNodes, 
            ...typeRefNodes
        ].forEach(n => {
            this.flowStack.push({
                type: n.type,
                source: n.source,
                layoutNode: n,
            });
        });
        if(this.structureVisible) {
            structureNodes.forEach(sNode => {
                const source = sNode.source;
                sNode.properties.forEach(p => {
                    const node = typeRefNodes.find(n => n.name === p.refName); 
                    if(node) {
                        this.flowLinkStack.push({
                            from:  node,
                            to: this.showProperty ? p : sNode,
                            fromDir: 0,
                            toDir: 2,
                            part: id++,
                        })
                    }
                })
                if(this.logicVisible) {
                    source.refByLogic.forEach(rl => {
                        const node = logicNodes.find(n => n.name === rl.name); 
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
                if(this.viewVisible) {
                    source.refByView.forEach(rl => {
                        const node = ViewNodes.find(n => n.name === rl.name); 
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

            })
        }

        if(this.logicVisible && this.viewVisible) {
            logicNodes.forEach(l => {
                l.source.refByView.forEach(rl => {
                    const node = ViewNodes.find(n => n.name === rl.name); 
                    if(node) {
                        this.flowLinkStack.push({
                            from: l,
                            to: node,
                            fromDir: 0,
                            toDir: 2,
                            part: id++,
                        })
                    }
                })
            })
        }

        Object.assign(this, {
            structureNodes, 
            logicNodes, 
            ViewNodes, 
            typeRefNodes
        })

    }

    staticCheck(instance, jflow) {
        return false;
    }
    reflow(jflow) {
        const {
            structureNodes, 
            logicNodes, 
            ViewNodes, 
            typeRefNodes
        } = this;
        function layoutMath(
            nodes, 
            columnPos = 0,
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

        [
            typeRefNodes,
            structureNodes, 
            logicNodes, 
            ViewNodes, 
        ].reduce((columnpos, nodes) => {
            return layoutMath(nodes, columnpos) + 200
        }, 0)
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
