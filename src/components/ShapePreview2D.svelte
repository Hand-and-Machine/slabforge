<script>
    import { onMount } from "svelte";
    import { convertUnits } from "../lib/shape";
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
    let strokeWidth;
    $: strokeWidth = convertUnits(0.125, "in", "px") * zoom;

    function px2svg(pxLen, units, zoom) {
        let svgLen = convertUnits(pxLen, "px", units);
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
        centerX = clamp(centerX, shape.calcPDFBounds()[0] / 2);
        centerY = clamp(centerY, shape.calcPDFBounds()[1] / 2);
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
            centerX = clamp(
                centerX - px2svg(event.pageX - dragLastX, shape.units, zoom),
                shape.calcPDFBounds()[0] / 2
            );
            centerY = clamp(
                centerY - px2svg(event.pageY - dragLastY, shape.units, zoom),
                shape.calcPDFBounds()[1] / 2
            );
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
        centerX -= newSvgX - oldSvgX;
        centerY -= newSvgY - oldSvgY;
    }
</script>

<style>
    article {
        flex: 1 0 0;
        display: flex;
        flex-flow: column;
    }

    h2 {
        flex: 0;
    }

    svg {
        flex: 1;
        background-color: white;
    }

    path {
        vector-effect: non-scaling-stroke;
    }
</style>

<svelte:window on:resize={peekSVGDimensions} />

<article>
    <h2>Printed Template</h2>
    <svg
        bind:this={svg}
        viewBox="{centerX - vbWidth / 2}
        {centerY - vbHeight / 2}
        {vbWidth}
        {vbHeight}"
        on:mousedown={handleMouseDown}
        on:mousemove={handleMouseMove}
        on:mouseup={handleMouseUp}
        on:mouseleave={handleMouseUp}
        on:wheel|preventDefault={handleScroll}>
        {#each walls as wall}
            <path
                d={wall}
                fill="none"
                stroke="#000000"
                stroke-width={strokeWidth} />
        {/each}
    </svg>
</article>
