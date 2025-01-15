import { PostData } from "./SlotConstants.js";

function ToggleVisibility() {
    const name = $("#NameText").text().trim();
    if (name.length === 0) {
        $("#backspaceButton").addClass("inactive");
        $("#submitButton").addClass("inactive");
    } else {
        $("#backspaceButton").removeClass("inactive");
        $("#submitButton").removeClass("inactive");
    }
}

$("#submitButton").on("click", async function (e) {
    const name = $("#NameText").text().trim();
    if ($("#submitButton").hasClass("inactive") || name.length === 0) {
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get("id");
    if (playerId === null || playerId === undefined || playerId.length === 0) {
        alert("ERROR, ID PARAMETER");
        return;
    }
    const result = await PostData("SetPlayerName", { "id": playerId, "name": name });
    if (result === 200) {
        await PostData("SetPlayer", { "player": playerId });
    }
    location.href = "/Home/Index";
});

$("#backspaceButton").on("click", function (e) {
    const name = $("#NameText").text().trim();
    if ($("#backspaceButton").hasClass("inactive") || name.length === 0) {
        return;
    }
    $("#NameText").text(name.substring(0, name.length - 1));
    ToggleVisibility();
});

$("#spaceButton").on("click", function (e) {
    const name = $("#NameText").text().trim() + " ";
    $("#NameText").text(name);
    ToggleVisibility();
});

$(".standardButton").each(function () {
    const letter = $(this).text().trim();
    $(this).on("click", function (e) {
        const name = $("#NameText").text() + letter;
        $("#NameText").text(name);
        ToggleVisibility();
    });
});