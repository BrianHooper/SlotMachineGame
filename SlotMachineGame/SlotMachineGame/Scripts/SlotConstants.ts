﻿export const ADMIN_ID = "1B AC B9 03";
export const NUM_SLOTS = 50;
export const SLOT_HEIGHT = 100;

export const WINDOW_HEIGHT = 150;
export const SLOT_UPPER_POSITION = -1 * ((WINDOW_HEIGHT - SLOT_HEIGHT) / 2 + (SLOT_HEIGHT / 2));
export const SLOT_LOWER_POSITION = -1 * ((SLOT_HEIGHT * (NUM_SLOTS - 3)) - ((WINDOW_HEIGHT - SLOT_HEIGHT) / 2));

export async function PostData(endpoint: string, data: any): Promise<number> {
    const result = await $.ajax({
        type: "POST",
        url: `/Home/${endpoint}`,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(data)
    }).then(function (result, textStatus, xhr) {
        return xhr.status;
    });
    return result;
}

export function getRandomIntInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const Colors: string[] = [
    "#8B4513", //saddlebrown
    "#00FFFF", //cyan
    "#808080", //gray
    "#C71585", //mediumvioletred
    "#483D8B", //darkslateblue
    "#2F4F4F", //darkslategray
    "#696969", //dimgray
    "#87CEFA", //lightskyblue
    "#FF6347", //tomato
    "#F0FFFF", //azure
    "#FFFFE0", //lightyellow
    "#00008B", //darkblue
    "#FFB6C1", //lightpink
    "#90EE90", //lightgreen
    "#9400D3", //darkviolet
    "#000080", //navy
    "#808000", //olive
    "#32CD32", //limegreen
    "#FAA460", //sandybrown
    "#191970", //midnightblue
    "#E0FFFF", //lightcyan
    "#98FB98", //palegreen
    "#008000", //green
    "#FFA500", //orange
    "#66CDAA", //mediumaquamarine
    "#FFFFF0", //ivory
    "#228B22", //forestgreen
    "#DCDCDC", //gainsboro
    "#FF1493", //deeppink
    "#FFFAF0", //floralwhite
    "#FF0000", //red
    "#D3D3D3", //lightgrey
    "#FF7F50", //coral
    "#E9967A", //darksalmon
    "#4B0082", //indigo
    "#FA8072", //salmon
    "#CD5C5C", //indianred
    "#708090", //slategray
    "#8A2BE2", //blueviolet
    "#2E8B57", //seagreen
    "#FF4500", //orangered
    "#6495ED", //cornflowerblue
    "#FFDEAD", //navajowhite
    "#40E0D0", //turquoise
    "#FFE4C4", //bisque
    "#A52A2A", //brown
    "#DA70D6", //orchid
    "#FFE4E1", //mistyrose
    "#6B8E23", //olivedrab
    "#E6E6FA", //lavender
    "#FFFFFF", //white
    "#9ACD32", //yellowgreen
    "#F5F5DC", //beige
    "#FFDAB9", //peachpuff
    "#ADD8E6", //lightblue
    "#0000CD", //mediumblue
    "#008080", //teal
    "#FFA07A", //lightsalmon
    "#00BFFF", //deepskyblue
    "#20B2AA", //lightseagreen
    "#FFFAFA", //snow
    "#CD853F", //peru
    "#F0F8FF", //aliceblue
    "#800080", //purple
    "#DC143C", //crimson
    "#3CB371", //mediumseagreen
    "#FDF5E6", //oldlace
    "#B0C4DE", //lightsteelblue
    "#C0C0C0", //silver
    "#DDA0DD", //plum
    "#FF00FF", //magenta
    "#FAEBD7", //antiquewhite
    "#6A5ACD", //slateblue
    "#00FF7F", //springgreen
    "#DAA520", //goldenrod
    "#F08080", //lightcoral
    "#B0E0E6", //powderblue
    "#000000", //black
    "#F5F5F5", //whitesmoke
    "#FF00FF", //fuchsia
    "#4169E1", //royalblue
    "#F0E68C", //khaki
    "#9932CC", //darkorchid
    "#A9A9A9", //darkgray
    "#FFD700", //gold
    "#FAF0E6", //linen
    "#008B8B", //darkcyan
    "#7B68EE", //mediumslateblue
    "#8B0000", //darkred
    "#0000FF", //blue
    "#D8BFD8", //thistle
    "#4682B4", //steelblue
    "#F8F8FF", //ghostwhite
    "#ADFF2F", //greenyellow
    "#F0FFF0", //honeydew
    "#7FFF00", //chartreuse
    "#8B008B", //darkmagenta
    "#7CFC00", //lawngreen
    "#800000", //maroon
    "#FFF5EE", //seashell
    "#87CEEB", //skyblue
    "#FFE4B5", //moccasin
    "#1E90FF", //dodgerblue
    "#DEB887", //burlywood
    "#FFFACD", //lemonchiffon
    "#AFEEEE", //paleturquoise
    "#FFEFD5", //papayawhip
    "#5F9EA0", //cadetblue
    "#00FF00", //lime
    "#B8860B", //darkgoldenrod
    "#B22222", //firebrick
    "#A0522D", //sienna
    "#FFFF00", //yellow
    "#FF8C00", //darkorange
    "#FFF8DC", //cornsilk
    "#00FA9A", //mediumspringgreen
    "#00FFFF", //aqua
    "#F5DEB3", //wheat
    "#EEE8AA", //palegoldenrod
    "#D2B48C", //tan
    "#BA55D3", //mediumorchid
    "#BC8F8F", //rosybrown
    "#00CED1", //darkturquoise
    "#D2691E", //chocolate
    "#FAFAD2", //lightgoldenrodyellow
    "#F5FFFA", //mintcream
    "#FFC0CB", //pink
    "#9370DB", //mediumpurple
    "#778899", //lightslategray
    "#BDB76B", //darkkhaki
    "#48D1CC", //mediumturquoise
    "#DB7093", //palevioletred
    "#556B2F", //darkolivegreen
    "#006400", //darkgreen
    "#8FBC8F", //darkseagreen
    "#FFF0F5", //lavenderblush
    "#7FFFD4", //aquamarine
    "#FF69B4", //hotpink
    "#FFEBCD", //blanchedalmond
    "#EE82EE", //violet
];