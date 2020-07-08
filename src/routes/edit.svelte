<style>
	article {
		display: flex;
		flex-flow: row;
		height: 100%;
		margin: 0;
	}

	object {
		flex: 1;
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
	import ShapePreview2D from '../components/ShapePreview2D.svelte';
	import ShapePreview3D from '../components/ShapePreview3D.svelte';

	let sides = 4;
	let height = 5;
	let baseSideLen = 5;
	let topSideLen = 5;
	let units = 'cm';

	let shape;
	$: shape = new Shape(sides, height, baseSideLen, topSideLen, units);
</script>

<svelte:head>
	<title>slabforge | edit</title>
</svelte:head>

<article>
<object data="{sides}/{height}/{baseSideLen}/{topSideLen}/{units}.pdf"
		type='application/pdf'>
	<ShapePreview2D shape={shape}/>
</object>
<ShapePreview3D shape={shape}/>
<aside>
	<h2>Prism</h2>
	<SpinnerSliderControl bind:value={sides} min="3">Sides</SpinnerSliderControl>
	<SpinnerSliderControl bind:value={height} min="1" step="0.1">Height</SpinnerSliderControl>
	<SpinnerSliderControl bind:value={baseSideLen} min="1" step="0.1">Bottom Side Length</SpinnerSliderControl>
	<SpinnerSliderControl bind:value={topSideLen} min="1" step="0.1">Top Side Length</SpinnerSliderControl>
	<fieldset class="units">
		<input type="radio" bind:group={units} value="in" id="units-in"><label for="units-in">in</label>
		<input type="radio" bind:group={units} value="cm" id="units-cm"><label for="units-cm">cm</label>
	</fieldset>
	<a href="{sides}/{height}/{baseSideLen}/{topSideLen}/{units}.pdf">Download PDF</a>
</aside>
</article>
