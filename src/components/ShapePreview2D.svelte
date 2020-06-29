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

    let ptWidth;
    let ptHeight;
    let centerX = 0;
    let centerY = 0;
    let vbWidth;
    let vbHeight;

    $: {
        // on my current primary monitor, 72pt is 96px
        ptWidth = svgWidth * 72 / 96;
        ptHeight = svgHeight * 72 / 96;
        // these numbers are from https://www.w3.org/Style/Examples/007/units.en.html
        if (shape.units === 'in') {
            vbWidth = ptWidth / 72;
            vbHeight = ptHeight / 72;
        } else if (shape.units === 'cm') {
            vbWidth = ptWidth / 72 * 2.54;
            vbHeight = ptHeight / 72 * 2.54;
        }
    }
</script>

<svg bind:this={svg} viewBox="{centerX - vbWidth / 2} {centerY - vbHeight / 2} {vbWidth} {vbHeight}">
    {#each walls as wall}
        <path d={wall} fill="none" stroke="#000000"></path>
    {/each}
</svg>
