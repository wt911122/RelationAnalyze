// import { DIRECTION } from '../../utils/constance';
class Property {
    constructor(source) {
        this.type = 'Property';
        this.source = source;
        this.name = source.name;
        this.refName = source.ref.name;
    }
}

// class StructrueNode {
//     constructor(source) {
//         this.type = 'Structrue';
//         this.source = source;
//         this.name = source.structure;
//         this.properties = source.properties.map((p) => {
//             const pnode = new StructrueProperty(p);
//             return pnode;
//         });
//     }
// }
class PlainERnode {
    constructor(source, type) {
        this.type = type;
        this.source = source;
        this.name = source.name;
        this.properties = (source.properties || []).map((p) => {
            const pnode = new Property(p);
            return pnode;
        });
    }
}
// export { StructrueNode, StructrueProperty, PlainERnode };
export { PlainERnode, Property };