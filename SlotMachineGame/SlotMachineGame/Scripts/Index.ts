function AddBoxes(module: JQuery<HTMLElement>) {
    for (var i = 0; i < 50; i++) {
        jQuery("<div/>", { "class": "innerBox" })
            .html(i.toString())
            .appendTo(module);
    }
}

function Run(element: JQuery<HTMLElement>, delay: number) {
	new Promise(resolve => setTimeout(resolve, delay)).then(() => {
		element.removeClass("position");
		element.removeClass("endPosition");
		element.addClass("animateRoll");
	});
	new Promise(resolve => setTimeout(resolve, delay + 5000)).then(() => {
		element.removeClass("animateRoll");
		element.addClass("endPosition");
	});
}

AddBoxes($("#tallBox1"));
AddBoxes($("#tallBox2"));
AddBoxes($("#tallBox3"));

$("#startButton").on("click", function (e) {
	Run($("#tallBox1"), 1000);
	Run($("#tallBox2"), 2000);
	Run($("#tallBox3"), 3000);
});