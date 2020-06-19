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

<!--suppress UnnecessaryLabelJS -->
<script>
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
		walls = [];
		for (let k = 0; k < sides; k++) {
			const theta = 2 * Math.PI * k / sides;
			const x = 50 + Math.cos(theta) * baseRadius;
			const y = 50 + Math.sin(theta) * baseRadius;
			let wallD = `M ${x},${y} `;
			// Hoooooooo boy, this sucks.
			// So first, we find the midpoint of this side:
			const nextTheta = 2 * Math.PI * (k + 1) / sides;
			const nextX = 50 + Math.cos(nextTheta) * baseRadius;
			const nextY = 50 + Math.sin(nextTheta) * baseRadius;
			const lowerMidX = (x + nextX) / 2;
			const lowerMidY = (y + nextY) / 2;
			// Then, we find the angle from the center to that midpoint:
			const midTheta = (theta + nextTheta) / 2;
			// Then, we extend along that angle from that midpoint at a distance of height:
			const upperMidX = lowerMidX + Math.cos(midTheta) * height;
			const upperMidY = lowerMidY + Math.sin(midTheta) * height;
			// Then, we go perpendicular to that angle, at a distance upperSideLength/2:
			const perpMidTheta = midTheta + Math.PI / 2;
			const upper1X = upperMidX - Math.cos(perpMidTheta) * topSideLen / 2;
			const upper1Y = upperMidY - Math.sin(perpMidTheta) * topSideLen / 2;
			// Then, we go the other direction perpendicular, same distance:
			const upper2X = upperMidX + Math.cos(perpMidTheta) * topSideLen / 2;
			const upper2Y = upperMidY + Math.sin(perpMidTheta) * topSideLen / 2;
			// Then, at long last, we glue it all together:
			wallD += `L ${upper1X},${upper1Y} ${upper2X},${upper2Y} ${nextX},${nextY} z`;
			walls.push(wallD);
		}
		const baseApothem = baseRadius * Math.cos(Math.PI / sides);
		const topApothem = baseApothem + height;
		maxTopSideLen = topApothem * 2 * Math.tan(Math.PI / sides);
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
		<label>Sides <input type="number" min="3" bind:value={sides}
							name="sides"></label>
	</fieldset>
	<fieldset>
		<label>Height <input type="number" min="1" bind:value={height}
							 name="height"></label>
	</fieldset>
	<fieldset>
		<label>Base Side Length <input type="number" min="1" bind:value={baseSideLen}
								       name="lowerRadius"></label>
	</fieldset>
	<fieldset>
		<label>Top Side Length <input type="number" min="1" max={maxTopSideLen} bind:value={topSideLen}
									  name="upperOffset"></label>
	</fieldset>
	<fieldset class="units">
		<input type="radio" bind:group={units} value="in" id="units-in"><label for="units-in">in</label>
		<input type="radio" bind:group={units} value="cm" id="units-cm"><label for="units-cm">cm</label>
	</fieldset>
</aside>
</article>
