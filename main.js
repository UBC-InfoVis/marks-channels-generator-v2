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
    const globalLayoutMap = { "u": "unselected", "r": "rectilinear", "p": "polar", "o": "other" };
    const markTypeMap = { "s": "unselected", "i": "point", "t": "path", "l": "poly" };
    const channelMap = { "s": "unselected", "c": "encoding", "i": "uniform" };

    $("#input-level").val(values[0]);
    $("#dropdown-touching").val(binaryMap[values[1]]);
    $("#dropdown-overlapping").val(binaryMap[values[2]]);
    $("#dropdown-global-layout").val(globalLayoutMap[values[3]]);
    $("#dropdown-mark-type").val(markTypeMap[values[4].substring(0, 1)]);
    $("#mark-name").val(values[4].substring(2, values[4].length - 1));
    $(".channel").each(function(index) {
        $($(this).children()[1]).val(channelMap[values[5 + index].substring(0, 1)]);
        if (values[5 + index].length > 1) {
            $($(this).children()[2]).val(values[5 + index].substring(2, values[5 + index].length - 1));
        } else {
            $($(this).children()[2]).val("");    
        }
    });
};

const generateCode = (visibleChannels) => {
    let code = "";

    code += $("#input-level").val() + "-";
    code += $("#dropdown-touching").val().substring(0, 1) + "-";
    code += $("#dropdown-overlapping").val().substring(0, 1) + "-";
    code += $("#dropdown-global-layout").val().substring(0, 1) + "-";
    code += $("#dropdown-mark-type").val().substring(2, 3);
    code += "(" + $("#mark-name").val().trim() + ")";
    $(".channel").each(function() {
        const channel = $(this).attr("id").substring(0, $(this).attr("id").length - "-selector".length);
        if (visibleChannels.length === 0 || visibleChannels.includes(channel)) {
            code += "-"
            code += $($(this).children()[1]).val().substring(2, 3);
            if ($($(this).children()[2]).val().trim().length > 0) {
                code += "(" + $($(this).children()[2]).val().trim() + ")";
            }
        }
    });
    
    return code;
};

const generateTable = (visibleChannels) => {
    $("#capture").empty();
    $("#capture").append("<table id='capture-table'></table>");
    const table = $("#capture-table");

    const colourMap = {
        "level": "#8dd3c7",
        "touching": "#ffffb3",
        "overlapping": "#ffffb3",
        "global layout": "#bebada",
        "mark type": "#ccebc5",
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
        "colour": "#ffed6f"
    };

    ["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]
    
    const attemptEncodeConstant = (encodeName, value) => {
        if (value === "unselected") {
            throw Error(encodeName + " is unselected");
        } else {
            table.append(`<tr style="background-color: ${colourMap[encodeName]}"><td>${encodeName}</td><td>${value}</td></tr>`);
        }
    };

    attemptEncodeConstant("level", $("#input-level").val());
    attemptEncodeConstant("touching", $("#dropdown-touching").val());
    attemptEncodeConstant("overlapping", $("#dropdown-overlapping").val());
    attemptEncodeConstant("global layout", $("#dropdown-global-layout").val());

    const markTypeOption = $("#dropdown-mark-type").val();
    const markDescription = $("#mark-name").val().trim();
    if (markTypeOption === "unselected") {
        throw Error("mark type is unselected");
    } else if (markDescription.length === 0) {
        throw Error("mark description is empty");
    } else {
        table.append(`<tr style="background-color: ${colourMap["mark type"]}"><td>mark type</td><td>${markTypeOption}</td><td>${markDescription}</td></tr>`);
    }

    const attemptEncodeChannel = (channel, value, attribute) => {
        if (value === "unselected") {
            throw Error(channel + " is unselected");
        } else if (value === "encoding" && attribute.length === 0) {
            throw Error(channel + " is encoding an attribute, but the attribute is empty");
        } else {
            table.append(`<tr style="background-color: ${colourMap[channel]}"><td>${channel}</td><td>${value}</td>${value === "encoding" ? "<td>" + attribute + "</td>" : ""}</tr>`);
        }
    };

    $(".channel").each(function() {
        const channel = $(this).attr("id").substring(0, $(this).attr("id").length - "-selector".length);
        if (visibleChannels.includes(channel)) {
            attemptEncodeChannel(channel, $($(this).children()[1]).val(), $($(this).children()[2]).val().trim());
        }
    });
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
        visibleChannels = ["height", "width", "horizontal-position-order", "vertical-position-order", "orientation", "colour"];
        if ($("#dropdown-horizontal-position-order").val() === "uniform") {
            visibleChannels.push("horizontal-order");
        }
        if ($("#dropdown-vertical-position-order").val() === "uniform") {
            visibleChannels.push("vertical-order");
        }
    } else if (markType === "point" && globalLayout === "polar") {
        visibleChannels = ["spread", "span", "radial-position-order", "angular-position-order", "orientation", "colour"];
        if ($("#dropdown-radial-position-order").val() === "uniform") {
            visibleChannels.push("radial-order");
        }
        if ($("#dropdown-angular-position-order").val() === "uniform") {
            visibleChannels.push("angular-order");
        }
    } else if (markType === "point" && globalLayout === "other") {
        visibleChannels = ["orientation", "colour"];
    }

    $(".channel").each(function() {
        const id = $(this).attr("id");
        if (visibleChannels.includes(id.substring(0, id.length - "-selector".length))) {
            $(this).css("display", "block");
        } else {
            $(this).css("display", "none");
        }
            
        if ($($(this).children()[1]).val() === "encoding") {
            $($(this).children()[2]).css("display", "inline");
        } else {
            $($(this).children()[2]).css("display", "none");
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
    const code = "1-u-u-u-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s";
    const url = new URL(window.location.href);
    url.searchParams.set("value", code);
    window.history.pushState("string", "Title", url.href);
    setInputs();
    checkInputs();
};

$("#input-level").on("change", checkInputs);
$(".dropdown").on("change", checkInputs);
$("#mark-name").on("change", checkInputs);
$(".attribute-name").on("change", checkInputs);

if ((new URL(window.location.href)).searchParams.has("value")) {
    setInputs();
}

checkInputs();