import { Geometry, Vector3, Face3 } from 'three';

export default class Shape {
    constructor(sides, height, baseSideLen, topSideLen, units) {
        this.sides = sides;
        this.height = height;
        this.baseSideLen = baseSideLen;
        this.topSideLen = topSideLen;
        this.units = units;
    }

    calcWalls() {
        let { sides, height, baseSideLen, topSideLen } = this;
        const baseRadius = (baseSideLen / 2) / Math.sin(Math.PI / sides);
        const result = [];
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
            result.push(wallD);
        }
        return result;
    }

    calcPDFWidth() {
        let { sides, height, baseSideLen, topSideLen } = this;
        const baseRadius = (baseSideLen / 2) / Math.sin(Math.PI / sides);
        return (baseRadius + height) * 3;
    }

    calc3DGeometry() {
        let { sides, height, baseSideLen, topSideLen } = this;
        const geometry = new Geometry();
        const baseRadius = (baseSideLen / 2) / Math.sin(Math.PI / sides);
        const topRadius = (topSideLen / 2) / Math.sin(Math.PI / sides);
        geometry.vertices.push(new Vector3(0, 0, 0));
        for (let k = 0; k < sides; k++) {
            const theta = 2 * Math.PI * k / sides;
            const baseX = Math.cos(theta) * baseRadius;
            const baseZ = Math.sin(theta) * baseRadius;
            const topX = Math.cos(theta) * topRadius;
            const topZ = Math.sin(theta) * topRadius;
            const nextTheta = 2 * Math.PI * (k + 1) / sides;
            const nextBaseX = Math.cos(nextTheta) * baseRadius;
            const nextBaseZ = Math.sin(nextTheta) * baseRadius;
            const nextTopX = Math.cos(nextTheta) * topRadius;
            const nextTopZ = Math.sin(nextTheta) * topRadius;
            const firstV = geometry.vertices.length;
            geometry.vertices.push(
                new Vector3(baseX, 0, baseZ),
                new Vector3(topX, height, topZ),
                new Vector3(nextBaseX, 0, nextBaseZ),
                new Vector3(nextTopX, height, nextTopZ)
            );
            geometry.faces.push(
                new Face3(0, firstV, firstV + 2),
                new Face3(firstV, firstV + 1, firstV + 2),
                new Face3(firstV + 2, firstV + 1, firstV + 3)
            );
        }
        return geometry;
    }
}
