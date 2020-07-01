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
        const baseApothem = baseRadius * Math.cos(Math.PI / sides);
        const topApothem = topSideLen / (2 * Math.tan(Math.PI / sides));
        const wallLength = Math.sqrt(Math.pow(height, 2) + Math.pow(topApothem - baseApothem, 2));
        const result = [];
        for (let k = 0; k < sides; k++) {
            const theta = 2 * Math.PI * k / sides;
            const x = Math.cos(theta) * baseRadius;
            const y = Math.sin(theta) * baseRadius;
            let wallD = `M ${x},${y} `;
            // Hoooooooo boy, this sucks.
            // So first, we find the midpoint of this side:
            const nextTheta = 2 * Math.PI * (k + 1) / sides;
            const nextX = Math.cos(nextTheta) * baseRadius;
            const nextY = Math.sin(nextTheta) * baseRadius;
            const lowerMidX = (x + nextX) / 2;
            const lowerMidY = (y + nextY) / 2;
            // Then, we find the angle from the center to that midpoint:
            const midTheta = (theta + nextTheta) / 2;
            // Then, we extend along that angle from that midpoint at a distance of height:
            const upperMidX = lowerMidX + Math.cos(midTheta) * wallLength;
            const upperMidY = lowerMidY + Math.sin(midTheta) * wallLength;
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
        const baseApothem = baseRadius * Math.cos(Math.PI / sides);
        const topApothem = topSideLen / (2 * Math.tan(Math.PI / sides));
        const wallLength = Math.sqrt(Math.pow(height, 2) + Math.pow(topApothem - baseApothem, 2));
        return (baseRadius + wallLength) * 3;
    }

    calc3DGeometry() {
        let { sides, height, baseSideLen, topSideLen } = this;
        const geometry = new Geometry();

        function makeVertex(x, y, z) {
            const result = geometry.vertices.length;
            geometry.vertices.push(new Vector3(x, y, z));
            return result;
        }
        const baseRadius = (baseSideLen / 2) / Math.sin(Math.PI / sides);
        const topRadius = (topSideLen / 2) / Math.sin(Math.PI / sides);
        const halfThickness = 0.1;
        const outerBottomCenter = makeVertex(0, -halfThickness, 0);
        const innerBottomCenter = makeVertex(0, halfThickness, 0);
        const sideVertices = [];
        for (let k = 0; k < sides; k++) {
            const theta = 2 * Math.PI * k / sides;
            const outerBottomX = Math.cos(theta) * (baseRadius + halfThickness);
            const outerBottomZ = Math.sin(theta) * (baseRadius + halfThickness);
            const innerBottomX = Math.cos(theta) * (baseRadius - halfThickness);
            const innerBottomZ = Math.sin(theta) * (baseRadius - halfThickness);
            const outerTopX = Math.cos(theta) * (topRadius + halfThickness);
            const outerTopZ = Math.sin(theta) * (topRadius + halfThickness);
            const innerTopX = Math.cos(theta) * (topRadius - halfThickness);
            const innerTopZ = Math.sin(theta) * (topRadius - halfThickness);
            sideVertices.push({
                outerBottom: makeVertex(outerBottomX, -halfThickness, outerBottomZ),
                innerBottom: makeVertex(innerBottomX, halfThickness, innerBottomZ),
                outerTop: makeVertex(outerTopX, height, outerTopZ),
                innerTop: makeVertex(innerTopX, height, innerTopZ),
            });
        }
        for (let k = 0; k < sides; k++) {
            const thisSide = sideVertices[k];
            const nextSide = sideVertices[(k + 1) % sides];
            geometry.faces.push(
                new Face3(outerBottomCenter, thisSide.outerBottom, nextSide.outerBottom),
                new Face3(thisSide.outerBottom, thisSide.outerTop, nextSide.outerBottom),
                new Face3(nextSide.outerBottom, thisSide.outerTop, nextSide.outerTop),
                new Face3(innerBottomCenter, nextSide.innerBottom, thisSide.innerBottom),
                new Face3(thisSide.innerBottom, nextSide.innerBottom, thisSide.innerTop),
                new Face3(nextSide.innerBottom, nextSide.innerTop, thisSide.innerTop),
                new Face3(thisSide.outerTop, thisSide.innerTop, nextSide.outerTop),
                new Face3(nextSide.outerTop, thisSide.innerTop, nextSide.innerTop),
            );
        }
        geometry.computeFaceNormals();
        return geometry;
    }
}
