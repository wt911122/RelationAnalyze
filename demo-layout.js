class VirtualNode {
    constructor(source) {
        this.type = 'VirtualNode';
        this.source = source;
    }

    makeLink(callback) {
        const {
            extends: ext, mixins, implements: impl
        } = this.source;
        if(ext) {
            callback({
                from: ext,
                to: this.source.name,
                part: 'extends',
            })
        }

        if(mixins) {
            mixins.forEach(t => {
                callback({
                    from: t,
                    to: this.source.name,
                    part: 'mixins',
                    fontSize: '24px',
                    lineDash: [5, 2]
                })
            })
        }
        if(impl) {
            callback({
                from: impl,
                to: this.source.name,
                part: 'implements',
            })
        }
    }
}

class DemoLayout {
    constructor(source) {
        this.static = false;
        // 管理节点和边界 必须
        this.flowStack = [];
        this.flowLinkStack = [];
        const nodeMap = {};
        const nodes = source.map(s => {
            const node = new VirtualNode(s);
            nodeMap[s.name] = node
            return node;
        });
        nodes.forEach(node => {
            this.flowStack.push({
                type: node.type,
                source: node.source,
                layoutNode: node,
            })
            node.makeLink((configs) => {
                const fromNode = nodeMap[configs.from];
                const toNode = nodeMap[configs.to];
                if(!fromNode) return;
                if(!toNode) return;
                
                this.flowLinkStack.push({
                    ...configs,
                    from: fromNode,
                    to: toNode
                })
            })
        });
        this.erNodes = nodes;
    }

    reflow(jflow) {
        const nodes = this.erNodes;
        nodes.forEach((node, idx) => {
            // 计算 节点位置
            const renderNode = jflow.getRenderNodeBySource(node.source) 
            renderNode.anchor = [-idx * 220, (idx % 2) * 80];
        });
    }

}

export default DemoLayout;
