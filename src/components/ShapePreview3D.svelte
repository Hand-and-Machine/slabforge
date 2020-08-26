<script>
    import * as THREE from "three";
    import { onMount } from "svelte";
    import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

        renderer.setClearColor(0xffffff, 1);

        const light = new THREE.PointLight(0xffffff, 0.5, 0, 2);
        light.position.set(0, y * 3, 0);
        scene.add(light);

        scene.add(new THREE.AmbientLight(0xffffff, 0.5));

        const meshMaterial = new THREE.MeshStandardMaterial({
            color: 0xe2725b,
            vertexColors: true,
        });
        const mesh = new THREE.Mesh(geometry, meshMaterial);
        scene.add(mesh);

        camera.position.setZ(10);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target = new THREE.Vector3(0, y, 0);

        let frame;

        (function loop() {
            frame = requestAnimationFrame(loop);
            renderer.setSize(canvas.clientWidth, canvas.clientHeight, true);
            camera.aspect = canvas.width / canvas.height;
            camera.updateProjectionMatrix();
            controls.target.setY(y);
            controls.update();
            light.position.setY(y * 2.5);
            renderer.render(scene, camera);
        })();

        return () => {
            cancelAnimationFrame(frame);
        };
    });
</script>

<style>

</style>

<canvas width="200" height="200" bind:this={canvas} />
