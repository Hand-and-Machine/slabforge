import { Geometry, Vector3, Face3, Color } from "three";
import round from "lodash/round";

const RED = new Color(0xff6633);

export function convertUnits(quantity, from, to) {
    let quantityPt;
    if (from === "pt") {
        quantityPt = quantity;
    } else if (from === "in") {
        quantityPt = quantity * 72;
    } else if (from === "cm") {
        quantityPt = quantity * 28.35;
    } else if (from === "px") {
        // on my current primary monitor, 72pt is 96px
        quantityPt = quantity * (72 / 96);
    } else {
        throw new Error(`unknown unit: ${from}`);
    }

    if (to === "pt") {
        return quantityPt;
    } else if (to === "in") {
        return quantityPt / 72;
    } else if (to === "cm") {
        return quantityPt / 28.35;
    } else if (to === "px") {
        // on my current primary monitor, 72pt is 96px
        return quantityPt / (72 / 96);
    } else {
        throw new Error(`unknown unit: ${to}`);
    }
}

class Prism {
    constructor(sides, height, bottomWidth, topWidth, clayThickness, units) {
        this.sides = sides;
        this.height = height;
        this.bottomWidth = bottomWidth;
        this.topWidth = topWidth;
        this.clayThickness = clayThickness;
        this.units = units;
    }

    get bevelAngleDegrees() {
        let { bevelFactor } = this.doMath();
        return round((bevelFactor / Math.PI) * 180, 2);
    }

    doMath() {
        const { sides, height, bottomWidth, topWidth } = this;
        const bottomApothem = bottomWidth / 2;
        const bottomRadius = bottomApothem / Math.cos(Math.PI / sides);
        const bottomSideLen = bottomRadius * Math.sin(Math.PI / sides) * 2;
        const topApothem = topWidth / 2;
        const topRadius = topApothem / Math.cos(Math.PI / sides);
        const topSideLen = topRadius * Math.sin(Math.PI / sides) * 2;
        const wallLength = Math.sqrt(
            Math.pow(height, 2) + Math.pow(topApothem - bottomApothem, 2)
        );
        const interiorAngle = (Math.PI * (sides - 2)) / sides;
        const halfInteriorAngle = interiorAngle / 2;
        const bevelFactor = Math.PI / 2 - halfInteriorAngle;
        return {
            bottomRadius,
            bottomSideLen,
            topRadius,
            topSideLen,
            wallLength,
            bevelFactor,
        };
    }

    calcWalls() {
        const { sides, clayThickness } = this;
        const {
            bottomRadius,
            topSideLen,
            wallLength,
            bevelFactor,
        } = this.doMath();
        let base = "M ";
        const wallData = [];
        const result = [];
        for (let k = 0; k < sides; k++) {
            const theta = (2 * Math.PI * k) / sides;
            const x = Math.cos(theta) * bottomRadius;
            const y = Math.sin(theta) * bottomRadius;
            // Hoooooooo boy, this sucks.
            // So first, we find the midpoint of this side:
            const nextTheta = (2 * Math.PI * (k + 1)) / sides;
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
            const upper1X =
                upperMidX - (Math.cos(perpMidTheta) * topSideLen) / 2;
            const upper1Y =
                upperMidY - (Math.sin(perpMidTheta) * topSideLen) / 2;
            // Then, we go the other direction perpendicular, same distance:
            const upper2X =
                upperMidX + (Math.cos(perpMidTheta) * topSideLen) / 2;
            const upper2Y =
                upperMidY + (Math.sin(perpMidTheta) * topSideLen) / 2;
            // Then, at long last, we glue it all together:
            base += `${x},${y} ${upper1X},${upper1Y} ${upper2X},${upper2Y} `;
            wallData.push({ upper1X, upper1Y, upper2X, upper2Y, midTheta });
        }
        base += "z";

        // calculate the bevel guide
        const { upper1X, upper1Y, upper2X, upper2Y, midTheta } = wallData[0];
        const GUIDE_OFFSET = 1;
        const bevelGuideStartTopX = upper1X + Math.cos(midTheta) * GUIDE_OFFSET;
        const bevelGuideStartTopY = upper1Y + Math.sin(midTheta) * GUIDE_OFFSET;
        const bevelGuideEndTopX = upper2X + Math.cos(midTheta) * GUIDE_OFFSET;
        const bevelGuideEndTopY = upper2Y + Math.sin(midTheta) * GUIDE_OFFSET;
        const bevelGuideStartBottomX =
            bevelGuideStartTopX +
            Math.cos(midTheta - bevelFactor) * clayThickness;
        const bevelGuideStartBottomY =
            bevelGuideStartTopY +
            Math.sin(midTheta - bevelFactor) * clayThickness;
        const bevelGuideEndBottomX =
            bevelGuideEndTopX +
            Math.cos(midTheta + bevelFactor) * clayThickness;
        const bevelGuideEndBottomY =
            bevelGuideEndTopY +
            Math.sin(midTheta + bevelFactor) * clayThickness;
        result.push(
            `M ${bevelGuideStartTopX},${bevelGuideStartTopY} L ${bevelGuideStartBottomX},${bevelGuideStartBottomY} ${bevelGuideEndBottomX},${bevelGuideEndBottomY} ${bevelGuideEndTopX},${bevelGuideEndTopY} z`
        );
        return [base, ...result];
    }

