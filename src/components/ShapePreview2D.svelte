<style>
    svg {
        flex: 1;
    }

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

    function px2svg(pxLen, units) {
        // on my current primary monitor, 72pt is 96px
        let ptLen = pxLen * 72 / 96;
        // these numbers are from https://www.w3.org/Style/Examples/007/units.en.html
        if (units === 'in') {
            return ptLen / 72;
        } else if (units === 'cm') {
            return ptLen / 72 * 2.54;
        }
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
        vbWidth = px2svg(svgWidth, shape.units);
        vbHeight = px2svg(svgHeight, shape.units);
        centerX = clamp(centerX, shape.calcPDFWidth() / 2);
        centerY = clamp(centerY, shape.calcPDFWidth() / 2);
    }

    let dragLastX = 0;
    let dragLastY = 0;
    let dragging = false;

    function handleMouseDown(event) {
        dragLastX = event.offsetX;
        dragLastY = event.offsetY;
        dragging = true;
    }

    function handleMouseMove(event) {
        if (dragging) {
            centerX = clamp(centerX - px2svg(event.offsetX - dragLastX, shape.units), shape.calcPDFWidth() / 2);
            centerY = clamp(centerY - px2svg(event.offsetY - dragLastY, shape.units), shape.calcPDFWidth() / 2);
            dragLastX = event.offsetX;
            dragLastY = event.offsetY;
        }
    }

    function handleMouseUp(event) {
        dragging = false;
    }

    function handleScroll(event) {
        if (event.deltaY > 0) {
            zoom /= 1.2;
        } else {
            zoom *= 1.2;
        }
    }
</script>

<svg bind:this={svg}
     viewBox="{centerX - (vbWidth / zoom) / 2} {centerY - (vbHeight / zoom) / 2} {vbWidth / zoom} {vbHeight / zoom}"
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
