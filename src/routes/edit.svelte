<style>
	article {
		display: flex;
		flex-flow: row;
		height: 100%;
		margin: 0;
	}

	svg {
		flex: 1;
	}

	path {
		vector-effect: non-scaling-stroke;
	}

	aside {
		flex: 0;
	}

	.units {
		display: flex;
		flex-flow: row;
	}
	.units input[type=radio] {
		display: none;
	}
	.units input[type=radio] + label {
		background-color: #DDDDDD;
		flex: 1;
		text-align: center;
	}
	.units input[type=radio]:checked + label {
		background-color: #ba75c7;
	}
</style>

<script>
	import Shape from '../lib/shape.js';
	import SpinnerSliderControl from '../components/SpinnerSliderControl.svelte';
	import ShapePreview3D from '../components/ShapePreview3D.svelte';

	let sides = 4;
	let height = 5;
	let baseSideLen = 5;
	let topSideLen = 5;
	let units = 'in';

	let maxTopSideLen;
	let walls;
	$: {
		// more fun trig times, which it took several tries to get right
		const baseRadius = (baseSideLen / 2) / Math.sin(Math.PI / sides);
		const baseApothem = baseRadius * Math.cos(Math.PI / sides);
		const topApothem = baseApothem + height;
		maxTopSideLen = topApothem * 2 * Math.tan(Math.PI / sides);
		if (topSideLen > maxTopSideLen) {
			topSideLen = Math.floor(maxTopSideLen);
		}
		walls = new Shape(sides, height, baseSideLen, topSideLen, units).calcWalls();
	}
</script>

<svelte:head>
	<title>slabforge | edit</title>
</svelte:head>

<article>
<svg viewBox="0 0 100 100">
	{#each walls as wall}
		<path d={wall} fill="none" stroke="#000000"></path>
	{/each}
</svg>
<ShapePreview3D shape={new Shape(sides, height, baseSideLen, topSideLen, units)}/>
<aside>
	<h2>Prism</h2>
	<SpinnerSliderControl bind:value={sides} min="3">Sides</SpinnerSliderControl>
	<SpinnerSliderControl bind:value={height} min="1">Height</SpinnerSliderControl>
	<SpinnerSliderControl bind:value={baseSideLen} min="1">Bottom Side Length</SpinnerSliderControl>
	<SpinnerSliderControl bind:value={topSideLen} min="1" max={maxTopSideLen}>Top Side Length</SpinnerSliderControl>
	<fieldset class="units">
		<input type="radio" bind:group={units} value="in" id="units-in"><label for="units-in">in</label>
		<input type="radio" bind:group={units} value="cm" id="units-cm"><label for="units-cm">cm</label>
	</fieldset>
	<a href="{sides}/{height}/{baseSideLen}/{topSideLen}/{units}.pdf">Download PDF</a>
</aside>
</article>
