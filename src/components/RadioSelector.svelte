<script>
    import { v4 as uuid } from "uuid";
    export let value;
    export let options;

    let effectiveOptions;
    $: {
        effectiveOptions = options.map((x) => {
            if (Array.isArray(x)) {
                return x;
            }
            return [x, x];
        });
    }

    const id = uuid();
</script>

<style>
    fieldset {
        display: flex;
        flex-flow: row wrap;
    }
    fieldset input[type="radio"] {
        display: none;
    }
    fieldset input[type="radio"] + label {
        background-color: #dddddd;
        flex: 1;
        text-align: center;
        padding: 0 0.5em;
        white-space: nowrap;
    }
    fieldset input[type="radio"]:checked + label {
        background-color: #ba75c7;
        font-weight: bold;
    }
</style>

<fieldset>
    {#each effectiveOptions as item (item[0])}
        <input
            type="radio"
            bind:group={value}
            value={item[0]}
            id="{id}-{item[0]}" />
        <label for="{id}-{item[0]}">{item[1]}</label>
    {/each}
</fieldset>
