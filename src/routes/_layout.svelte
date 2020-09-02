<script>
    import Nav from "../components/Nav.svelte";

    export let segment;
</script>

<style>
    main {
        position: relative;
        padding: 2em;
        margin: 0 auto;
        box-sizing: border-box;
        flex: 1;
    }
</style>

<Nav {segment} />

<main>
    <slot />
</main>
