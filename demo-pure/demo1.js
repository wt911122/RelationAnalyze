import JFlow, { 
    Group,
    Text,
    BezierLink,
    LinearLayout,
    commonEventAdapter 
} from '@joskii/jflow';
import DemoLayout from '../demo-layout';
import source from '../data.json'
console.log(JFlow)
function renderNode(erNode) {
    const className = new Text({
        content: erNode.source.name,
        textColor: '#EB6864'
    });
    const wrapper = new Group({
        layout: new LinearLayout({
            direction: 'vertical',
            gap: 0,
        }),
        borderRadius: 8,
        borderColor: '#EB6864',
        borderWidth: 2,
        padding: 20,
    });
    wrapper.addToStack(className);
    // 增加内部节点后，需要重算布局
    wrapper.recalculate();
    return wrapper;
}

function renderLink(linkmeta, jflowStage) {
    const meta = linkmeta.meta;
    const link = new BezierLink({
        ...linkmeta,
        content: linkmeta.part,
        from: jflowStage.getRenderNodeBySource(linkmeta.from.source),
        to:  jflowStage.getRenderNodeBySource(linkmeta.to.source),
        backgroundColor: '#EB6864',
        fontSize: '16px'
    });
    return link;
}

function render(dom, data) {
    const layout = new DemoLayout(data);
    const jflowInstance = new JFlow({
        allowDrop: false,
        layout,
        eventAdapter: commonEventAdapter
    });

    layout.flowStack.forEach(({ type, layoutNode, source }) => {
        const Node = renderNode(layoutNode);
        jflowInstance.setLayoutNodeBySource(source, layoutNode);
        jflowInstance.setRenderNodeBySource(source, Node)
        jflowInstance.addToStack(Node);
    });

    layout.flowLinkStack.forEach(linkMeta => {
        const link = renderLink(linkMeta, jflowInstance);
        jflowInstance.addToLinkStack(link);
    });
    jflowInstance.$mount(dom);
}

render(document.getElementById('container'), source)