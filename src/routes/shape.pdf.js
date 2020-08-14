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

    const pageMargin = doc.page.margins.top;
    const pageContentWidth = doc.page.width - 2 * pageMargin;
    const pageContentHeight = doc.page.height - 2 * pageMargin;

    const widthPages = Math.ceil(minPDFWidth / pageContentWidth);
    const heightPages = Math.ceil(minPDFHeight / pageContentHeight);

    const fullWidth = widthPages * pageContentWidth;
    const fullHeight = heightPages * pageContentHeight;

    if (sides === '∞') {
        doc.text("circle");
    } else {
        doc.text(`${sides} sides`);
    }
    doc.text(`height: ${height}${units}`)
        .text(`bottom width: ${bottomWidth}${units}`)
        .text(`top width: ${topWidth}${units}`);
    for (let pageY = 0; pageY < heightPages; pageY++) {
        for (let pageX = 0; pageX < widthPages; pageX++) {
            doc.save();
            doc.rect(pageMargin, pageMargin, pageContentWidth, pageContentHeight).clip();
            doc.translate(
                pageMargin + fullWidth / 2 - pageX * pageContentWidth,
                pageMargin + fullHeight / 2 - pageY * pageContentHeight
            )
                .scale(scale)
                .lineWidth((72 / 8) / scale);
            for (let wall of shape.calcWalls()) {
                doc.path(wall).stroke();
            }
            doc.restore();
            if (pageX < widthPages - 1 || pageY < heightPages - 1) {
                doc.addPage();
            }
        }
    }
    doc.end();
}
