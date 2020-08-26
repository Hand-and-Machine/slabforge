<script>
    import makeShape from "../lib/shape.js";
    import SpinnerSliderControl from "../components/SpinnerSliderControl.svelte";
    import ShapePreview2D from "../components/ShapePreview2D.svelte";
    import ShapePreview3D from "../components/ShapePreview3D.svelte";
    import RadioSelector from "../components/RadioSelector.svelte";

    let sidesSelection = "prism";
    let sides = 4;
    let height = 5;
    let bottomWidth = 5;
    let topWidth = 5;
    let units = "cm";
    let pageSize = "letter";

    $: {
        if (sidesSelection === "prism" && sides === "∞") {
            sides = 4;
        } else if (sidesSelection === "circle" && sides !== "∞") {
            sides = "∞";
        }
    }

    let shape;
    $: shape = makeShape(sides, height, bottomWidth, topWidth, units);

    let shapePDFQuery;
    $: {
        const params = new URLSearchParams({
            sides,
            height,
            bottomWidth,
            topWidth,
            units,
            pageSize,
        });
        shapePDFQuery = params.toString();
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
    <ShapePreview3D {shape} />
    <aside>
        <RadioSelector
            bind:value={sidesSelection}
            options={['prism', 'circle']} />
        {#if sidesSelection === 'prism'}
            <SpinnerSliderControl bind:value={sides} min="3" step="1" max="20">
                Sides
            </SpinnerSliderControl>
        {/if}
        <SpinnerSliderControl bind:value={height} min="1" step="0.1" max="50">
            Height
        </SpinnerSliderControl>
        <SpinnerSliderControl
            bind:value={bottomWidth}
            min="1"
            step="0.1"
            max="50">
            Bottom Width
        </SpinnerSliderControl>
        <SpinnerSliderControl bind:value={topWidth} min="1" step="0.1" max="50">
            Top Width
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
        <a href="shape.pdf?{shapePDFQuery}">Download PDF</a>
    </aside>
</article>
