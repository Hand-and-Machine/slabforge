import PDFDocument from "pdfkit";
import makeShape, { convertUnits } from "../lib/shape.js";

function calcScale(units) {
    return convertUnits(1, units, "pt");
}

const fontSize = 14;

function labelBevelGuide(doc, scale, bevelGuideX, bevelGuideY) {
    doc.fontSize(fontSize / scale);
    doc.text("\n", bevelGuideX, bevelGuideY);
    doc.text("bevel guide", {
        lineBreak: false,
    });
}

function drawTemplate(
    doc,
    {
        widthPages,
        heightPages,
        scale,
        shapeWalls,
        shapeCreases,
        shapeBevelMarkers,
        bevelGuideX,
        bevelGuideY,
        units,
        bounds,
    },
    { safeX, safeY, safeWidth, safeHeight, pageX, pageY, extraScale },
    extraOptions = {}
) {
    let { drawGuide, labelGuide, fill, markBevels } = {
        drawGuide: true,
        labelGuide: true,
        fill: undefined,
        markBevels: false,
        ...extraOptions,
    };
    doc.save();
    doc.rect(safeX, safeY, safeWidth, safeHeight).clip();
    doc.translate(
        safeX + (widthPages * safeWidth) / 2 - pageX * safeWidth,
        safeY + (heightPages * safeHeight) / 2 - pageY * safeHeight
    )
        .scale(scale * extraScale)
        .translate(
            -(bounds.left + bounds.right) / 2,
            -(bounds.top + bounds.bottom) / 2
        )
        .lineWidth(convertUnits(0.05, "cm", units) * extraScale);
    if (!drawGuide) {
        shapeWalls = shapeWalls.slice(0, -1);
    }
    for (let wall of shapeWalls) {
        doc.path(wall);
        if (fill !== undefined) {
            doc.fill(fill);
        } else {
            doc.stroke();
        }
    }
    if (markBevels) {
        doc.save().lineWidth(convertUnits(2, "cm", units) * extraScale);
        for (let marker of shapeBevelMarkers) {
            doc.path(marker)
                .dash(0.5 / (scale * extraScale))
                .stroke()
                .undash();
        }
        doc.restore();
    } else {
        for (let crease of shapeCreases) {
            doc.path(crease)
                .dash(3 / (scale * extraScale))
                .stroke()
                .undash();
        }
    }
    if (labelGuide) {
        labelBevelGuide(doc, scale, bevelGuideX, bevelGuideY);
    }
    doc.restore();
}

function drawArrow(doc, arrowTailStartX, arrowTailStartY) {
    let arrowOffset = convertUnits(0.05, "in", "px");
    let arrowTailEndX = arrowTailStartX + convertUnits(0.5, "in", "pt");
    let arrowTailEndY = arrowTailStartY + 2 * arrowOffset;

    doc.moveTo(arrowTailStartX, arrowTailStartY)
        .lineTo(arrowTailEndX, arrowTailStartY)
        .stroke();
    doc.moveTo(arrowTailStartX, arrowTailEndY)
        .lineTo(arrowTailEndX, arrowTailEndY)
        .stroke();

    doc.moveTo(arrowTailEndX - arrowOffset, arrowTailStartY - arrowOffset)
        .lineTo(arrowTailEndX + arrowOffset, arrowTailStartY + arrowOffset)
        .lineTo(arrowTailEndX - arrowOffset, arrowTailEndY + arrowOffset)
        .stroke();
    return arrowTailEndX;
}

