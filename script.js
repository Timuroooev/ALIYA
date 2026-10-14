const TASKS_API = "https://dummyjson.com/todos?limit=30";
const USERS_API = "https://dummyjson.com/users/";

const tasksContainer = document.getElementById("tasksContainer");
const taskStatus = document.getElementById("taskStatus");
const taskSearch = document.getElementById("taskSearch");

const taskModal = document.getElementById("taskModal");
const userModal = document.getElementById("userModal");

const savedStorageKey = "ourTeamSavedTasks";

let allTasks = [];
let currentTasks = [];
let selectedTask = null;
let showingSavedTasks = false;

function openTab(tabId, button) {
    document.querySelectorAll(".tab-content").forEach(function (tab) {
        tab.classList.remove("active");
    });

    document.querySelectorAll(".tab-button").forEach(function (tabButton) {
        tabButton.classList.remove("active");
    });

    const selectedTab = document.getElementById(tabId);

    if (selectedTab) {
        selectedTab.classList.add("active");
    }

    if (button) {
        button.classList.add("active");
    }

    if (tabId === "tasks" && allTasks.length === 0) {
        loadTasks();
    }
}

function getSavedTaskIds() {
    try {
        const saved = JSON.parse(localStorage.getItem(savedStorageKey) || "[]");

        if (!Array.isArray(saved)) {
            return [];
        }

        return saved.map(Number).filter(Number.isFinite);
    } catch (error) {
        console.error("Could not read saved tasks:", error);
        return [];
    }
}

function isTaskSaved(taskId) {
    return getSavedTaskIds().includes(Number(taskId));
}

function saveTask(taskId) {
    const savedIds = getSavedTaskIds();
    const numericId = Number(taskId);

    if (!savedIds.includes(numericId)) {
        savedIds.push(numericId);
    }

    localStorage.setItem(savedStorageKey, JSON.stringify(savedIds));

    renderTasks(currentTasks);

    document.getElementById("taskActionStatus").textContent =
        "Task saved successfully!";
}

function removeSavedTask(taskId) {
    const savedIds = getSavedTaskIds().filter(function (id) {
        return id !== Number(taskId);
    });

    localStorage.setItem(savedStorageKey, JSON.stringify(savedIds));

    renderTasks(currentTasks);
    showTaskDetails(selectedTask);
}

async function loadTasks() {
    taskStatus.textContent = "Loading tasks...";
    tasksContainer.innerHTML = "";

    try {
        const response = await fetch(TASKS_API);

        if (!response.ok) {
            throw new Error("Failed to load tasks. HTTP " + response.status);
        }

        const data = await response.json();

        allTasks = Array.isArray(data.todos) ? data.todos : [];
        currentTasks = allTasks;
        showingSavedTasks = false;

        renderTasks(currentTasks);

        taskStatus.textContent = allTasks.length
            ? "Loaded " + allTasks.length + " tasks."
            : "No tasks found.";
    } catch (error) {
        console.error("Error loading tasks:", error);

        taskStatus.textContent =
            "Could not load tasks. Check your internet connection and try again.";

        tasksContainer.innerHTML =
            '<button id="retryTasksButton">Try again</button>';

        document.getElementById("retryTasksButton").addEventListener(
            "click",
            loadTasks
        );
    }
}

function renderTasks(tasks) {
    tasksContainer.innerHTML = "";

    if (!tasks.length) {
        tasksContainer.innerHTML = "<p>No tasks to display.</p>";
        return;
    }

    tasks.forEach(function (task) {
        const card = document.createElement("article");
        card.className = "task-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", "Open task " + task.id);

        const title = document.createElement("h3");
        title.textContent = task.todo;

        const taskId = document.createElement("p");
        taskId.textContent = "Task ID: " + task.id;

        const userId = document.createElement("p");
        userId.textContent = "User ID: " + task.userId;

        const completed = document.createElement("p");
        completed.textContent = task.completed ? "Completed" : "Not completed";

        card.append(title, taskId, userId, completed);

        if (isTaskSaved(task.id)) {
            const savedLabel = document.createElement("p");
            savedLabel.className = "saved-label";
            savedLabel.textContent = "★ Saved";
            card.appendChild(savedLabel);
        }

        card.addEventListener("click", function () {
            showTaskDetails(task);
        });

        card.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                showTaskDetails(task);
            }
        });

        tasksContainer.appendChild(card);
    });
}

function showTaskDetails(task) {
    selectedTask = task;

    document.getElementById("detailTaskId").textContent = task.id;
    document.getElementById("detailUserId").textContent = task.userId;
    document.getElementById("detailTaskTitle").textContent = task.todo;

    document.getElementById("detailTaskCompleted").textContent =
        task.completed ? "Yes" : "No";

    const saveButton = document.getElementById("saveTaskButton");

    saveButton.textContent = isTaskSaved(task.id)
        ? "Remove from saved"
        : "Save";

    document.getElementById("taskActionStatus").textContent = "";

    taskModal.classList.add("open");
    taskModal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
}