    calcCreaseMarkers() {
        const { sides } = this;
        const { bottomRadius } = this.doMath();
        let result = "M ";
        for (let k = 0; k < sides; k++) {
            const theta = (2 * Math.PI * k) / sides;
            const x = Math.cos(theta) * bottomRadius;
            const y = Math.sin(theta) * bottomRadius;
            result += `${x},${y} `;
        }
        return [result + "z"];
    }

    calcBevelMarkers() {
        const { sides } = this;
        const { bottomRadius, topSideLen, wallLength } = this.doMath();
        let base = "M ";
        for (let k = 0; k < sides; k++) {
            const theta = (2 * Math.PI * k) / sides;
            const x = Math.cos(theta) * bottomRadius;
            const y = Math.sin(theta) * bottomRadius;
            // Hoooooooo boy, this sucks.
            // So first, we find the midpoint of this side:
            const nextTheta = (2 * Math.PI * (k + 1)) / sides;
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
            const upper1X =
                upperMidX - (Math.cos(perpMidTheta) * topSideLen) / 2;
            const upper1Y =
                upperMidY - (Math.sin(perpMidTheta) * topSideLen) / 2;
            // Then, we go the other direction perpendicular, same distance:
            const upper2X =
                upperMidX + (Math.cos(perpMidTheta) * topSideLen) / 2;
            const upper2Y =
                upperMidY + (Math.sin(perpMidTheta) * topSideLen) / 2;
            // Then, at long last, we glue it all together:
            base += `${x},${y} L ${upper1X},${upper1Y} M ${upper2X},${upper2Y} `;
        }
        base += `L ${bottomRadius},0`;
        return [base];
    }

    calcPDFBounds() {
        const walls = this.calcWalls();
        const xs = [];
        const ys = [];
        for (const wall of walls) {
            for (const point of wall.matchAll(
                /(-?\d+(?:\.\d+)?(?:e-?\d+)?)?,(-?\d+(?:\.\d+)?(?:e-?\d+)?)/g
            )) {
                let [x, y] = [point[1], point[2]];
                xs.push(parseFloat(x));
                ys.push(parseFloat(y));
            }
        }
        return {
            top: Math.min(...ys),
            bottom: Math.max(...ys),
            left: Math.min(...xs),
            right: Math.max(...xs),
        };
    }

    calc3DVertices() {
        let { sides, height, clayThickness } = this;
        const { bottomRadius, topRadius, bevelFactor } = this.doMath();
        const vertices = [];

        function makeVertex(x, y, z) {
            const result = vertices.length;
            vertices.push(new Vector3(x, y, z));
            return result;
        }
        const outerBottomCenter = makeVertex(0, 0, 0);
        const innerBottomCenter = makeVertex(0, clayThickness, 0);
        const topCenter = makeVertex(0, height + clayThickness, 0);
        const sideVertices = [];
        const cornerThickness = clayThickness / Math.cos(bevelFactor) / 2;
        for (let k = 0; k < sides; k++) {
            const theta = (2 * Math.PI * k) / sides;
            const outerBottomX =
                Math.cos(theta) * (bottomRadius + cornerThickness);
            const outerBottomZ =
                Math.sin(theta) * (bottomRadius + cornerThickness);
            const innerBottomX = Math.cos(theta) * bottomRadius;
            const innerBottomZ = Math.sin(theta) * bottomRadius;
            const outerTopX = Math.cos(theta) * (topRadius + cornerThickness);
            const outerTopZ = Math.sin(theta) * (topRadius + cornerThickness);
            const innerTopX = Math.cos(theta) * topRadius;
            const innerTopZ = Math.sin(theta) * topRadius;
            sideVertices.push({
                outerBottom: makeVertex(outerBottomX, 0, outerBottomZ),
                innerBottom: makeVertex(
                    innerBottomX,
                    clayThickness,
                    innerBottomZ
                ),
                outerTop: makeVertex(
                    outerTopX,
                    height + clayThickness,
                    outerTopZ
                ),
                innerTop: makeVertex(
                    innerTopX,
                    height + clayThickness,
                    innerTopZ
                ),
            });
        }
        return {
            vertices,
            outerBottomCenter,
            innerBottomCenter,
            topCenter,
            sideVertices,
        };
    }

