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
</style>

<!--suppress UnnecessaryLabelJS -->
<script>
	let sides = 4;
	let height = 5;
	let lowerRadius = 5;
	let upperOffset = 0;

	let walls;
	$: {
		const upperRadius = lowerRadius + upperOffset;
		// We're going to need this later: convert from the upper radius to an upper side length.
		// it's trigonometry i did in my head so inb4 it's completely wrong
		const upperSideLength = 2 * upperRadius * Math.sin(Math.PI / sides);
		walls = [];
		for (let k = 0; k < sides; k++) {
			const theta = 2 * Math.PI * k / sides;
			const x = 50 + Math.cos(theta) * lowerRadius;
			const y = 50 + Math.sin(theta) * lowerRadius;
			let wallD = `M ${x},${y} `;
			// Hoooooooo boy, this sucks.
			// So first, we find the midpoint of this side:
			const nextTheta = 2 * Math.PI * (k + 1) / sides;
			const nextX = 50 + Math.cos(nextTheta) * lowerRadius;
			const nextY = 50 + Math.sin(nextTheta) * lowerRadius;
			const lowerMidX = (x + nextX) / 2;
			const lowerMidY = (y + nextY) / 2;
			// Then, we find the angle from the center to that midpoint:
			const midTheta = (theta + nextTheta) / 2;
			// Then, we extend along that angle from that midpoint at a distance of height:
			const upperMidX = lowerMidX + Math.cos(midTheta) * height;
			const upperMidY = lowerMidY + Math.sin(midTheta) * height;
			// Then, we go perpendicular to that angle, at a distance upperSideLength/2:
			const perpMidTheta = midTheta + Math.PI / 2;
			const upper1X = upperMidX - Math.cos(perpMidTheta) * upperSideLength / 2;
			const upper1Y = upperMidY - Math.sin(perpMidTheta) * upperSideLength / 2;
			// Then, we go the other direction perpendicular, same distance:
			const upper2X = upperMidX + Math.cos(perpMidTheta) * upperSideLength / 2;
			const upper2Y = upperMidY + Math.sin(perpMidTheta) * upperSideLength / 2;
			// Then, at long last, we glue it all together:
			wallD += `L ${upper1X},${upper1Y} ${upper2X},${upper2Y} ${nextX},${nextY} z`;
			walls.push(wallD);
		}
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
<aside>
	<h2>Prism</h2>
	<fieldset>
		<label>Sides <input type="number" min="3" max="8" bind:value={sides}
							name="sides"></label>
	</fieldset>
	<fieldset>
		<label>Height <input type="number" min="1" max="20" bind:value={height}
							 name="height"></label>
	</fieldset>
	<fieldset>
		<label>Lower Radius <input type="number" min="1" max="20" bind:value={lowerRadius}
								   name="lowerRadius"></label>
	</fieldset>
	<fieldset>
		<label>Upper/Lower Offset <input type="number" min="-10" max="10" bind:value={upperOffset}
										 name="upperOffset"></label>
	</fieldset>
</aside>
</article>
