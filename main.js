const exportToImage = async () => {
    const element = document.getElementById("capture-table");
    try {
        const canvas = await html2canvas(element, {
            allowTaint: true,
            useCORS: true,
            scale: 2,
        });

        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `gmct-${generateCode([])}.png`;
        link.href = url;
        link.click();
        link.remove();
    } catch (err) {
        console.error("Conversion error:", err);
    }
};

const attemptDownload = () => {
    if ($("#capture table").length > 0) {
        exportToImage();
    }
};

const setInputs = () => {
    const url = new URL(window.location.href);
    const values = decodeURIComponent(url.searchParams.get("value")).split(/\-(?![^(]*\))/);
    
    const binaryMap = { "u": "unselected", "y": "yes", "n": "no" };
    const layoutMap = { "s": "unselected", "c": "rectilinear", "l": "polar", "h": "other", "i": "uniform" };
    const markTypeMap = { "s": "unselected", "i": "point", "t": "path", "l": "poly" };
    const channelMap = { "s": "unselected", "c": "encoding", "h": "inherited", "i": "uniform", "r": "varying" };

    $("#input-level").val(values[0]);
    $("#dropdown-touching").val(binaryMap[values[1]]);
    $("#dropdown-overlapping").val(binaryMap[values[2]]);
    $("#dropdown-global-layout").val(layoutMap[values[3]]);
    $("#dropdown-local-layout").val(layoutMap[values[4]]);
    $("#dropdown-mark-type").val(markTypeMap[values[5]]);
    $(".channel").each(function(index) {
        $($(this).children()[1]).val(channelMap[values[6 + index].substring(0, 1)]);
        if (values[6 + index].length > 1) {
            $($(this).children()[3]).val(values[6 + index].substring(2, values[6 + index].length - 1));
        } else {
            $($(this).children()[3]).val("");    
        }
    });
};

const generateCode = (visibleChannels) => {
    let code = "";

    code += $("#input-level").val() + "-";
    code += $("#dropdown-touching").val().substring(0, 1) + "-";
    code += $("#dropdown-overlapping").val().substring(0, 1) + "-";
    code += $("#dropdown-global-layout").val().substring(2, 3) + "-";
    code += $("#dropdown-local-layout").val().substring(2, 3) + "-";
    code += $("#dropdown-mark-type").val().substring(2, 3);
    $(".channel").each(function() {
        const channel = $(this).attr("id").substring(0, $(this).attr("id").length - "-selector".length);
        if (visibleChannels.length === 0 || visibleChannels.includes(channel)) {
            code += "-"
            code += $($(this).children()[1]).val().substring(2, 3);
            if ($($(this).children()[3]).val().trim().length > 0) {
                code += "(" + $($(this).children()[3]).val().trim() + ")";
            }
        }
    });
    
    return code;
};

const generateTable = (visibleChannels) => {
    $("#capture").empty();
    $("#capture").append("<table style='border-spacing: 2px;' id='capture-table'></table>");
    const table = $("#capture-table");

    const colourMap = {
        "level": "#8dd3c7",
        "mark type": "#8dd3c7",
        "touching": "#8dd3c7",
        "overlapping": "#8dd3c7",
        "global layout": "#aaaaaa",
        "local layout": "#aaaaaa",
        "height": "#80b1d3",
        "width": "#80b1d3",
        "horizontal-position-order": "#80b1d3",
        "horizontal-order": "#80b1d3",
        "vertical-position-order": "#80b1d3",
        "vertical-order": "#80b1d3",
        "spread": "#fdb462",
        "span": "#fdb462",
        "radial-position-order": "#fdb462",
        "radial-order": "#fdb462",
        "angular-position-order": "#fdb462",
        "angular-order": "#fdb462",
        "orientation": "#b3de69",
        "shape": "#fccde5",
        "thickness": "#d9d9d9",
        "area": "#bc80bd",
        "colour": "#ffed6f",
        "symbol": "#ffed6f",
    };

    ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]

    const baseStyle = "font-family: 'Times New Roman', Times, serif; font-weight: 400; font-size: 16px; border: 1px solid black; padding: 5px;"
    
    const attemptEncodeConstant = (encodeName, niceEncodeName, value) => {
        if (value === "unselected") {
            throw Error(niceEncodeName + " is unselected");
        } else {
            table.append(`<tr><td style="${baseStyle} background-color: ${colourMap[encodeName]}">${niceEncodeName}</td><td style="${baseStyle} background-color: ${colourMap[encodeName]}">${value}</td></tr>`);
        }
    };

    attemptEncodeConstant("level", "Level", $("#input-level").val());

    const markTypeOption = $("#dropdown-mark-type").val();
    if (markTypeOption === "unselected") {
        throw Error("mark type is unselected");
    } else {
        table.append(`<tr><td style="${baseStyle} background-color: ${colourMap["mark type"]}">Mark Type</td><td style="${baseStyle} background-color: ${colourMap["mark type"]}">${markTypeOption}</td></tr>`);
    }

    if ($("#dropdown-touching").val() === "yes" && $("#dropdown-overlapping").val() === "yes") {
        throw Error("both touching and overlapping are set to 'yes', which is not possible")
    }

    attemptEncodeConstant("touching", "Touching?", $("#dropdown-touching").val());
    attemptEncodeConstant("overlapping", "Overlapping?", $("#dropdown-overlapping").val());
    attemptEncodeConstant("global layout", "Global Layout", $("#dropdown-global-layout").val());

    const attemptEncodeChannel = (channel, niceChannel, value, attribute) => {
        const trimmedNiceChannel = niceChannel.slice(0, 2) === "- " ? niceChannel.slice(2) : niceChannel; 
        if (value === "unselected") {
            throw Error(trimmedNiceChannel + " is unselected");
        } else if (value === "encoding" && attribute.length === 0) {
            throw Error(trimmedNiceChannel + " is encoding an attribute, but the attribute is empty");
        } else {
            table.append(`<tr><td style="${baseStyle} background-color: ${colourMap[channel]}">${niceChannel}</td><td style="${baseStyle} background-color: ${colourMap[channel]}">${value}</td>${value === "encoding" ? `<td style="${baseStyle} background-color: ${colourMap[channel]}">` + attribute + "</td>" : ""}</tr>`);
        }
    };

    const handleChannel = function() {
        const channel = $(this).attr("id").substring(0, $(this).attr("id").length - "-selector".length);
        if (visibleChannels.includes(channel)) {
            attemptEncodeChannel(channel, $($(this).children()[0]).html(), $($(this).children()[1]).val(), $($(this).children()[3]).val().trim());
        }
    };

    $(".channel").slice(0, 8).each(handleChannel);

    if (markTypeOption === "point") {
        attemptEncodeConstant("local layout", "Local Layout", $("#dropdown-local-layout").val());
    }

    $(".channel").slice(8).each(handleChannel);
};

