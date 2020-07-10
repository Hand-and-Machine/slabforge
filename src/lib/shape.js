import { Geometry, Vector3, Face3 } from 'three';

class Prism {
    constructor(sides, height, bottomWidth, topWidth, units) {
        this.sides = sides;
        this.height = height;
        this.bottomWidth = bottomWidth;
        this.topWidth = topWidth;
        this.units = units;
    }

    doMath() {
        const { sides, height, bottomWidth, topWidth } = this;
        const bottomRadius = bottomWidth / 2;
        const bottomSideLen = bottomRadius * Math.sin(Math.PI / sides) * 2;
        const bottomApothem = bottomRadius * Math.cos(Math.PI / sides);
        const topRadius = topWidth / 2;
        const topSideLen = topRadius * Math.sin(Math.PI / sides) * 2;
        const topApothem = topRadius * Math.cos(Math.PI / sides);
        const wallLength = Math.sqrt(Math.pow(height, 2) + Math.pow(topApothem - bottomApothem, 2));
        return {
            bottomRadius,
            bottomSideLen,
            topRadius,
            topSideLen,
            wallLength,
        }
    }

    calcWalls() {
        const { sides } = this;
        const { bottomRadius, topSideLen, wallLength } = this.doMath();
        const result = [];
        for (let k = 0; k < sides; k++) {
            const theta = 2 * Math.PI * k / sides;
            const x = Math.cos(theta) * bottomRadius;
            const y = Math.sin(theta) * bottomRadius;
            // Hoooooooo boy, this sucks.
            // So first, we find the midpoint of this side:
            const nextTheta = 2 * Math.PI * (k + 1) / sides;
            const nextX = Math.cos(nextTheta) * bottomRadius;
            const nextY = Math.sin(nextTheta) * bottomRadius;
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
            let wallD = `M ${x},${y} L ${upper1X},${upper1Y} ${upper2X},${upper2Y} ${nextX},${nextY} z`;
            result.push(wallD);
        }
        return result;
    }

    calcPDFWidth() {
        const walls = this.calcWalls();
        const points = [];
        for (const wall of walls) {
            for (const point of wall.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) {
                points.push([parseFloat(point[1]), parseFloat(point[2])]);
            }
        }
        let highestCoordinate = 0;
        for (const point of points) {
            highestCoordinate = Math.max(highestCoordinate, ...point);
        }
        return highestCoordinate * 2 + 2;
    }