    calc3DGeometry() {
        let { sides } = this;
        let {
            vertices,
            outerBottomCenter,
            innerBottomCenter,
            sideVertices,
        } = this.calc3DVertices();
        const geometry = new Geometry();
        geometry.vertices = vertices;
        for (let k = 0; k < sides; k++) {
            const thisSide = sideVertices[k];
            const nextSide = sideVertices[(k + 1) % sides];
            const outerBottom = new Face3(
                outerBottomCenter,
                thisSide.outerBottom,
                nextSide.outerBottom
            );
            outerBottom.color = RED;
            const innerBottom = new Face3(
                innerBottomCenter,
                nextSide.innerBottom,
                thisSide.innerBottom
            );
            innerBottom.color = RED;
            geometry.faces.push(
                outerBottom,
                new Face3(
                    thisSide.outerBottom,
                    thisSide.outerTop,
                    nextSide.outerBottom
                ),
                new Face3(
                    nextSide.outerBottom,
                    thisSide.outerTop,
                    nextSide.outerTop
                ),
                innerBottom,
                new Face3(
                    thisSide.innerBottom,
                    nextSide.innerBottom,
                    thisSide.innerTop
                ),
                new Face3(
                    nextSide.innerBottom,
                    nextSide.innerTop,
                    thisSide.innerTop
                ),
                new Face3(
                    thisSide.outerTop,
                    thisSide.innerTop,
                    nextSide.outerTop
                ),
                new Face3(
                    nextSide.outerTop,
                    thisSide.innerTop,
                    nextSide.innerTop
                )
            );
        }
        geometry.computeFaceNormals();
        return geometry;
    }

    calcHighlightGeometry(target) {
        let { sides } = this;
        let {
            vertices,
            outerBottomCenter,
            innerBottomCenter,
            topCenter,
            sideVertices,
        } = this.calc3DVertices();
        const geometry = new Geometry();
        if (target === "height") {
            geometry.vertices.push(
                vertices[innerBottomCenter],
                vertices[topCenter]
            );
        } else if (target === "topWidth") {
            // width is measured from midpoint to midpoint, not corner to corner
            const inner0 = vertices[sideVertices[0].innerTop];
            const inner1 = vertices[sideVertices[1].innerTop];
            const innerStart = new Vector3().lerpVectors(inner0, inner1, 0.5);
            let innerEnd;
            if (sideVertices.length % 2 === 0) {
                const half = Math.floor(sideVertices.length / 2);
                const innerHalf = vertices[sideVertices[half].innerTop];
                const innerHalfPlusOne =
                    vertices[sideVertices[half + 1].innerTop];
                innerEnd = new Vector3().lerpVectors(
                    innerHalf,
                    innerHalfPlusOne,
                    0.5
                );
            } else {
                // TODO find a way to fix this slight inaccuracy
                const half = Math.ceil(sideVertices.length / 2);
                innerEnd = vertices[sideVertices[half].innerTop];
            }
            geometry.vertices.push(innerStart, innerEnd);
        } else if (target === "bottomWidth") {
            // width is measured from midpoint to midpoint, not corner to corner
            const inner0 = vertices[sideVertices[0].innerBottom];
            const inner1 = vertices[sideVertices[1].innerBottom];
            const innerStart = new Vector3().lerpVectors(inner0, inner1, 0.5);
            let innerEnd;
            if (sideVertices.length % 2 === 0) {
                const half = Math.floor(sideVertices.length / 2);
                const innerHalf = vertices[sideVertices[half].innerBottom];
                const innerHalfPlusOne =
                    vertices[sideVertices[half + 1].innerBottom];
                innerEnd = new Vector3().lerpVectors(
                    innerHalf,
                    innerHalfPlusOne,
                    0.5
                );
            } else {
                // TODO find a way to fix this slight inaccuracy
                const half = Math.ceil(sideVertices.length / 2);
                innerEnd = vertices[sideVertices[half].innerBottom];
            }
            geometry.vertices.push(innerStart, innerEnd);
        } else if (target === "clayThickness") {
            // clay thickness is measured at the center of a side, not the corner
            const outer0 = vertices[sideVertices[0].outerTop];
            const inner0 = vertices[sideVertices[0].innerTop];
            const outer1 = vertices[sideVertices[1].outerTop];
            const inner1 = vertices[sideVertices[1].innerTop];
            const outerMid = new Vector3().lerpVectors(outer0, outer1, 0.5);
            const innerMid = new Vector3().lerpVectors(inner0, inner1, 0.5);
            geometry.vertices.push(outerMid, innerMid);
        } else {
            // if we let geometry.vertices be empty, this causes problems, for some reason.
            geometry.vertices.push(
                vertices[outerBottomCenter],
                vertices[innerBottomCenter]
            );
        }
        return geometry;
    }
}