const checkInputs = () => {
    const levelInput = $("#input-level");
    levelInput.val(Math.min(Math.max(Math.round(levelInput.val()), 1), 9));

    const globalLayout = $("#dropdown-global-layout").val();
    const markType = $("#dropdown-mark-type").val();

    let visibleChannels = [];
    if (markType === "poly") {
        visibleChannels = ["shape", "area", "colour"];
    } else if (markType === "path") {
        visibleChannels = ["shape", "thickness", "colour"];
    } else if (markType === "point" && globalLayout === "rectilinear") {
        visibleChannels = ["horizontal-position-order", "vertical-position-order"];
        if ($("#dropdown-horizontal-position-order").val() === "uniform") {
            visibleChannels.push("horizontal-order");
        }
        if ($("#dropdown-vertical-position-order").val() === "uniform") {
            visibleChannels.push("vertical-order");
        }
    } else if (markType === "point" && globalLayout === "polar") {
        visibleChannels = ["radial-position-order", "angular-position-order"];
        if ($("#dropdown-radial-position-order").val() === "uniform") {
            visibleChannels.push("radial-order");
        }
        if ($("#dropdown-angular-position-order").val() === "uniform") {
            visibleChannels.push("angular-order");
        }
    }
    
    const localLayout = $("#dropdown-local-layout").val();
    if (markType === "point" && localLayout === "rectilinear") {
        visibleChannels.push("height", "width", "orientation");
    } else if (markType === "point" && localLayout === "polar") {
        visibleChannels.push("spread", "span", "orientation");
    } else if (markType === "point" && localLayout === "uniform") {
        visibleChannels.push("orientation");
    }

    if (markType === "point") {
        $("#local-layout-selector").css("display", "grid");
        visibleChannels.push("colour", "symbol");
    } else {
        $("#local-layout-selector").css("display", "none");
    }


    $(".channel").each(function() {
        const id = $(this).attr("id");
        if (visibleChannels.includes(id.substring(0, id.length - "-selector".length))) {
            $(this).css("display", "grid");
        } else {
            $(this).css("display", "none");
        }
            
        if ($($(this).children()[1]).val() === "encoding") {
            $($(this).children()[2]).css("display", "inline");
            $($(this).children()[3]).css("display", "inline");
        } else {
            $($(this).children()[2]).css("display", "none");
            $($(this).children()[3]).css("display", "none");
        }
    });

    const code = generateCode([]);
    const url = new URL(window.location.href);
    url.searchParams.set("value", encodeURIComponent(code));
    window.history.pushState("string", "Title", url.href);

    try {
        generateTable(visibleChannels);
    } catch (error) {
        $("#capture").empty();
        $("#capture").append(`<p>${error}</p>`);
    }
};

const clearFields = () => {
    console.log("clearing");
    const code = "1-u-u-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s";
    const url = new URL(window.location.href);
    url.searchParams.set("value", code);
    window.history.pushState("string", "Title", url.href);
    setInputs();
    checkInputs();
};

$("#input-level").on("change", checkInputs);
$(".dropdown").on("change", checkInputs);
$(".attribute-name").on("change", checkInputs);

if ((new URL(window.location.href)).searchParams.has("value")) {
    setInputs();
}

checkInputs();