    calc3DGeometry() {
        let { sides, height } = this;
        const { bottomRadius, topRadius } = this.doMath();
        const geometry = new Geometry();

        function makeVertex(x, y, z) {
            const result = geometry.vertices.length;
            geometry.vertices.push(new Vector3(x, y, z));
            return result;
        }
        const halfThickness = 0.1;
        const outerBottomCenter = makeVertex(0, -halfThickness, 0);
        const innerBottomCenter = makeVertex(0, halfThickness, 0);
        const sideVertices = [];
        for (let k = 0; k < sides; k++) {
            const theta = 2 * Math.PI * k / sides;
            const outerBottomX = Math.cos(theta) * (bottomRadius + halfThickness);
            const outerBottomZ = Math.sin(theta) * (bottomRadius + halfThickness);
            const innerBottomX = Math.cos(theta) * (bottomRadius - halfThickness);
            const innerBottomZ = Math.sin(theta) * (bottomRadius - halfThickness);
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

class Conic {
    constructor(height, bottomWidth, topWidth, units) {
        this.height = height;
        this.bottomWidth = bottomWidth;
        this.topWidth = topWidth;
        this.units = units;
    }

    doMath() {
        const { height, bottomWidth, topWidth } = this;
        const bottomRadius = bottomWidth / 2;
        const topRadius = topWidth / 2;
        const wallLength = Math.sqrt(Math.pow(height, 2) + Math.pow(topRadius - bottomRadius, 2));
        return {
            bottomRadius,
            topRadius,
            wallLength,
        }
    }

    doAnnulusSectorMath() {
        const { bottomRadius, topRadius, wallLength } = this.doMath();
        // This is... let's go with "nontrivial".
        // We know we need the arclength of one edge of the wall to be the bottom circumference
        const bottomCircumference = 2 * Math.PI * bottomRadius;
        // We know we need the arclength of the other edge of the wall to be the top circumference
        const topCircumference = 2 * Math.PI * topRadius;
        // Just for this, let's use a min and a max
        const minCircumference = Math.min(bottomCircumference, topCircumference);
        const maxCircumference = Math.max(bottomCircumference, topCircumference);
        // Oh hey we have to do algebra and geometry at the same time!
        // We have θ, the angle of the annulus sector (unknown),
        // and r, the inner radius (unknown).
        // We know r', the distance between the inner and outer radii (wallLength),
        // and our circumferences are minC = r * θ and maxC = (r+r') * θ.
        // Two equations, two unknowns. Algebra time!
        // maxC = r * θ + r' * θ
        // maxC = minC + r' * θ
        // maxC - minC = r' * θ
        // (maxC-minC) / r' = θ
        const theta = (maxCircumference - minCircumference) / wallLength;
        // minC = r * θ
        // minC / θ = r
        const innerRadius = minCircumference / theta;
        // now we have all the ingredients. time to glue em together
        const outerRadius = innerRadius + wallLength;

        return {
            theta,
            innerRadius,
            outerRadius,
        }
    }

    calcWalls() {
        const { bottomWidth } = this;
        const { bottomRadius, topRadius, wallLength } = this.doMath();
        const result = [];
        // Bottom is easy.
        result.push(`M 0,0 A ${bottomRadius} ${bottomRadius} 0 1 0 0,${bottomWidth} ${bottomRadius} ${bottomRadius} 0 1 0 0,0`);
        // Wall when the radii match is easy.
        if (bottomRadius === topRadius) {
            const circumference = 2 * Math.PI * bottomRadius;
            result.push(`M -${circumference / 2},-1 h ${circumference} v -${wallLength} h -${circumference} z`);
        } else {
            // Wall when the radii do not match is a nuisance.
            const { theta, innerRadius, outerRadius } = this.doAnnulusSectorMath();
            console.log(this, this.doMath(), this.doAnnulusSectorMath());
            const p1x = innerRadius * Math.cos(-Math.PI / 2 + theta / 2);
            const p1y = innerRadius * Math.sin(-Math.PI / 2 + theta / 2);
            const p2x = innerRadius * Math.cos(-Math.PI / 2 - theta / 2);
            const p2y = innerRadius * Math.sin(-Math.PI / 2 - theta / 2);
            const p3x = outerRadius * Math.cos(-Math.PI / 2 - theta / 2);
            const p3y = outerRadius * Math.sin(-Math.PI / 2 - theta / 2);
            const p4x = outerRadius * Math.cos(-Math.PI / 2 + theta / 2);
            const p4y = outerRadius * Math.sin(-Math.PI / 2 + theta / 2);

            // we have our coordinates, now it is time to cook
            const wallD = `M ${p1x},${p1y}`
                + `A ${innerRadius} ${innerRadius} 0 0 0 ${p2x},${p2y}`
                + `L ${p3x},${p3y}`
                + `A ${outerRadius} ${outerRadius} 0 0 1 ${p4x},${p4y}`
                + `z`;
            result.push(wallD);
        }
        return result;
    }

    calcPDFWidth() {
        const { bottomWidth } = this;
        const { bottomRadius, topRadius, wallLength } = this.doMath();
        const coordinates = [bottomWidth];
        if (bottomRadius === topRadius) {
            const circumference = 2 * Math.PI * bottomRadius;
            coordinates.push(circumference / 2, wallLength);
        } else {
            const { outerRadius } = this.doAnnulusSectorMath();
            coordinates.push(outerRadius);
        }
        const highestCoordinate = Math.max(...coordinates);
        return highestCoordinate * 2 + 2;
    }

    calc3DGeometry() {
        const { height, bottomWidth, topWidth, units } = this;
        const RESOLUTION = 100;
        return new Prism(RESOLUTION, height, bottomWidth, topWidth, units).calc3DGeometry();
    }
}

export default function makeShape(sides, height, bottomWidth, topWidth, units) {
    if (sides === '∞') {
        return new Conic(height, bottomWidth, topWidth, units);
    } else {
        return new Prism(sides, height, bottomWidth, topWidth, units);
    }
}
