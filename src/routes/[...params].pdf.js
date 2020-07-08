import PDFDocument from 'pdfkit';
import Shape from '../lib/shape.js';

function calcScale(units) {
    if (units === 'in') {
        return 72;
    } else if (units === 'cm') {
        return 28.35;
    } else {
        return 1;
    }
}

export async function get(req, res, next) {
    const { params } = req.params;
    const [ sides, height, baseSideLen, topSideLen, units ] = params;
    const shape = new Shape(parseInt(sides), parseInt(height),
        parseInt(baseSideLen), parseInt(topSideLen), units);
    res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', 'attachment; filename="shape.pdf"');

    const relPageSize = shape.calcPDFWidth();

    const scale = calcScale(shape.units);
    const pageSize = scale * relPageSize;
    const doc = new PDFDocument({
        size: [pageSize, pageSize],
        margin: 0,
    });
    doc.pipe(res);
    doc.text(`${sides} sides`, 10, 10)
        .text(`height: ${height}${units}`)
        .text(`bottom side length: ${baseSideLen}${units}`)
        .text(`top side length: ${topSideLen}${units}`);
    doc.scale(scale)
        .translate(relPageSize / 2, relPageSize / 2)
        .lineWidth((72 / 8) / scale);
    for (let wall of shape.calcWalls()) {
        doc.path(wall).stroke();
    }
    doc.end();
}
