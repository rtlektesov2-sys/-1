const container = document.getElementById("cards");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("error");
const emptyBox = document.getElementById("empty");
const retryButton = document.getElementById("retry");
const recipeForm = document.getElementById("recipe-form");
const formMessage = document.getElementById("form-message");

function showState(state) {
    loader.hidden = state !== "loading";
    errorBox.hidden = state !== "error";
    emptyBox.hidden = state !== "empty";
    container.hidden = state !== "data";
}

function createCard(recipe) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
        <h3 class="card__title">${recipe.title}</h3>
        <p class="card__original">${recipe.cuisine} кухня</p>
        <p class="card__meta">${recipe.category}</p>
        <p class="card__time">Время: ${recipe.time} мин</p>
        <p class="card__difficulty">Сложность: ${recipe.difficulty}</p>
        <span class="badge ${recipe.vegetarian ? "badge--vegetarian" : "badge--regular"}">
            ${recipe.vegetarian ? "Вегетарианское" : "С мясом"}
        </span>
    `;
    return card;
}

function render(recipes) {
    container.innerHTML = "";
    recipes.forEach(function (recipe) {
        container.appendChild(createCard(recipe));
    });
}

async function load() {
    showState("loading");
    try {
        const response = await fetch("/items");
        if (!response.ok) {
            throw new Error("Сервер ответил: " + response.status);
        }

        const data = await response.json();
        if (data.length === 0) {
            showState("empty");
            return;
        }

        render(data);
        showState("data");

    } catch (error) {
        showState("error");
        console.error(error);
    }
}

function showFormMessage(message, isError) {
    formMessage.hidden = false;
    formMessage.textContent = message;
    formMessage.className = isError ? "form-message form-message--error" : "form-message";
}

recipeForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const formData = new FormData(recipeForm);
    const newRecipe = {
        title: formData.get("title"),
        category: formData.get("category"),
        cuisine: formData.get("cuisine"),
        time: Number(formData.get("time")),
        difficulty: formData.get("difficulty"),
        vegetarian: formData.get("vegetarian") === "on"
    };

    try {
        const response = await fetch("/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newRecipe)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || "Не удалось сохранить рецепт");
        }
        recipeForm.reset();
        showFormMessage("Рецепт сохранён", false);
        load();
    } catch (error) {
        showFormMessage(error.message, true);
    }
});

retryButton.addEventListener("click", load);
load();
