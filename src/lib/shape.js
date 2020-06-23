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
}
