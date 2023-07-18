function figureOutRefs(result) {
    const refByLogic = [];
    const refByView = [];
    const refByViewLogic = [];
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
                            iterate(c, `${lastName}/${c.node.name}`);
                        } else {
                            if(c.node.concept === 'Logic') {
                                refByViewLogic.push({
                                    view: lastName,
                                    logic: c.node.name,
                                })
                            } else if(lastName) {
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
        refByViewLogic,
    }
}

function getTypeKey(node) {
    return (node.typeAnnotation || node.__TypeAnnotation)?.typeKey;
}
Promise.all([
    Promise.all($data.app.logics.map(async s => { 
        const result = await window.globalData.naslServer.findReferences(s);
        const {
            refByLogic,
            refByView,
            refByOther,
            refByViewLogic
        } = figureOutRefs(result);

        return {
            name: s.name,
            param: s.params.map(p => ({
                ref: getTypeKey(p),
                name: p.name,
            })),
            return: s.returns.map(p => ({
                ref: getTypeKey(p),
                name: p.name,
            })),
            refByLogic:  Array.from(new Set(refByLogic)),
            refByView: Array.from(new Set(refByView)),
            refByViewLogic,
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
            refByOther,
        } = figureOutRefs(result);
        
        return {
            structure: s.name,
            properties: s.properties.map(p => {
                return {
                    ref: getTypeKey(p),
                    name: p.name
                }
            }),
            refByLogic,
            refByView: Array.from(new Set(refByView)),
            refByViewLogic,
            refByOther
        }
    })).then(res => {
        return res
    }),
    Promise.resolve(
        $data.app.frontends.map(f => f.views.map(v => {
            const viewNames = [];
            function iterate(viewNode, lastName) {
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
                });
                viewNode.children.forEach(c => {
                    iterate(c, `${lastName}/${c.name}`);
                })
            }
            iterate(v, `${f.name}/${v.name}`);
            return viewNames;
        }).reduce((accu, curr) => accu.concat(curr), [])).flat())
]).then(([logics, structures, views]) => {
    console.log(JSON.stringify({ logics, structures, views }, null, '\t'));
})
            