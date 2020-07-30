<style>
    path {
        vector-effect: non-scaling-stroke;
    }
</style>

<script>
    import { onMount } from 'svelte';
    export let shape;

    let svg;
    let svgWidth = 1;
    let svgHeight = 1;

    function peekSVGDimensions() {
        svgWidth = svg.clientWidth;
        svgHeight = svg.clientHeight;
    }

    onMount(peekSVGDimensions);

    let walls;
    $: walls = shape.calcWalls();

    function px2svg(pxLen, units, zoom) {
        // on my current primary monitor, 72pt is 96px
        let ptLen = pxLen * 72 / 96;
        // these numbers are from https://www.w3.org/Style/Examples/007/units.en.html
        let svgLen;
        if (units === 'in') {
            svgLen = ptLen / 72;
        } else if (units === 'cm') {
            svgLen = ptLen / 72 * 2.54;
        }
        return svgLen / zoom;
    }

    function clamp(val, min, max = undefined) {
        if (max === undefined) {
            if (min > 0) {
                min = -min;
            }
            max = -min;
        }

        if (val < min) {
            return min;
        } else if (val > max) {
            return max;
        } else {
            return val;
        }
    }

    let ptWidth;
    let ptHeight;
    let centerX = 0;
    let centerY = 0;
    let zoom = 1;
    let vbWidth;
    let vbHeight;

    $: {
        vbWidth = px2svg(svgWidth, shape.units, zoom);
        vbHeight = px2svg(svgHeight, shape.units, zoom);
        centerX = clamp(centerX, shape.calcPDFWidth() / 2);
        centerY = clamp(centerY, shape.calcPDFWidth() / 2);
    }

    let dragLastX = 0;
    let dragLastY = 0;
    let dragging = false;

    function handleMouseDown(event) {
        dragLastX = event.pageX;
        dragLastY = event.pageY;
        dragging = true;
    }

    function handleMouseMove(event) {
        if (dragging) {
            let { pageX, pageY } = event;
            console.log({ centerX, centerY, pageX, pageY, dragLastX, dragLastY });
            centerX = clamp(centerX - px2svg(event.pageX - dragLastX, shape.units, zoom), shape.calcPDFWidth() / 2);
            centerY = clamp(centerY - px2svg(event.pageY - dragLastY, shape.units, zoom), shape.calcPDFWidth() / 2);
            dragLastX = event.pageX;
            dragLastY = event.pageY;
        }
    }

    function handleMouseUp(event) {
        dragging = false;
    }

    function handleScroll(event) {
        // we want the place where the mouse was to remain fixed
        let oldSvgX = px2svg(event.offsetX - svgWidth / 2, shape.units, zoom);
        let oldSvgY = px2svg(event.offsetY - svgHeight / 2, shape.units, zoom);
        if (event.deltaY > 0) {
            zoom /= 1.2;
        } else {
            zoom *= 1.2;
        }
        let newSvgX = px2svg(event.offsetX - svgWidth / 2, shape.units, zoom);
        let newSvgY = px2svg(event.offsetY - svgHeight / 2, shape.units, zoom);
        centerX -= (newSvgX - oldSvgX);
        centerY -= (newSvgY - oldSvgY);
    }
</script>

<svg bind:this={svg}
     viewBox="{centerX - vbWidth / 2} {centerY - vbHeight / 2} {vbWidth} {vbHeight}"
     on:mousedown={handleMouseDown}
     on:mousemove={handleMouseMove}
     on:mouseup={handleMouseUp}
     on:mouseleave={handleMouseUp}
     on:wheel|preventDefault={handleScroll}
>
    {#each walls as wall}
        <path d={wall} fill="none" stroke="#000000"></path>
    {/each}
</svg>
