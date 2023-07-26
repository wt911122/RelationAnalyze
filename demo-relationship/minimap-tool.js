function createCanvas(wrapper) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const { width, height, left, top } = wrapper.getBoundingClientRect();
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.style.userSelect = 'none';
    const scale = window.devicePixelRatio;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);

    if(wrapper) {
        wrapper.style.position = 'relative';
        wrapper.style.overflow = 'hidden';
        wrapper.append(canvas);
    }
    return {
        canvas,
        width,
        height,
        raw_width: canvas.width,
        raw_height: canvas.height,
        left,
        top,
        ctx,
        scale,
    }
}
class MiniMapTool {
    miniMap = null;
    cacheMinimapCtx = null;
    _cacheMapImageData = null;
    constructor(wrapper, options = {}) {
        this.miniMap = createCanvas(wrapper);
        Object.assign(this.miniMap, options)
        const caheCanvas = document.createElement('canvas');
        caheCanvas.width = this.miniMap.raw_width;
        caheCanvas.height = this.miniMap.raw_height;
        this.cacheMinimapCtx = caheCanvas.getContext('2d');
    }
    registToJflow(jflowInstance) {
        jflowInstance.addEventListener('zoompan', (event) => {
            this.renderMap && this.renderMap(jflowInstance);
        });
        let pressDown = false;
        const miniMapCanvas = this.miniMap.canvas;
        let anchorX = 0;
        let anchorY = 0;
        miniMapCanvas.addEventListener('pointerdown', (event) => {
            let { offsetX, offsetY } = event
            // pressDown = true;
            // anchorX = offsetX;
            // anchorY = offsetY;
            this._onMoveMap && this._onMoveMap(jflowInstance, offsetX, offsetY)  
            const f = (event) => {
                let { offsetX, offsetY } = event
                this._onMoveMap && this._onMoveMap(jflowInstance, offsetX, offsetY)
                // if(offsetY < 5 || offsetX < 5 || offsetX > width-5 || offsetY > height-5) {
                //     pressDown = false;
                // }
            }
            document.addEventListener('pointermove', f)
            document.addEventListener('pointerup', () => {
                // pressDown = false;
                document.removeEventListener('pointermove', f);
            }, {
                once: true,
            })
        })
       
    }

    capture(jflowInstance) {
        jflowInstance._getBoundingGroupRect();
        const { 
            width: p_width, 
            height: p_height, 
            x: p_x, 
            y: p_y 
        } = jflowInstance.bounding_box;
        
        const { 
            width,
            height,
            raw_width,
            raw_height,
            scale,
            padding,
        } = this.miniMap
        const pad2 = padding * 2;
        const pad = padding;
        const r1 = (width - pad2) / p_width;
        const r2 = (height - pad2) / p_height;
        const r = Math.min(r1, r2);
        
        let m_x = 0;
        let m_y = 0;

        m_y = (height - p_height * r) / 2 - p_y * r;
        m_x = (width - p_width * r) / 2 - p_x * r;
        
        const cachectx = this.cacheMinimapCtx;
        cachectx.setTransform();
        cachectx.clearRect(0, 0, raw_width, raw_height);
        cachectx.scale(scale, scale);
        cachectx.transform(r, 0, 0, r, m_x, m_y);

        const br = [0,0,0,0]
        if(jflowInstance.NodeRenderTop) {
            jflowInstance._linkStack.render(cachectx, (link) => { link.isInViewBox(br); return true; });
            jflowInstance._stack.render(cachectx);
        } else {
            jflowInstance._stack.render(cachectx);
            jflowInstance._linkStack.render(cachectx, (link) => { link.isInViewBox(br); return true; });
        }

        this._cacheMapImageData = cachectx.getImageData(0, 0, raw_width, raw_height);
        Object.assign(this.miniMap, {
            m_x, m_y, r,
        })
        this.renderMap(jflowInstance);
    }

    renderMap(jflowInstance) {
        const { 
            m_x, 
            m_y,
            r, 
            raw_width,
            raw_height,
            scale,
            ctx,
        } = this.miniMap
        ctx.save();
        ctx.setTransform();
        ctx.clearRect(0, 0, raw_width, raw_height);
        // if(!i) {
        ctx.scale(scale, scale);
        ctx.putImageData(this._cacheMapImageData, 0, 0);
        ctx.transform(r, 0, 0, r, m_x, m_y);
        
        if(this.miniMap.renderExtra) {
            this.miniMap.renderExtra(ctx)
        }

        const [x, y, t, d] = jflowInstance._getViewBox();
        ctx.beginPath();
        ctx.rect(x, y,  t-x, d-y);
        ctx.setTransform();
        ctx.rect(0, 0, raw_width, raw_height);
        ctx.clip("evenodd");
        
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(0, 0, raw_width, raw_height);
        ctx.restore();

    }  
    
    _onMoveMap(jflowInstance, offsetX, offsetY) {
        const { m_x, m_y, r } = this.miniMap;
        const [x, y, t, d] = jflowInstance._getViewBox();
        // const w = t-x;
        const a = (t-x)/2 + x;
        const b = (d-y)/2 + y;
        
        const p = [a * r + m_x, b * r + m_y]
        jflowInstance._recalculatePosition(
            (p[0] - offsetX)/ r * jflowInstance.scale, 
            (p[1] - offsetY)/ r * jflowInstance.scale);
        jflowInstance._render();
        this.renderMap(jflowInstance);
    }

}

export default MiniMapTool;