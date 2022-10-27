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