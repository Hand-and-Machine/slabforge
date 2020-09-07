<script>
    import round from "lodash/round";
    import makeShape, { convertUnits } from "../lib/shape.js";
    import SpinnerSliderControl from "../components/SpinnerSliderControl.svelte";
    import ShapePreview2D from "../components/ShapePreview2D.svelte";
    import ShapePreview3D from "../components/ShapePreview3D.svelte";
    import RadioSelector from "../components/RadioSelector.svelte";

    let sidesSelection = "prism";
    let sides = 4;
    let height = 5;
    let bottomWidth = 5;
    let topWidth = 5;
    let clayThickness = 0.25;
    let units = "in";
    let pageSize = "letter";
    let highlightTarget = "";

    $: {
        if (sidesSelection === "prism" && sides === "∞") {
            sides = 4;
        } else if (sidesSelection === "circle" && sides !== "∞") {
            sides = "∞";
        }
    }

    let shape;
    $: shape = makeShape(
        sides,
        height,
        bottomWidth,
        topWidth,
        clayThickness,
        units
    );

    let shapeExportQuery;
    $: {
        const params = new URLSearchParams({
            sides,
            height,
            bottomWidth,
            topWidth,
            clayThickness,
            units,
            pageSize,
        });
        shapeExportQuery = params.toString();
    }

    let oldUnits = units;
    $: {
        if (units !== oldUnits) {
            let fixUnits = (q) => round(convertUnits(q, oldUnits, units), 1);
            height = fixUnits(height);
            bottomWidth = fixUnits(bottomWidth);
            topWidth = fixUnits(topWidth);
            clayThickness = fixUnits(clayThickness);
            oldUnits = units;
        }
    }
</script>

<style>
    article {
        display: flex;
        flex-flow: row;
        height: 100%;
        margin: 0;
    }

    article > :global(*) {
        flex: 1;
    }

    aside {
        flex: 0;
        margin: 0 0.5rem;
    }
</style>

<svelte:head>
    <title>slabforge | edit</title>
</svelte:head>

<article>
    <ShapePreview2D {shape} />
    <ShapePreview3D {shape} {highlightTarget} />
    <aside>
        <RadioSelector
            bind:value={sidesSelection}
            options={['prism', 'circle']} />
        {#if sidesSelection === 'prism'}
            <SpinnerSliderControl bind:value={sides} min="3" step="1" max="20">
                Sides
            </SpinnerSliderControl>
        {/if}
        <SpinnerSliderControl
            bind:value={height}
            min="1"
            step="0.1"
            max="50"
            on:mouseenter={() => (highlightTarget = 'height')}
            on:mouseleave={() => (highlightTarget = '')}>
            Height
        </SpinnerSliderControl>
        <SpinnerSliderControl
            bind:value={bottomWidth}
            min="1"
            step="0.1"
            max="50"
            on:mouseenter={() => (highlightTarget = 'bottomWidth')}
            on:mouseleave={() => (highlightTarget = '')}>
            Bottom Width
        </SpinnerSliderControl>
        <SpinnerSliderControl
            bind:value={topWidth}
            min="1"
            step="0.1"
            max="50"
            on:mouseenter={() => (highlightTarget = 'topWidth')}
            on:mouseleave={() => (highlightTarget = '')}>
            Top Width
        </SpinnerSliderControl>
        <SpinnerSliderControl
            bind:value={clayThickness}
            min="0.1"
            step="0.05"
            max="1"
            on:mouseenter={() => (highlightTarget = 'clayThickness')}
            on:mouseleave={() => (highlightTarget = '')}>
            Clay Thickness
        </SpinnerSliderControl>
        <RadioSelector bind:value={units} options={['in', 'cm']} />
        <fieldset>
            <label>
                Page Size
                <select bind:value={pageSize}>
                    <option value="letter">Letter</option>
                    <option value="auto">Auto</option>
                </select>
            </label>
        </fieldset>
        <a href="shape.pdf?{shapeExportQuery}">Download PDF</a>
        <a href="shape.stl?{shapeExportQuery}">Download STL</a>
    </aside>
</article>
