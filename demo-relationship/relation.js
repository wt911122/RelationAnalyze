let id = 0;
let entities = [];
let views = [];
let logics = [];

function createOrGetEntity(source) {
    let f = entities.find(e => e.name === source);
    if(f) {
        return f;
    }
    f = {
        id: id++,
        concept: 'entity',
        isStructure: source.includes('.structures.'),
        name: source,
    }
    entities.push(f);
    return f;
}
function createOrgetLogic(source) {
    let f = logics.find(e => e.name === source);
    if(f) {
        return f;
    }
    f = {
        id: id++,
        concept: 'logic',
        name: source,
        param: [],
        return: [],
        refByView: [],
    }
    logics.push(f);
    return f;
}
function createOrGetView(source) {
    let f = views.find(e => e.name === source);
    if(f) {
        return f;
    }
    f = {
        id: id++,
        concept: 'View',
        name: source,
    }
    views.push(f);
    return f;
}
function createProperty(source) {
    return {
        id: id++,
        concept: 'property',
        ref: createOrGetEntity(source.ref),
        name: source.name,
    }
}

function createStructrue(source) {
    return {
        id: id++,
        concept: 'structure',
        name: source.structure,
        properties: source.properties.map(createProperty),
        refByLogic: source.refByLogic.map(createOrgetLogic),
        refByView: source.refByView.map(createOrGetView),
    }
}

export function createRelataion(source) {
    entities = [];
    views = [];
    logics = [];
    const struts = source.structures.map(s => createStructrue(s)); 
    source.logics.forEach(l => {
        let logicInstance = createOrgetLogic(l.name);
        l.refByView.forEach(v => {
            logicInstance.refByView.push(createOrGetView(v));
        })
        logicInstance.param = l.param.slice();
        logicInstance.return = l.return.slice()
    });

    return {
        struts: struts.slice(),
        views: views.slice(),
        logics: logics.slice(),
        entities: entities.slice(),
    }

}