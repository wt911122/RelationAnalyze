let id = 0;
let structures = [];
let entities = [];
let views = [];
let logics = [];
let viewLogics = [];
let viewEvents = [];

// function genViewEventName(source, e) {
//    return `${source.name}/${e.element}@${e.event}`
// }
// function genViewLogicName(source, l) {
//     return `${source.name}/${l.name}`
//  }
// create
function createView(source) {
    const s = {
        id: id++,
        concept: 'view',
        source,
        name: source.name,
        logics: [],
        events: []
    }

    source.logics.map(l => createViewLogic(`${source.name}/${l.name}`, l, s))
    source.events.map(e => createViewEvent(`${source.name}/${e.element}@${e.event}`, e, s));
    views.push(s)
}
function createViewLogic(name, logic, view) {
    viewLogics.push({
        id: id++,
        concept: 'viewlogic',
        name,
        param: logic.param.slice(),
        return: logic.return.slice(),
        refByView: [view],
        refByViewLogic: [],
    })
}

function createViewEvent(name, event, view) {
    viewEvents.push({
        id: id++,
        concept: 'viewevents',
        name,
        event: event,
        refByView: [view],
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
        refByViewEvent: [],
    })
}

// function createOrGetEntity(source) {
//     let f = entities.find(e => e.name === source);
//     if(f) {
//         return f;
//     }
//     f = {
//         id: id++,
//         concept: 'entity',
//         isStructure: source.includes('.structures.'),
//         name: source,
//     }
//     entities.push(f);
//     return f;
// }
function createProperty(source) {
    return {
        id: id++,
        concept: 'property',
        source,
        ref: source.ref,
        name: source.name,
    }
}


function createStructrue(source) {
    structures.push({
        level: 0,
        id: id++,
        concept: 'structure',
        source,
        name: source.structure,
        properties: source.properties.map(createProperty),
        refByStructure: [],
        refByLogic: [],
        refByView: [],
        refByViewLogic: [],
        refByViewEvent: [],
    })
}

function createEntity(source) {
    entities.push({
        level: 0,
        id: id++,
        concept: 'entity',
        source,
        name: source.entity,
        refByStructure: [],
        refByLogic: [],
        refByView: [],
        refByViewLogic: [],
        refByViewEvent: [],
    })
}

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
    viewEvents = [];
    
    source.entities.map(createEntity);
    source.structures.map(createStructrue);
    source.logics.map(createLogic);
    source.views.map(createView);
    
    const findAndSync = (list, syncList, targetList) => {
        list.forEach(name => {
            const target = syncList.find(l => l.name === name);
            if(target) {
                targetList.push(target);
            }
        });
    }
    console.log(viewEvents)
    
    entities.forEach(entity => {
        const {
            refByLogic,
            refByView,
            refByViewLogic,
            refByViewEvent,
            refBySturcture
        } = entity.source;
        findAndSync(refByLogic, logics, entity.refByLogic);
        findAndSync(refByView, views, entity.refByView);
        findAndSync(refByViewLogic.map(vl => `${vl.view}/${vl.logic}`), viewLogics, entity.refByViewLogic);
        findAndSync(refByViewEvent.map(ve => `${ve.view}/${ve.element}@${ve.event}`), viewEvents, entity.refByViewEvent);
        findAndSync(refBySturcture, structures, entity.refByStructure);
    })

    structures.forEach(struct => {
        const {
            refByLogic,
            refByView,
            refByViewLogic,
            refByViewEvent,
            refBySturcture
        } = struct.source;
        findAndSync(refByLogic, logics, struct.refByLogic);
        findAndSync(refByView, views, struct.refByView);
        findAndSync(refByViewLogic.map(vl => `${vl.view}/${vl.logic}`), viewLogics, struct.refByViewLogic);
        findAndSync(refByViewEvent.map(ve => `${ve.view}/${ve.element}@${ve.event}`), viewEvents, struct.refByViewEvent);
        findAndSync(refBySturcture, structures, struct.refByStructure);
    });

    logics.forEach(l => {
        const {
            refByLogic,
            refByView,
            refByViewLogic,
            refByViewEvent,
        } = l.source;
        findAndSync(refByLogic, logics, l.refByLogic);
        findAndSync(refByView, views, l.refByView);
        findAndSync(refByViewLogic.map(vl => `${vl.view}/${vl.logic}`), viewLogics, l.refByViewLogic);
        findAndSync(refByViewEvent.map(ve => `${ve.view}/${ve.element}@${ve.event}`), viewEvents, l.refByViewEvent);
    });
    
    return {
        structures: structures.slice(),
        views: views.slice(),
        viewLogics: viewLogics.slice(),
        viewEvents: viewEvents.slice(),
        logics: logics.slice(),
        entities: entities.slice(),
    }
}