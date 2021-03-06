import { Buffer } from "buffer";

import makeShape, { convertUnits } from "../lib/shape.js";

function writeVector(buffer, vector, position) {
    // apparently, in spite of three.js using the reasonable "y is up" standard,
    // Rhino and presumably every other STL viewer uses the inexcusable "z is up"
    // so we have to fix that.
    position = buffer.writeFloatLE(vector.x, position);
    position = buffer.writeFloatLE(vector.z, position);
    position = buffer.writeFloatLE(vector.y, position);
    return position;
}

export async function get(req, res, next) {
    const { searchParams: params } = new URL(
        req.url,
        `http://${req.headers.host}`
    );
    let {
        sides,
        height,
        bottomWidth,
        topWidth,
        clayThickness,
        seamMode,
        units,
    } = Object.fromEntries(params.entries());
    const shape = makeShape(
        sides,
        height,
        bottomWidth,
        topWidth,
        clayThickness,
        seamMode,
        units
    );
    res.setHeader("Content-Type", "model/x.stl-binary");
    const type = sides === "∞" ? "circle" : "prism-" + sides;
    const filename = `slabforge-${type}-${height}-${bottomWidth}-${topWidth}-${clayThickness}-${units}.stl`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const geometry = shape.calc3DGeometry();
    const headerBytes = 80 + 4;
    const triangleBytes = (4 * 3 * 4 + 2) * geometry.faces.length;

    const result = Buffer.alloc(headerBytes + triangleBytes);

    // 80-char header is empty, so skip past it
    let position = 80;

    // number of triangles
    position = result.writeUInt32LE(geometry.faces.length, position);

    // triangles
    for (let face of geometry.faces) {
        // normal
        position = writeVector(result, face.normal, position);
        // vertices
        position = writeVector(result, geometry.vertices[face.a], position);
        position = writeVector(result, geometry.vertices[face.b], position);
        position = writeVector(result, geometry.vertices[face.c], position);
        // "attribute byte count"
        position = result.writeUInt16LE(0, position);
    }

    res.end(result);
}
