<script>
    import * as THREE from 'three';
    import { onMount } from 'svelte';
    export let shape;

    let canvas;
    const geometry = shape.calc3DGeometry();
    $: {
        let g2 = shape.calc3DGeometry();
        geometry.vertices = g2.vertices;
        geometry.verticesNeedUpdate = true;
        geometry.faces = g2.faces;
        geometry.elementsNeedUpdate = true;
    }
    let y;
    $: y = shape.height / 2;

    onMount(() => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas });

        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        camera.position.z = 10;

        let frame;

        (function loop() {
            frame = requestAnimationFrame(loop);
            camera.position.y = y;
            renderer.render( scene, camera );
        }());

        return () => {
            cancelAnimationFrame(frame);
        };
    });
</script>

<canvas width="200" height="200" bind:this={canvas}></canvas>
