// class {
//     constructor() {
//         this.x = undefined;
//         this.y = undefined;
//         this.width = 0;
//         this.height = 0;
//     }

//     setBoundingBox(box) {
//         Object.assign(this, box);
//     }

//     render(ctx) {
//         ctx.save();
//         ctx.lineWidth = 2;
//         ctx.strokeStyle = '#4E75EC';
//         ctx.fillStyle = 'rgba(78, 117, 236, 0.1)';
//         ctx.beginPath();
//         ctx.rect(this.x, this.y, this.width, this.height);
//         ctx.fill();
//         ctx.stroke();
//         ctx.restore();
//     }
// }
function renderHighlight(ctx, boundingRect, isCurrent) {
    const [ltx, lty, rbx, rby] = boundingRect;
    ctx.save();
    ctx.fillStyle = isCurrent ?  'rgba(255, 0, 0, 0.5)' : 'rgba(255, 117, 236, 0.5)';
    ctx.beginPath();
    ctx.rect(ltx, lty, rbx - ltx, rby - lty);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function easeOutSine(x) {
    return Math.sin((x * Math.PI) / 2);
}

export function doOverlap(rec1, rec2) {
    if (rec1[0] == rec1[2] || rec1[1] == rec1[3] ||
        rec2[0] == rec2[2] || rec2[1] == rec2[3]) {
        // the line cannot have positive overlap
        return false;
    }

    return !(rec1[2] <= rec2[0] ||   // left
                rec1[3] <= rec2[1] ||   // bottom
                rec1[0] >= rec2[2] ||   // right
                rec1[1] >= rec2[3]);    // top
}
 
class SearchTool {
    meta = [];
    result = [];

    currIdx = 0;

    _anime = null;
    _firstSearch = false;
    
    registToJflow(jflowInstance) {
        jflowInstance.addEventListener('afterJflowRender', (event) => {
            const ctx = event.detail.ctx;
            this.highlight(ctx, jflowInstance);
        });
        this.jflowInstance = jflowInstance;
    }

    index(source) {
        const {
            structures,
            views,
            viewLogics,
            viewEvents,
            logics,
            entities
        } = source;

        function doIndex(list) {
            return list.map(l => ({
                key: l.name,
                target: l,
            }));
        }
        this.meta = [
            ...doIndex(entities),
            ...doIndex(structures),
            ...doIndex(logics),
            ...doIndex(viewLogics),
            ...doIndex(viewEvents),
            ...doIndex(views),
        ];
    }

    request(content) {
        if(content.trim()) {
            this.result = this.meta.filter(({ key }) => key.includes(content));
        } else {
            this.result = [];
        }
        
    }

    get total() {
        return this.result.length;
    }

    get current() {
        return this.currIdx + 1;
    }

    toggleFirstSeach(val) {
        this._firstSearch = val;
    }

    next(jflowInstance, callback) {
        this.currIdx = ((this.currIdx + 1) % this.total);
        const m = this.result[this.currIdx];
        const renderNode = jflowInstance.getRenderNodeBySource(m.target);
        const boundingRect = renderNode.getBoundingRect();
        if(!doOverlap(renderNode._belongs._getViewBox(), boundingRect)){
            const center = jflowInstance._calculatePointBack([
                jflowInstance.canvasMeta.actual_width/2,
                jflowInstance.canvasMeta.actual_height/2
            ]);
            let offset = renderNode.anchor;
            if(renderNode._belongs.calculateToCoordination) {
                offset = node._belongs.calculateToCoordination(offset);
            }
    
            const deltaX = (center[0] - offset[0]) * jflowInstance.scale;
            const deltaY = (center[1] - offset[1]) * jflowInstance.scale;
            const duration = 250;
            const lastPosition = jflowInstance.position;
            const positionEnd = {
                x: lastPosition.x + deltaX,
                y: lastPosition.y + deltaY,
            }
            let lastStep = 0
            jflowInstance._panning = true;
            jflowInstance._zooming = true;
            if(this._anime) {
                jflowInstance._cancelAnime(this._anime);
            }
            const anime = jflowInstance.requestJFlowAnime((elapsed) => {
                if(elapsed > duration) {
                    jflowInstance._panning = false;
                    jflowInstance._zooming = false;
                    const pos = jflowInstance.position;
                    jflowInstance._recalculatePosition(
                        positionEnd.x - pos.x,
                        positionEnd.y - pos.y
                    )
                    if(callback) {
                        callback();
                    }
                    // jflowInstance._renderMap();
                    anime.cancel();
                } else {
                    const step = easeOutSine(elapsed/duration);
                    const r = step - lastStep;
                    lastStep = step;
                    jflowInstance._recalculatePosition(deltaX * r, deltaY * r);
                    // jflowInstance._renderMap();
                    if(callback) {
                        callback();
                    }
                }
            });
            this._anime = anime;
        } else {
            jflowInstance.scheduleRender()
            if(callback) {
                callback();
            }
        }

    }

    highlight(ctx, jflowInstance) {
        // let flag = false;
        if(this._firstSearch) {
            this.currIdx = 0;
        }
        this.result.forEach((m, idx) => {
            const renderNode = jflowInstance.getRenderNodeBySource(m.target);
            const boundingRect = renderNode.getBoundingRect();
            if(this._firstSearch && doOverlap(renderNode._belongs._getViewBox(), boundingRect)){
                this.currIdx = idx + 1;
                this._firstSearch = false;
            }
           
            renderHighlight(ctx, boundingRect, this.currIdx === idx);
        })
    }
}

export default SearchTool;