function drawTapeInstructions(
    doc,
    startY,
    stepHeight,
    stepNumber,
    templateSettings
) {
    let pageMargin = doc.page.margins.top;
    let { widthPages, heightPages } = templateSettings;

    doc.moveTo(doc.page.margins.left, convertUnits(startY, "in", "pt"))
        .lineTo(
            doc.page.width - doc.page.margins.right,
            convertUnits(startY, "in", "pt")
        )
        .stroke();

    doc.fontSize(fontSize).text(
        `${stepNumber}. Cut off the margins and tape the rest of these pages together to form one big pattern`,
        doc.page.margins.left,
        convertUnits(startY + 0.1, "in", "pt")
    );

    let miniPageHeight =
        convertUnits(stepHeight - 0.3, "in", "pt") / heightPages - 2;
    let miniPageWidth = (miniPageHeight / doc.page.height) * doc.page.width;
    let miniPageMargin = (miniPageHeight / doc.page.height) * pageMargin;

    for (let pageY = 0; pageY < heightPages; pageY++) {
        for (let pageX = 0; pageX < widthPages; pageX++) {
            let posX =
                doc.page.margins.left + 0.5 + pageX * (miniPageWidth + 2);
            let posY =
                convertUnits(startY + 0.3, "in", "pt") +
                pageY * (miniPageHeight + 2);
            doc.rect(posX, posY, miniPageWidth, miniPageHeight).stroke();
            drawTemplate(doc, templateSettings, {
                safeX: posX + miniPageMargin,
                safeY: posY + miniPageMargin,
                safeWidth: miniPageWidth - 2 * miniPageMargin,
                safeHeight: miniPageHeight - 2 * miniPageMargin,
                pageX,
                pageY,
                extraScale: miniPageHeight / doc.page.height,
            });
        }
    }

    let arrowTailStartX =
        doc.page.margins.left +
        0.5 +
        widthPages * (miniPageWidth + 2) +
        convertUnits(0.5, "in", "pt");
    let arrowTailStartY = convertUnits(
        startY + 0.05 + stepHeight / 2,
        "in",
        "pt"
    );

    let arrowTailEndX = drawArrow(doc, arrowTailStartX, arrowTailStartY);

    let tapedStartX = arrowTailEndX + convertUnits(0.5, "in", "pt");
    let tapedStartY = convertUnits(startY + 0.3, "in", "pt");
    let tapedInnerWidth = (miniPageWidth - 2 * miniPageMargin) * widthPages;
    let tapedInnerHeight = (miniPageHeight - 2 * miniPageMargin) * heightPages;
    doc.rect(
        tapedStartX,
        tapedStartY,
        tapedInnerWidth + 2 * miniPageMargin,
        tapedInnerHeight + 2 * miniPageMargin
    ).stroke();
    drawTemplate(
        doc,
        { ...templateSettings, widthPages: 1, heightPages: 1 },
        {
            safeX: tapedStartX + miniPageMargin,
            safeY: tapedStartY + miniPageMargin,
            safeWidth: tapedInnerWidth,
            safeHeight: tapedInnerHeight,
            pageX: 0,
            pageY: 0,
            extraScale: miniPageHeight / doc.page.height,
        }
    );
}