const CONIC_RESOLUTION = 100;

class Conic {
    constructor(height, bottomWidth, topWidth, clayThickness, units) {
        this.height = height;
        this.bottomWidth = bottomWidth;
        this.topWidth = topWidth;
        this.clayThickness = clayThickness;
        this.units = units;
    }

    doMath() {
        const { height, bottomWidth, topWidth } = this;
        const bottomRadius = bottomWidth / 2;
        const topRadius = topWidth / 2;
        const wallLength = Math.sqrt(
            Math.pow(height, 2) + Math.pow(topRadius - bottomRadius, 2)
        );
        return {
            bottomRadius,
            topRadius,
            wallLength,
        };
    }

    doAnnulusSectorMath() {
        const { bottomRadius, topRadius, wallLength } = this.doMath();
        // This is... let's go with "nontrivial".
        // We know we need the arclength of one edge of the wall to be the bottom circumference
        const bottomCircumference = 2 * Math.PI * bottomRadius;
        // We know we need the arclength of the other edge of the wall to be the top circumference
        const topCircumference = 2 * Math.PI * topRadius;
        // Just for this, let's use a min and a max
        const minCircumference = Math.min(
            bottomCircumference,
            topCircumference
        );
        const maxCircumference = Math.max(
            bottomCircumference,
            topCircumference
        );
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
        const p1x = innerRadius * Math.cos(-Math.PI / 2 + theta / 2);
        let p1y = innerRadius * Math.sin(-Math.PI / 2 + theta / 2);
        const p2x = innerRadius * Math.cos(-Math.PI / 2 - theta / 2);
        let p2y = innerRadius * Math.sin(-Math.PI / 2 - theta / 2);
        const p3x = outerRadius * Math.cos(-Math.PI / 2 - theta / 2);
        let p3y = outerRadius * Math.sin(-Math.PI / 2 - theta / 2);
        const p4x = outerRadius * Math.cos(-Math.PI / 2 + theta / 2);
        let p4y = outerRadius * Math.sin(-Math.PI / 2 + theta / 2);
        // but wait there's more. compactness is a virtue, let's preserve that.
        // if we find the edges of the bounding box, we can bring our sector closer to the origin
        // without screwing anything up.
        const bbBottom = Math.max(p1y, p2y, p3y, p4y);
        const bbTop = -outerRadius;
        p1y -= bbBottom + 1;
        p2y -= bbBottom + 1;
        p3y -= bbBottom + 1;
        p4y -= bbBottom + 1;

        return {
            minCircumference,
            theta,
            innerRadius,
            outerRadius,
            p: [
                { x: p1x, y: p1y },
                { x: p2x, y: p2y },
                { x: p3x, y: p3y },
                { x: p4x, y: p4y },
            ],
            bbTop: bbTop - (bbBottom + 1),
        };
    }

