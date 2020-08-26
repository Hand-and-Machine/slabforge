<script>
    export let value;
    export let min = undefined;
    export let max = undefined;
    export let step = undefined;
</script>

<fieldset on:mouseenter on:mouseleave>
    <label>
        <slot />
        <input type="range" {min} {max} {step} bind:value />
        <input type="number" {min} {max} {step} bind:value />
    </label>
</fieldset>