function drawCutTemplateInstructions(
    doc,
    startY,
    stepHeight,
    stepNumber,
    seamMode,
    templateSettings
) {
    doc.moveTo(doc.page.margins.left, convertUnits(startY, "in", "pt"))
        .lineTo(
            doc.page.width - doc.page.margins.right,
            convertUnits(startY, "in", "pt")
        )
        .stroke();

    doc.fontSize(fontSize).text(
        `${stepNumber}. Cut along the outermost edges to make your template piece${
            seamMode === "base" ? "s" : ""
        }`,
        doc.page.margins.left,
        convertUnits(startY + 0.1, "in", "pt")
    );

    let tapedX = doc.page.margins.left + 0.5;
    let tapedY = convertUnits(startY + 0.3, "in", "pt");
    let tapedHeight = convertUnits(stepHeight - 0.3, "in", "pt") - 2;
    let tapedWidth =
        (tapedHeight / doc.page.height) *
        doc.page.width *
        (templateSettings.widthPages / templateSettings.heightPages);
    let tapedMargin = (tapedHeight / doc.page.height) * doc.page.margins.top;
    doc.rect(tapedX, tapedY, tapedWidth, tapedHeight).stroke();
    drawTemplate(
        doc,
        { ...templateSettings, widthPages: 1, heightPages: 1 },
        {
            safeX: tapedX + tapedMargin,
            safeY: tapedY + tapedMargin,
            safeWidth: tapedWidth - 2 * tapedMargin,
            safeHeight: tapedHeight - 2 * tapedMargin,
            pageX: 0,
            pageY: 0,
            extraScale:
                tapedHeight / templateSettings.heightPages / doc.page.height,
        }
    );

    let arrowTailStartX = tapedX + tapedWidth + convertUnits(0.5, "in", "pt");
    let arrowTailStartY = convertUnits(
        startY + 0.05 + stepHeight / 2,
        "in",
        "pt"
    );

    let arrowTailEndX = drawArrow(doc, arrowTailStartX, arrowTailStartY);

    drawTemplate(
        doc,
        { ...templateSettings, widthPages: 1, heightPages: 1 },
        {
            safeX: arrowTailEndX + convertUnits(0.5, "in", "pt"),
            safeY: tapedY + tapedMargin,
            safeWidth: tapedWidth - 2 * tapedMargin,
            safeHeight: tapedHeight - 2 * tapedMargin,
            pageX: 0,
            pageY: 0,
            extraScale:
                tapedHeight / templateSettings.heightPages / doc.page.height,
        },
        { labelGuide: false }
    );
}

