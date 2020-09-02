<script>
    import * as THREE from "three";
    import { onMount } from "svelte";
    import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
    export let shape;
    export let highlightTarget;

    let canvas;
    const geometry = shape.calc3DGeometry();
    $: {
        let g2 = shape.calc3DGeometry();
        geometry.vertices = g2.vertices;
        geometry.verticesNeedUpdate = true;
        geometry.faces = g2.faces;
        geometry.elementsNeedUpdate = true;
    }
    const highlightGeometry = shape.calcHighlightGeometry(highlightTarget);
    $: {
        let g2 = shape.calcHighlightGeometry(highlightTarget);
        highlightGeometry.vertices = g2.vertices;
        highlightGeometry.verticesNeedUpdate = true;
    }
    let y;
    $: y = shape.height / 2;

    let camera, renderer;

    function peekDimensions() {
        canvas.width = 0;
        canvas.height = 0;
        canvas.setAttribute("style", "");
        renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        camera.aspect = canvas.width / canvas.height;
        camera.updateProjectionMatrix();
    }

    onMount(() => {
        const scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

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

        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x3333ff,
        });
        const lines = new THREE.Line(highlightGeometry, lineMaterial);
        scene.add(lines);

        camera.position.setZ(10);
        camera.position.setY(shape.height * 1.5);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target = new THREE.Vector3(0, y, 0);

        peekDimensions();

        let frame;

        (function loop() {
            frame = requestAnimationFrame(loop);
            controls.target.setY(y);
            controls.update();
            light.position.setY(y * 3);
            renderer.render(scene, camera);
        })();

        return () => {
            cancelAnimationFrame(frame);
        };
    });
</script>

<style>
    article {
        flex: 1 0 0;
        display: flex;
        flex-flow: column;
    }

    h2 {
        flex: 0;
    }

    canvas {
        flex: 1;
    }
</style>

<article>
    <h2>Constructed Shape</h2>
    <canvas width="200" height="200" bind:this={canvas} />
</article>
