import { Property, PlainERnode } from './er-node';
import hcluster, { traverseTree } from './hcluster/hcluster';
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

        const keys = [
            'refByView',
            'refByStructure', 
            'refByLogic',
            'refByViewLogic',
            'refByViewEvent',
        ]
        function interateNodes(nodes){
            nodes.forEach(node => {
                const viewed = new Set();
                const name = node.name;
                function t(curr) {
                    if(curr.concept === 'view') {
                        if(!curr.refs) {
                            curr.refs = [];
                        }
                        curr.refs.push(name)
                    }
                    keys.forEach(key => {
                        if(curr[key]) {
                            curr[key].forEach((n) => {
                                if(viewed.has(n)) {
                                    return;
                                }
                                viewed.add(n);
                                t(n)
                            })
                        }
                    })
                }
                t(node);
            })
        }
        interateNodes(structures);
        interateNodes(logics);
        
        interateNodes(entities);

        
        
        function getDisjointArray(arr1, arr2) {
            const disjointArr1 = arr1.filter(item => !arr2.includes(item));
            const disjointArr2 = arr2.filter(item => !arr1.includes(item));
            return [...disjointArr1, ...disjointArr2];
        }
        function getIntersectionArray(arr1, arr2) {
            return arr1.filter(item => arr2.includes(item));
        }
        function similarity(s1, s2) {
            if(s1.length === 0 && s2.length === 0) {
                return 0
            }
            const a = getIntersectionArray(s1, s2).length;
            const b = getDisjointArray(s1, s2).length;
            if(a === 0) {
                return 0;
            }
            // const l_a = s1.length;
            // const l_b = s2.length;
            
            return b/a;
        }
        function sameArr(a, b) {
            return (a[0] === b[0] && a[1] === b[1]) 
                || (a[0] === b[1] && a[1] === b[0]) 
        }
        const matrix = [];
        function getArraysBySimilarity(arrays) {
            const n = arrays.length;
            const arr = [];
            for (let i = 0; i < n; i++) { 
                for (let j = 0; j < n; j++) {
                    if(i === j) continue;
                    const s = similarity(arrays[i], arrays[j]);
                    if(s > 0) {
                        const t = [i, j];
                        if(!arr.find(q => sameArr(t, q))) {
                            arr.push([i, j, s]);
                        }
                        if(!matrix[i]) {
                            matrix[i] = [];
                        }
                        matrix[i][j] = s;
                    }
                }   
            }
            return arr
        }
        const arr = getArraysBySimilarity(views.map(v => v.refs || []));
        // console.log(arr);
        function circus(arr) {
            // const circus = [];
            const t = arr.slice().sort((a,b) => a[2] - b[2]);
            const stack = [];
            const ks = [];
            while(t.length) {
                stack.push(t.shift())
                const means = new Set();
                while(stack.length) {
                    const q = stack.shift();
                    means.add(q[0])
                    means.add(q[1]);
                    const idx1 = t.findIndex(_t => _t.includes(q[0]));
                    if(idx1 !== -1){
                        stack.push(t.splice(idx1, 1)[0]);
                    }
                    
                    const idx2 = t.findIndex(_t => _t.includes(q[1]));
                    if(idx2 !== -1){
                        stack.push(t.splice(idx2, 1)[0]);
                    }
                }
                ks.push(Array.from(means));
                
            }
           

            // console.log(ks)
            return ks;
        }
        
        const solved = circus(arr)
        const sortedViews = [];
        const indexs = new Array(views.length).fill(1).map((_, idx) => idx);
        const indexexist = [];
        solved.forEach(mean => {
            const data = [];
            mean.forEach((idx) => {
                data.push({ view: views[idx], idx });
                indexexist.push(idx);
            });
            const cluster = hcluster(data, (c1, c2) => {
                const s = matrix[c1.idx]?.[c2.idx] || matrix[c2.idx]?.[c1.idx] || Infinity;
                return s;
            }, 'single');
            // console.log(cluster);
            
            traverseTree(cluster, (value) => {
                sortedViews.push(value.view);
            })

            // mean.forEach((idx) => {
            //     sortedViews.push(views[idx]);
            //     indexexist.push(idx);
            // })
        });
        // console.log(indexs);
        // console.log(sortedViews);
        const interindex = getDisjointArray(indexs, indexexist)
        interindex.forEach(idx => {
            sortedViews.push(views[idx]);
        })

        ;
        // function sortArraysBySimilarity(arrays) {
        //     const n = arrays.length;
        //     const visited = new Array(n).fill(false);
        //     for (let i = 0; i < n; i++) {  
        //         if (visited[i]) continue;
        //         const similar = [i];
        //         visited[i] = true;
        //         for (let j = i + 1; j < n; j++) {
        //             if (visited[j]) continue;
        //             // const sim = similarity(arrays[i], arrays[j]);
        //             if (similarity(arrays[i], arrays[j])) {
        //                 similar.push(j);
        //                 visited[j] = true;
        //             }
        //         }
            
        //         sortedViews.push(similar.map(idx => views[idx]));
        //     }
        // }
        
        // sortArraysBySimilarity(views.map(v => v.refs || []));
        // sortedViews = sortedViews.flat();
        

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
        let viewNodes = sortedViews.map(i => new PlainERnode(i, 'View'));
        
        
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

        // viewNodes.forEach(vnode => {
        //     const source = vnode.source
        //     const dependencies = [];
        //     function iterate(node) {

        //     }
        //     const logiclist = logicNodes.filter(n => n.source.refByView.includes(source));
        //     const structlist = structNodes.filter(n => n.source.refByView.includes(source));
        //     const entitylist = entityNodes.filter(n => n.source.refByView.includes(source));
        //     const h = Math.max(getHeight(logiclist), getHeight(eventlist));
        //     reduceHeight = h + gap * 2;
        // });


        // 
        function layoutMath(
            nodes, 
            columnPos = 0,
            callback,
            onlyX = false,
            minus = false
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
            if(minus) {
                columnPos = columnPos - reduceWidth / 2;
            } else {
                columnPos = columnPos + reduceWidth / 2;
            }
            
            nodes.forEach(n => {
                const instance = jflow.getRenderNodeBySource(n.source);
                instance.anchor[0]= columnPos;
            });
            if(minus) {
                columnPos = columnPos - reduceWidth / 2;
            } else {
                columnPos = columnPos + reduceWidth / 2;
            }
            return columnPos
        }

        

        function markSide(nodes) {
            nodes.forEach(n => {
                const chain = [];
                n.refByViewSide = false;
                function iterate(node) {
                    const source = node.source;
                    if(source.refByView.length || source.refByViewEvent.length || source.refByViewLogic.length) {
                        n.refByViewSide = true;
                        return true;
                    }
                    source.refByLogic.forEach((logic) => {
                        if(chain.includes(logic.name)) {
                            return;
                        }
                        chain.push(logic.name);
                        const node = logicNodes.find(node => node.source === logic);
                        iterate(node);
                    });
                    if(source.refByStructure) {
                        source.refByStructure.forEach((struct) => {
                            if(chain.includes(struct.name)) {
                                return;
                            }
                            chain.push(struct.name);
                            const node = structNodes.find(node => node.source === struct);
                            iterate(node);
                        });
                    }
                }
                iterate(n);
            });
        }
        markSide(logicNodes);
        const viewSideLogic = logicNodes.filter(n => n.refByViewSide);
        const otherSideLogic = logicNodes.filter(n => !n.refByViewSide);

        markSide(structNodes);
        const viewSideStructure = structNodes.filter(n => n.refByViewSide);
        const otherSideStructure = structNodes.filter(n => !n.refByViewSide);


        let columnspan = [
            entityNodes,
            viewSideStructure, 
            // logicNodes, 
        ].reduce((columnpos, nodes) => {
            if(nodes.length === 0) {
                return columnpos;
            }
            return layoutMath(nodes, columnpos) + 200;
        }, 0);


        
        function _handleLevelMap(series, refs) {
            let _nodeMap = new Map();
            series.forEach(node => {
                const source = node.source;
                const name = source.name 
                if(!_nodeMap.has(name)) {
                    _nodeMap.set(name, {
                        node, 
                        level: 0
                    })
                }
                source[refs].forEach(r => {
                    const node = series.find(node => node.source.name === r.name);
                    if(node) {
                        const name = node.name;
                        if(!_nodeMap.has(name)) {
                            _nodeMap.set(name, {
                                node, 
                                level: 0
                            })
                        }
                        const t = _nodeMap.get(name);
                        t.level ++;
                    }
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
            return levelMap;
        }

        const levelMap = _handleLevelMap(viewSideLogic, 'refByLogic');
        const leveledLogic = Object.keys(levelMap).sort();
        // console.log(leveledLogic);
 
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
                    if(otherSideLogic.find(l => l.source === s)) {
                        return;
                    }
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
            
        });

        const levelStructureMap = _handleLevelMap(viewSideStructure, 'refByStructure');
        const leveledStructure = Object.keys(levelStructureMap).sort();

        leveledStructure.forEach(level => {
            const sNodes = levelStructureMap[level];
            sNodes.forEach(node => {
                const source = node.source
                let height = 0;
                let count = 0;
                function reduceHeight(s) {
                    if(otherSideStructure.find(l => l.source === s)) {
                        return;
                    }
                    const instance = jflow.getRenderNodeBySource(s);
                    height += instance.anchor[1];
                    count++;
                }
                source.refByStructure.forEach(reduceHeight);
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
            
        });
        leveledStructure.reverse();
        leveledStructure.forEach(level => {
            const sNodes = levelStructureMap[level];
            if(sNodes.length) {
                columnspan = layoutMath(sNodes, columnspan, null, true) + 200
            }
        })

        leveledLogic.reverse();
        leveledLogic.forEach(level => {
            const logicNodes = levelMap[level];
            if(logicNodes.length) {
                columnspan = layoutMath(logicNodes, columnspan, null, true) + 200
            }
        })


        // viewSideStructure.forEach(node => {
        //     const source = node.source
        //     let height = 0;
        //     let count = 0;
        //     function reduceHeight(s) {
        //         const lgnode = otherSideLogic.find(l => l.source === s)
        //         if(lgnode) {
        //             if(!lgnode.refNodes) {
        //                 lgnode.refNodes = [];
        //             }
        //             lgnode.refNodes.push(source);
        //             return;
        //         }
        //         const instance = jflow.getRenderNodeBySource(s);
        //         height += instance.anchor[1];
        //         count++;
        //     }
        //     source.refByLogic.forEach(reduceHeight);
        //     source.refByView.forEach(reduceHeight)
        //     source.refByViewLogic.forEach(reduceHeight)
        //     source.refByViewEvent.forEach(reduceHeight);
        //     if(count === 0) {
                
        //     } else {
        //         const instance = jflow.getRenderNodeBySource(source);
        //         instance.anchor[1] = height/count
        //     }
        // })


        const entityRemains = [];
        entityNodes.forEach(node => {
            const source = node.source
            let height = 0;
            let count = 0;
            function reduceHeight(s) {
                const lgnode = otherSideLogic.find(l => l.source === s)
                if(lgnode) {
                    if(!lgnode.refNodes) {
                        lgnode.refNodes = [];
                    }
                    lgnode.refNodes.push(source);
                    return;
                }
                const snode = otherSideStructure.find(l => l.source === s)
                if(snode) {
                    if(!snode.refNodes) {
                        snode.refNodes = [];
                    }
                    snode.refNodes.push(source);
                    return;
                }
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
                // console.log(node, height, count)
                const instance = jflow.getRenderNodeBySource(source);
                instance.anchor[1] = height/count
            }
        });


        const levelMapOtherSide = _handleLevelMap(otherSideLogic, 'refByLogic');
        const leveledLogicOtherSide = Object.keys(levelMapOtherSide).sort();

        let otherSpan = -200

        leveledLogicOtherSide.forEach(level => {
            const logicNodes = levelMapOtherSide[level];
            logicNodes.forEach(node => {
                const source = node.source
                let height = 0;
                let count = 0;
                function reduceHeight(s) {
                    const instance = jflow.getRenderNodeBySource(s);
                    height += instance.anchor[1];
                    count++;
                }
                source.refByLogic.forEach((s) => {
                    const lgnode = otherSideLogic.find(l => l.source === s)
                    if(lgnode) {
                        if(!lgnode.refNodes) {
                            lgnode.refNodes = [];
                        }
                        lgnode.refNodes.push(source);
                    }
                });
                if(node.refNodes){
                    node.refNodes.forEach(reduceHeight);
                }
                if(count === 0) {
                    // logicRemains.push(node);
                } else {
                    const instance = jflow.getRenderNodeBySource(source);
                    instance.anchor[1] = height/count
                }
            });

            // otherSpan = layoutMath(logicNodes, otherSpan, null, true, true) - 200
            
        });

        otherSideStructure.forEach(node => {
            const source = node.source
            let height = 0;
            let count = 0;
            if(source.refByLogic){
                source.refByLogic.forEach((logic) => {
                    const ln = logicNodes.find(n => n.source === logic);
                    if(ln) {
                        const instance = jflow.getRenderNodeBySource(ln.source);
                        height += instance.anchor[1];
                        count++;
                    }
                });
            }
            if(node.refNodes){
                node.refNodes.forEach((s) => {
                    const instance = jflow.getRenderNodeBySource(s);
                    height += instance.anchor[1];
                    count++;
                });
            }
            if(count === 0) {
                // logicRemains.push(node);
            } else {
                const instance = jflow.getRenderNodeBySource(source);
                instance.anchor[1] = height/count
            }
        }) 
        otherSpan = layoutMath(otherSideStructure, otherSpan, null, true, true) - 200
        leveledLogicOtherSide.forEach(level => {
            const logicNodes = levelMapOtherSide[level];
            otherSpan = layoutMath(logicNodes, otherSpan, null, true, true) - 200
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