function drawCutClayInstructions(
    doc,
    startY,
    stepHeight,
    stepNumber,
    seamMode,
    shape,
    templateSettings
) {
    doc.moveTo(doc.page.margins.left, convertUnits(startY, "in", "pt"))
        .lineTo(
            doc.page.width - doc.page.margins.right,
            convertUnits(startY, "in", "pt")
        )
        .stroke();

    const bevelAngleDegrees = shape.bevelAngleDegrees || 45;
    doc.fontSize(fontSize).text(
        `${stepNumber}. Cut ${
            seamMode === "base" ? "those pieces" : "that piece"
        } out of your clay, using the bevel guide to help bevel the dotted edges at a ${bevelAngleDegrees}° angle`,
        doc.page.margins.left,
        convertUnits(startY + 0.1, "in", "pt")
    );

    let tapedX = doc.page.margins.left + 0.5;
    let tapedY = convertUnits(startY + 0.3, "in", "pt");
    let tapedHeight = convertUnits(stepHeight - 0.3, "in", "pt") - 2;
    let tapedWidth =
        (tapedHeight / doc.page.height) *
        doc.page.width *
        (templateSettings.widthPages / templateSettings.heightPages);
    let tapedMargin = (tapedHeight / doc.page.height) * doc.page.margins.top;

    drawTemplate(
        doc,
        { ...templateSettings, widthPages: 1, heightPages: 1 },
        {
            safeX: tapedX + tapedMargin,
            safeY: tapedY + tapedMargin,
            safeWidth: tapedWidth - 2 * tapedMargin,
            safeHeight: tapedHeight - 2 * tapedMargin,
            pageX: 0,
            pageY: 0,
            extraScale:
                tapedHeight / templateSettings.heightPages / doc.page.height,
        },
        { drawGuide: false, labelGuide: false }
    );

    let arrowTailStartX = tapedX + tapedWidth + convertUnits(0.5, "in", "pt");
    let arrowTailStartY = convertUnits(
        startY + 0.05 + stepHeight / 2,
        "in",
        "pt"
    );

    let arrowTailEndX = drawArrow(doc, arrowTailStartX, arrowTailStartY);

    drawTemplate(
        doc,
        { ...templateSettings, widthPages: 1, heightPages: 1 },
        {
            safeX: arrowTailEndX + convertUnits(0.5, "in", "pt"),
            safeY: tapedY + tapedMargin,
            safeWidth: tapedWidth - 2 * tapedMargin,
            safeHeight: tapedHeight - 2 * tapedMargin,
            pageX: 0,
            pageY: 0,
            extraScale:
                tapedHeight / templateSettings.heightPages / doc.page.height,
        },
        {
            drawGuide: false,
            labelGuide: false,
            fill: "#e2725b",
            markBevels: true,
        }
    );

    let sideViewTopLeftX =
        arrowTailEndX + convertUnits(0.5, "in", "pt") + tapedWidth;
    let sideViewTopY = arrowTailStartY;
    let sideViewBottomY = arrowTailStartY + convertUnits(0.1, "in", "pt");
    let sideViewHeight = sideViewBottomY - sideViewTopY;

    let sideViewBottomDelta =
        sideViewHeight * Math.tan((bevelAngleDegrees / 180) * Math.PI);
    let sideViewBottomLeftX = sideViewTopLeftX - sideViewBottomDelta;

    let sideViewMidLeftX = sideViewTopLeftX + convertUnits(0.25, "in", "pt");
    let sideViewMidRightX = sideViewMidLeftX + convertUnits(0.25, "in", "pt");
    let sideViewTopRightX = sideViewMidRightX + convertUnits(0.25, "in", "pt");
    let sideViewBottomRightX = sideViewTopRightX + sideViewBottomDelta;
    if (seamMode === "base") {
        sideViewBottomRightX = sideViewTopRightX - sideViewBottomDelta;
    }

    doc.save();
    doc.moveTo(sideViewMidLeftX, sideViewBottomY)
        .lineTo(sideViewBottomLeftX, sideViewBottomY)
        .lineTo(sideViewTopLeftX, sideViewTopY)
        .lineTo(sideViewMidLeftX, sideViewTopY)
        .fillAndStroke("#e2725b", "black");

    doc.moveTo(sideViewTopLeftX, sideViewBottomY)
        .lineTo(sideViewTopLeftX, sideViewTopY)
        .dash(1)
        .stroke()
        .undash();

    doc.save();
    doc.moveTo(sideViewMidLeftX, sideViewBottomY)
        .lineTo(sideViewMidRightX, sideViewBottomY)
        .moveTo(sideViewMidLeftX, sideViewTopY)
        .lineTo(sideViewMidRightX, sideViewTopY)
        .dash(2)
        .fillAndStroke();
    doc.restore();

    doc.moveTo(sideViewMidRightX, sideViewBottomY)
        .lineTo(sideViewBottomRightX, sideViewBottomY)
        .lineTo(sideViewTopRightX, sideViewTopY)
        .lineTo(sideViewMidRightX, sideViewTopY)
        .fillAndStroke();

    doc.moveTo(sideViewTopRightX, sideViewBottomY)
        .lineTo(sideViewTopRightX, sideViewTopY)
        .dash(1)
        .stroke();

    doc.restore();

    doc.fontSize(fontSize * 0.75).text(
        "(side view of walls)",
        sideViewBottomLeftX,
        sideViewBottomY + 2
    );
}

function drawAssembleInstructions(
    doc,
    startY,
    stepHeight,
    stepNumber,
    seamMode
) {
    doc.moveTo(doc.page.margins.left, convertUnits(startY, "in", "pt"))
        .lineTo(
            doc.page.width - doc.page.margins.right,
            convertUnits(startY, "in", "pt")
        )
        .stroke();

    doc.fontSize(fontSize).text(
        `${stepNumber}. ${
            seamMode === "base"
                ? "Put the wall together and attach it to the base"
                : "Fold the walls upwards"
        }`,
        doc.page.margins.left,
        convertUnits(startY + 0.1, "in", "pt")
    );

    // TODO: assembly
}

