<script>
    export let value;
    export let min = undefined;
    export let max = undefined;
    export let step = undefined;
</script>

<fieldset>
    <label>
        <slot/>
        <input type="range" min={min} max={max} step={step} bind:value={value}>
        <input type="number" min={min} max={max} step={step} bind:value={value}>
    </label>
</fieldset>
