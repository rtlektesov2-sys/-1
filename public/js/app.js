const courseForm = document.getElementById("course-form");
if (courseForm) {
    const courseFormMessage = document.getElementById("course-form-message");

    courseForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    const formData = new FormData(courseForm);
    const newCourse = {
        title: formData.get("title").trim(),
        instructor: formData.get("instructor").trim(),
        category: formData.get("category"),
        level: formData.get("level"),
        durationHours: Number(formData.get("durationHours")),
        price: Number(formData.get("price")),
        description: formData.get("description").trim(),
        image: "/img/web-development.jpg"
    };

    try {
        const response = await fetch("/api/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newCourse)
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.problems?.join(". ") || result.error || "Не удалось добавить курс");

        window.location.assign("/");
    } catch (error) {
        courseFormMessage.hidden = false;
        courseFormMessage.textContent = error.message;
        courseFormMessage.className = "form-message form-message--error";
    }
    });
}