async function openUser(userId) {
    closeModal(taskModal);

    userModal.classList.add("open");
    userModal.setAttribute("aria-hidden", "false");

    const userStatus = document.getElementById("userStatus");
    const userDetails = document.getElementById("userDetails");

    userStatus.textContent = "Loading user information...";
    userDetails.innerHTML = "";

    try {
        const response = await fetch(USERS_API + encodeURIComponent(userId));

        if (!response.ok) {
            throw new Error("Failed to load user. HTTP " + response.status);
        }

        const user = await response.json();

        userStatus.textContent = "";

        if (user.image) {
            const image = document.createElement("img");
            image.className = "user-photo";
            image.src = user.image;
            image.alt = "User photo";
            userDetails.appendChild(image);
        }

        const fullName = [user.firstName, user.lastName]
            .filter(Boolean)
            .join(" ");

        addUserInfo("User ID", user.id);
        addUserInfo("Full name", fullName);
        addUserInfo("Age", user.age);
        addUserInfo("Gender", user.gender);
        addUserInfo("Email", user.email);
        addUserInfo("Phone", user.phone);
        addUserInfo("Username", user.username);
        addUserInfo("Birth date", user.birthDate);
        addUserInfo("Address", formatAddress(user.address));
        addUserInfo("Company", user.company ? user.company.name : "");
        addUserInfo(
            "Department",
            user.company ? user.company.department : ""
        );
        addUserInfo("Job title", user.company ? user.company.title : "");
    } catch (error) {
        console.error("Error loading user:", error);

        userStatus.textContent =
            "Could not load user information. Check your internet connection and try again.";
    }
}

function addUserInfo(label, value) {
    if (value === undefined || value === null || value === "") {
        return;
    }

    const row = document.createElement("div");
    row.className = "user-info";

    const labelElement = document.createElement("strong");
    labelElement.textContent = label + ":";

    const valueElement = document.createElement("span");
    valueElement.textContent = String(value);

    row.append(labelElement, valueElement);

    document.getElementById("userDetails").appendChild(row);
}

function formatAddress(address) {
    if (!address) {
        return "";
    }

    return [
        address.address,
        address.city,
        address.state,
        address.postalCode,
        address.country
    ].filter(Boolean).join(", ");
}

function searchTasks() {
    const query = taskSearch.value.trim().toLowerCase();

    showingSavedTasks = false;

    const filteredTasks = allTasks.filter(function (task) {
        return task.todo.toLowerCase().includes(query);
    });

    currentTasks = filteredTasks;
    renderTasks(currentTasks);

    taskStatus.textContent = filteredTasks.length
        ? "Found " + filteredTasks.length + " tasks."
        : "No matching tasks found.";
}

function showAllTasks() {
    showingSavedTasks = false;
    taskSearch.value = "";
    currentTasks = allTasks;

    renderTasks(currentTasks);

    taskStatus.textContent = "Showing all " + allTasks.length + " tasks.";
}

function showSavedTasks() {
    showingSavedTasks = true;
    taskSearch.value = "";

    const savedIds = getSavedTaskIds();

    currentTasks = allTasks.filter(function (task) {
        return savedIds.includes(Number(task.id));
    });

    renderTasks(currentTasks);

    taskStatus.textContent = currentTasks.length
        ? "Saved tasks: " + currentTasks.length
        : "You have no saved tasks yet.";
}

document.getElementById("searchButton").addEventListener(
    "click",
    searchTasks
);

taskSearch.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        searchTasks();
    }
});

document.getElementById("showAllButton").addEventListener(
    "click",
    showAllTasks
);

document.getElementById("savedButton").addEventListener(
    "click",
    showSavedTasks
);

document.getElementById("saveTaskButton").addEventListener(
    "click",
    function () {
        if (!selectedTask) {
            return;
        }

        if (isTaskSaved(selectedTask.id)) {
            removeSavedTask(selectedTask.id);
        } else {
            saveTask(selectedTask.id);
        }
    }
);

document.getElementById("openUserButton").addEventListener(
    "click",
    function () {
        if (selectedTask) {
            openUser(selectedTask.userId);
        }
    }
);

document.getElementById("closeTaskModal").addEventListener(
    "click",
    function () {
        closeModal(taskModal);
    }
);

document.getElementById("closeUserModal").addEventListener(
    "click",
    function () {
        closeModal(userModal);
    }
);

taskModal.addEventListener("click", function (event) {
    if (event.target === taskModal) {
        closeModal(taskModal);
    }
});

userModal.addEventListener("click", function (event) {
    if (event.target === userModal) {
        closeModal(userModal);
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeModal(taskModal);
        closeModal(userModal);
    }
});

loadTasks();