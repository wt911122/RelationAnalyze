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
            