function Init(element) {
	const box = document.getElementById(element);
	for (var i = 0; i < 50; i++) {
		const innerBox = document.createElement("div");
		innerBox.classList.add("innerBox");
		innerBox.innerText = i;
		box.appendChild(innerBox);
	}
}

function Run(element, delay) {
	new Promise(resolve => setTimeout(resolve, delay)).then(() => {
		const box = document.getElementById(element);
		box.classList.remove("position");
		box.classList.remove("endPosition");
		box.classList.add("animateRoll");
	});
	new Promise(resolve => setTimeout(resolve, delay + 5000)).then(() => {
		const box = document.getElementById(element);
		box.classList.remove("animateRoll");
		box.classList.add("endPosition");
	});
}

function Start() {
	Run("tallBox1", 1000);
	Run("tallBox2", 2000);
	Run("tallBox3", 3000);
}

Init("tallBox1");
Init("tallBox2");
Init("tallBox3");