function drawInstructions(doc, sides, shape, templateSettings) {
    let {
        height,
        bottomWidth,
        topWidth,
        clayThickness,
        seamMode,
        units,
    } = shape;
    let { widthPages, heightPages } = templateSettings;

    doc.fontSize(fontSize);
    doc.text("Slabforge");
    if (sides === "∞") {
        doc.text("circle");
    } else {
        doc.text(`${sides} sides`);
    }
    doc.text(`height: ${height}${units}`)
        .text(`bottom width: ${bottomWidth}${units}`)
        .text(`top width: ${topWidth}${units}`)
        .text(`clay thickness: ${clayThickness}${units}`);

    let startY = 1.8;
    let stepNumber = 1;
    let stepCount = widthPages * heightPages > 1 ? 4 : 3;
    let stepHeight =
        (convertUnits(doc.page.height - doc.page.margins.bottom, "pt", "in") -
            startY) /
        stepCount;

    if (widthPages * heightPages > 1) {
        drawTapeInstructions(
            doc,
            startY,
            stepHeight,
            stepNumber,
            templateSettings
        );
        startY += stepHeight;
        stepNumber += 1;
    }

    drawCutTemplateInstructions(
        doc,
        startY,
        stepHeight,
        stepNumber,
        seamMode,
        templateSettings
    );
    startY += stepHeight;
    stepNumber += 1;

    drawCutClayInstructions(
        doc,
        startY,
        stepHeight,
        stepNumber,
        seamMode,
        shape,
        templateSettings
    );
    startY += stepHeight;
    stepNumber += 1;

    drawAssembleInstructions(doc, startY, stepHeight, stepNumber, seamMode);
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
        pageSize,
        noDownload,
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
    res.setHeader("Content-Type", "application/pdf");
    if (!noDownload) {
        const type = sides === "∞" ? "circle" : "prism-" + sides;
        const filename = `slabforge-${type}-${height}-${bottomWidth}-${topWidth}-${clayThickness}-${seamMode}-${units}.pdf`;
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );
    }

    const scale = calcScale(shape.units);
    const shapeBounds = shape.calcPDFBounds();
    const bounds = {
        left: shapeBounds.left * scale,
        right: shapeBounds.right * scale,
        top: shapeBounds.top * scale,
        bottom: shapeBounds.bottom * scale,
    };
    const minPDFWidth = bounds.right - bounds.left;
    const minPDFHeight = bounds.bottom - bounds.top;

    if (pageSize === "auto") {
        pageSize = [minPDFWidth + 72, minPDFHeight + 72];
    }
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

    const shapeWalls = shape.calcWalls();
    const shapeCreases = shape.calcCreaseMarkers();
    const shapeBevelMarkers = shape.calcBevelMarkers();

    // find the bevel guide position
    let bevelGuidePath = shapeWalls[shapeWalls.length - 1];
    let bevelGuidePositionMatch = /L [\-.\d]+,[\-.\d]+ ([\-.\d]+),([\-.\d]+)/.exec(
        bevelGuidePath
    );
    let bevelGuideX = parseFloat(bevelGuidePositionMatch[1]);
    let bevelGuideY = parseFloat(bevelGuidePositionMatch[2]);

    let templateSettings = {
        widthPages,
        heightPages,
        scale,
        shapeWalls,
        shapeCreases,
        shapeBevelMarkers,
        bevelGuideX,
        bevelGuideY,
        units,
        bounds: shapeBounds,
    };

    // instructions page
    drawInstructions(doc, sides, shape, templateSettings);

    doc.addPage();

    // actual template
    for (let pageY = 0; pageY < heightPages; pageY++) {
        for (let pageX = 0; pageX < widthPages; pageX++) {
            doc.rect(
                pageMargin,
                pageMargin,
                pageContentWidth,
                pageContentHeight
            ).stroke("#AAA");
            doc.strokeColor("black");
            drawTemplate(doc, templateSettings, {
                safeX: pageMargin,
                safeY: pageMargin,
                safeWidth: pageContentWidth,
                safeHeight: pageContentHeight,
                pageX,
                pageY,
                extraScale: 1,
            });
            if (pageX < widthPages - 1 || pageY < heightPages - 1) {
                doc.addPage();
            }
        }
    }
    doc.end();
}