    calcWalls() {
        const { bottomWidth, clayThickness } = this;
        const { bottomRadius, topRadius, wallLength } = this.doMath();
        const result = [];
        const outerBottomRadius = bottomRadius + clayThickness;
        const outerBottomWidth = bottomWidth + 2 * clayThickness;
        // Bottom is easy.
        result.push(
            `M 0,0 A ${outerBottomRadius} ${outerBottomRadius} 0 1 0 0,${outerBottomWidth} ${outerBottomRadius} ${outerBottomRadius} 0 1 0 0,0`
        );
        let bevelGuideLength;
        // Wall and bevel guide when the radii match is easy.
        if (bottomRadius === topRadius) {
            const circumference = 2 * Math.PI * bottomRadius;
            result.push(
                `M -${
                    circumference / 2
                },-1 h ${circumference} v -${wallLength} h -${circumference} z`
            );
            bevelGuideLength = circumference;
        } else {
            // Wall when the radii do not match is a nuisance.
            const {
                minCircumference,
                theta,
                innerRadius,
                outerRadius,
                p,
            } = this.doAnnulusSectorMath();
            const bigArc = theta > Math.PI ? 1 : 0;
            const wallD =
                `M ${p[0].x},${p[0].y} ` +
                `A ${innerRadius} ${innerRadius} 0 ${bigArc} 0 ${p[1].x},${p[1].y} ` +
                `L ${p[2].x},${p[2].y} ` +
                `A ${outerRadius} ${outerRadius} 0 ${bigArc} 1 ${p[3].x},${p[3].y} ` +
                `z`;
            result.push(wallD);
            bevelGuideLength = minCircumference;
        }
        result.push(
            `M ${bevelGuideLength / 2 + clayThickness / 2},${
                outerBottomWidth + 1
            } ` +
                `L ${bevelGuideLength / 2 - clayThickness / 2},${
                    outerBottomWidth + 1 + clayThickness
                } ` +
                `${-bevelGuideLength / 2 - clayThickness / 2},${
                    outerBottomWidth + 1 + clayThickness
                } ` +
                `${-bevelGuideLength / 2 + clayThickness / 2},${
                    outerBottomWidth + 1
                } z`
        );
        return result;
    }

    calcCreaseMarkers() {
        return [];
    }

    calcBevelMarkers() {
        const { bottomRadius, topRadius, wallLength } = this.doMath();
        const result = [];
        // Wall and bevel guide when the radii match is easy.
        if (bottomRadius === topRadius) {
            const circumference = 2 * Math.PI * bottomRadius;
            result.push(
                `M -${circumference / 2},-1 v -${wallLength} M ${
                    circumference / 2
                },-1 v -${wallLength}`
            );
        } else {
            // Wall when the radii do not match is a nuisance.
            const { p } = this.doAnnulusSectorMath();
            const wallD =
                `M ${p[1].x},${p[1].y} ` +
                `L ${p[2].x},${p[2].y} ` +
                `M ${p[3].x},${p[3].y} ` +
                `L ${p[0].x},${p[0].y} `;
            result.push(wallD);
        }
        return result;
    }

    calcPDFBounds() {
        const { bottomWidth, clayThickness } = this;
        const { bottomRadius, topRadius, wallLength } = this.doMath();
        const outerBottomWidth = bottomWidth + 2 * clayThickness;
        const xs = [0];
        const ys = [0, bottomWidth, outerBottomWidth + 1 + clayThickness];
        if (bottomRadius === topRadius) {
            const circumference = 2 * Math.PI * bottomRadius;
            xs.push(-circumference / 2, circumference / 2);
            ys.push(-wallLength - 1);
        } else {
            const { p, bbTop } = this.doAnnulusSectorMath();
            xs.push(...p.map((a) => a.x));
            ys.push(...p.map((a) => a.y));
            ys.push(bbTop);
        }
        return {
            top: Math.min(...ys),
            bottom: Math.max(...ys),
            left: Math.min(...xs),
            right: Math.max(...xs),
        };
    }

    getEquivalentPrism() {
        const { height, bottomWidth, topWidth, clayThickness, units } = this;
        return new Prism(
            CONIC_RESOLUTION,
            height,
            bottomWidth,
            topWidth,
            clayThickness,
            units
        );
    }

    calc3DGeometry() {
        return this.getEquivalentPrism().calc3DGeometry();
    }

    calcHighlightGeometry(target) {
        return this.getEquivalentPrism().calcHighlightGeometry(target);
    }
}

export default function makeShape(
    sides,
    height,
    bottomWidth,
    topWidth,
    clayThickness,
    units
) {
    if (sides === "∞") {
        return new Conic(
            parseFloat(height),
            parseFloat(bottomWidth),
            parseFloat(topWidth),
            parseFloat(clayThickness),
            units
        );
    } else {
        return new Prism(
            parseInt(sides),
            parseFloat(height),
            parseFloat(bottomWidth),
            parseFloat(topWidth),
            parseFloat(clayThickness),
            units
        );
    }
}
