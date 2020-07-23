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
	}
</style>

<script>
	import makeShape from '../lib/shape.js';
	import SpinnerSliderControl from '../components/SpinnerSliderControl.svelte';
	import ShapePreview2D from '../components/ShapePreview2D.svelte';
	import ShapePreview3D from '../components/ShapePreview3D.svelte';
	import RadioSelector from '../components/RadioSelector.svelte';

	let sidesSelection = 4;
	let sides = sidesSelection;
	let height = 5;
	let bottomWidth = 5;
	let topWidth = 5;
	let units = 'cm';

	$: {
		if (sidesSelection !== 'custom') {
			sides = sidesSelection;
		}
	}

	let shape;
	$: shape = makeShape(sides, height, bottomWidth, topWidth, units);
</script>

<svelte:head>
	<title>slabforge | edit</title>
</svelte:head>

<article>
<ShapePreview2D shape={shape}/>
<ShapePreview3D shape={shape}/>
<aside>
	<RadioSelector bind:value={sidesSelection} options={[[3, '3 sides'], [4, '4 sides'], [6, '6 sides'], ['custom', 'custom sides'], ['∞', 'circle']]}/>
	{#if sidesSelection === 'custom'}
		<SpinnerSliderControl bind:value={sides} min="3" step="1" max="20">Sides</SpinnerSliderControl>
	{/if}
	<SpinnerSliderControl bind:value={height} min="1" step="0.1">Height</SpinnerSliderControl>
	<SpinnerSliderControl bind:value={bottomWidth} min="1" step="0.1">Bottom Width</SpinnerSliderControl>
	<SpinnerSliderControl bind:value={topWidth} min="1" step="0.1">Top Width</SpinnerSliderControl>
	<RadioSelector bind:value={units} options={['in', 'cm']}/>
	<a href="{sides}/{height}/{bottomWidth}/{topWidth}/{units}.pdf">Download PDF</a>
</aside>
</article>
