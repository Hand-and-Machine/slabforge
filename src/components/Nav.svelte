<script>
    export let segment;
</script>

<style>
    nav {
        border-bottom: 1px solid
            hsla(var(--brown-h), var(--brown-s), var(--brown-l), 0.2);
        font-weight: 300;
        padding: 0 1em;
    }

    ul {
        margin: 0;
        padding: 0;
    }

    /* clearfix */
    ul::after {
        content: "";
        display: block;
        clear: both;
    }

    li {
        display: block;
        float: left;
    }

    [aria-current] {
        position: relative;
        display: inline-block;
    }

    [aria-current]::after {
        position: absolute;
        content: "";
        width: calc(100% - 1em);
        height: 2px;
        background-color: var(--brown);
        display: block;
        bottom: -1px;
    }

    a {
        text-decoration: none;
        padding: 1em 0.5em;
        display: block;
    }
</style>

<nav>
    <ul>
        <li>
            <a
                aria-current={segment === undefined ? 'page' : undefined}
                href=".">
                home
            </a>
        </li>
        <li>
            <a
                aria-current={segment === 'edit' ? 'page' : undefined}
                href="edit">
                edit
            </a>
        </li>
    </ul>
</nav>
