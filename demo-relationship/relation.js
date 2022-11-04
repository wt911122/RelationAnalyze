let id = 0;
let structures = [];
let entities = [];
let views = [];
let logics = [];
let viewLogics = [];
// create
function createView(source) {
    const s = {
        id: id++,
        concept: 'view',
        source,
        name: source.name,
        logics: [],
    }

    source.logics.map(l => createViewLogic(`${source.name}/${l.name}`, l, s))
    views.push(s)
}
function createViewLogic(name, logic, view) {
    viewLogics.push({
        id: id++,
        concept: 'viewlogic',
        name,
        param: logic.param.slice(),
        return: logic.return.slice(),
        // refView: viewName,
        refByLogic: [],
        refByView: [view],
        refByViewLogic: [],
    })
}

function createLogic(source) {
    logics.push({
        level: 0,
        id: id++,
        concept: 'logic',
        source,
        name: source.name,
        param: source.param.slice(),
        return: source.return.slice(),
        refByLogic: [],
        refByView: [],
        refByViewLogic: [],
    })
}

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
function createProperty(source) {
    return {
        id: id++,
        concept: 'property',
        ref: createOrGetEntity(source.ref),
        name: source.name,
    }
}


function createStructrue(source) {
    structures.push({
        id: id++,
        concept: 'structure',
        source,
        name: source.structure,
        properties: source.properties.map(createProperty),
        refByLogic: [],
        refByView: [],
        refByViewLogic: [],
    })
}

// bind



/* 
function createOrGetView(source) {
    let f = views.find(e => e.name === source);
    if(f) {
        return f;
    }
    f = {
        id: id++,
        concept: 'View',
        name: source,
        logics: source.logics.map(l => createOrgetViewLogic(`${source}/${l}`))
    }
    views.push(f);
    return f;
}
function createOrgetViewLogic(source) {
    let f = viewLogics.find(e => e.name === source);
    if(f) {
        return f;
    }
    f = {
        id: id++,
        concept: 'viewlogic',
        name: source,
    }
    viewLogics.push(f);
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
        refByLogic: source.refByLogic(createOrgetLogic),
        refByView: source.refByView(createOrGetView),
    }
    logics.push(f);
    return f;
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
*/

function analyzeRefs(struts) {
    const isLogic = struts.concept === 'logic';
    // const isStructure = struts.concept === 'structure';
    const s = struts.source;
    const refByViewLogic = struts.refByViewLogic;
    const refByView = struts.refByView;
    const refByLogic = struts.refByLogic;
    s.refByViewLogic.forEach(({ view, logic }) => {
        const t = `${view}/${logic}`;
        const viewLogic = viewLogics.find(v => v.name === t);
        if(viewLogic) {
            refByViewLogic.push(viewLogic);
        }
    });

    s.refByView.forEach((rv) => {
        const view = views.find(v => v.name === rv);
        if(view) {
            refByView.push(view);
        }
    });

    s.refByLogic.forEach(rl => {
        const logic = logics.find(l => l.name === rl);
        if(logic) {
            if(isLogic) {
                logic.level++;
            }
            refByLogic.push(logic);
        }
    })
}

export function createRelataion(source) {
    id=0;
    entities = [];
    structures = [];
    views = [];
    logics = [];
    viewLogics = [];
    
    source.views.map(createView);
    source.logics.map(createLogic);
    source.structures.map(createStructrue);

    logics.forEach(l => {
        analyzeRefs(l)
    });
    structures.forEach(s => {
        analyzeRefs(s)
    });
    return {
        structures: structures.slice(),
        views: views.slice(),
        viewLogics: viewLogics.slice(),
        logics: logics.slice(),
        entities: entities.slice(),
    }
}