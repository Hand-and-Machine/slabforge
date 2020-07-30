import PDFDocument from 'pdfkit';
import makeShape from '../lib/shape.js';

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
    const { searchParams: params } = new URL(req.url, `http://${req.headers.host}`);
    const { sides, height, bottomWidth, topWidth, units, pageSize } = Object.fromEntries(params.entries());
    const shape = makeShape(sides, height, bottomWidth, topWidth, units);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="shape.pdf"');

    const scale = calcScale(shape.units);
    const [ minPDFWidth, minPDFHeight ] = shape.calcPDFBounds().map(x => x * scale);
    const doc = new PDFDocument({
        size: pageSize,
        margin: 36,
    });
    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    if (pageWidth < minPDFWidth || pageHeight < minPDFHeight) {
        console.log('need to run page tiling ourselves'); // TODO
    }

    if (sides === '∞') {
        doc.text("circle");
    } else {
        doc.text(`${sides} sides`);
    }
    doc.text(`height: ${height}${units}`)
        .text(`bottom width: ${bottomWidth}${units}`)
        .text(`top width: ${topWidth}${units}`);
    doc.translate(pageWidth / 2, pageHeight / 2)
        .scale(scale)
        .lineWidth((72 / 8) / scale);
    for (let wall of shape.calcWalls()) {
        doc.path(wall).stroke();
    }
    doc.end();
}
