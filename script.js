const API_URL = "https://dummyjson.com/products";

let products = [];


// ========================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ========================================

function openTab(tabName) {

    let tabs = document.querySelectorAll(".tab-content");

    tabs.forEach(function(tab) {
        tab.classList.remove("active");
    });

    document.getElementById(tabName).classList.add("active");

}


// ========================================
// ЗАГРУЗКА ТОВАРОВ
// ========================================

async function loadProducts() {

    try {

        let response = await fetch(API_URL);

        let data = await response.json();

        products = data.products;

        // Загружаем наши сохранённые товары
        let savedProducts =
            JSON.parse(localStorage.getItem("myProducts")) || [];

        products = [...savedProducts, ...products];

        displayProducts(products);

    } catch (error) {

        console.log("Error:", error);

        document.getElementById("productsContainer").innerHTML =
            "<p>Ошибка загрузки товаров</p>";

    }

}


// ========================================
// ПОКАЗ ТОВАРОВ
// ========================================

function displayProducts(productList) {

    let container =
        document.getElementById("productsContainer");

    container.innerHTML = "";

    if (productList.length === 0) {

        container.innerHTML =
            "<p>Товары не найдены</p>";

        return;

    }


    productList.forEach(function(product) {

        let card = document.createElement("div");

        card.className = "product-card";


        card.innerHTML = `

            <img
                src="${product.thumbnail || product.image}"
                alt="${product.title}"
            >

            <div class="product-info">

                <h3>${product.title}</h3>

                <span class="product-category">
                    ${product.category || "Other"}
                </span>

                <p class="product-description">
                    ${product.description}
                </p>

                <div class="product-price">
                    $${product.price}
                </div>

                <div class="product-rating">
                    ⭐ ${product.rating || 0} / 5
                </div>

                <div class="product-actions">

                    <button
                        class="edit-button"
                        onclick="editProduct(${product.id})"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-button"
                        onclick="deleteProduct(${product.id})"
                    >
                        Delete
                    </button>

                </div>

            </div>

        `;


        container.appendChild(card);

    });

}


// ========================================
// ПОИСК
// ========================================

function searchProducts() {

    let searchText =
        document.getElementById("searchInput").value
        .toLowerCase()
        .trim();


    let filteredProducts = products.filter(function(product) {

        return product.title
            .toLowerCase()
            .includes(searchText);

    });


    displayProducts(filteredProducts);

}


// ========================================
// ДОБАВЛЕНИЕ ТОВАРА
// ========================================

function addProduct() {

    let title =
        document.getElementById("productTitle").value;

    let price =
        Number(document.getElementById("productPrice").value);

    let category =
        document.getElementById("productCategory").value;

    let image =
        document.getElementById("productImage").value;

    let description =
        document.getElementById("productDescription").value;

    let rating =
        Number(document.getElementById("productRating").value);


    if (!title || !price || !description) {

        alert("Заполните название, цену и описание");

        return;

    }


    let newProduct = {

        id: Date.now(),

        title: title,

        price: price,

        category: category || "Other",

        thumbnail:
            image || "https://via.placeholder.com/300",

        description: description,

        rating: rating || 0

    };


    // Добавляем в начало списка

    products.unshift(newProduct);


    // Получаем наши товары

    let savedProducts =
        JSON.parse(localStorage.getItem("myProducts")) || [];


    savedProducts.unshift(newProduct);


    // Сохраняем в браузере

    localStorage.setItem(
        "myProducts",
        JSON.stringify(savedProducts)
    );


    displayProducts(products);


    // Очищаем форму

    document.getElementById("productTitle").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productCategory").value = "";
    document.getElementById("productImage").value = "";
    document.getElementById("productDescription").value = "";
    document.getElementById("productRating").value = "";


    alert("Товар добавлен!");

}


// ========================================
// УДАЛЕНИЕ
// ========================================

function deleteProduct(id) {

    let product =
        products.find(function(item) {
            return item.id === id;
        });


    if (!product) {
        return;
    }


    let confirmDelete =
        confirm("Удалить этот товар?");


    if (!confirmDelete) {
        return;
    }


    products =
        products.filter(function(item) {
            return item.id !== id;
        });


    // Удаляем только из наших сохранённых товаров

    let savedProducts =
        JSON.parse(localStorage.getItem("myProducts")) || [];


    savedProducts =
        savedProducts.filter(function(item) {
            return item.id !== id;
        });


    localStorage.setItem(
        "myProducts",
        JSON.stringify(savedProducts)
    );


    displayProducts(products);

}


// ========================================
// ИЗМЕНЕНИЕ ТОВАРА
// ========================================

function editProduct(id) {

    let product =
        products.find(function(item) {
            return item.id === id;
        });


    if (!product) {
        return;
    }


    let newTitle =
        prompt("Введите новое название:", product.title);


    if (newTitle === null) {
        return;
    }


    let newPrice =
        prompt("Введите новую цену:", product.price);


    if (newPrice === null) {
        return;
    }


    let newDescription =
        prompt(
            "Введите новое описание:",
            product.description
        );


    if (newDescription === null) {
        return;
    }


    product.title = newTitle;

    product.price = Number(newPrice);

    product.description = newDescription;


    // Обновляем сохранённые товары

    let savedProducts =
        JSON.parse(localStorage.getItem("myProducts")) || [];


    let savedProduct =
        savedProducts.find(function(item) {
            return item.id === id;
        });


    if (savedProduct) {

        savedProduct.title = newTitle;

        savedProduct.price = Number(newPrice);

        savedProduct.description = newDescription;

    }


    localStorage.setItem(
        "myProducts",
        JSON.stringify(savedProducts)
    );


    displayProducts(products);

}


// ========================================
// ENTER ДЛЯ ПОИСКА
// ========================================

document
    .getElementById("searchInput")
    .addEventListener("keydown", function(event) {

        if (event.key === "Enter") {

            searchProducts();

        }

    });


// ========================================
// ЗАПУСК
// ========================================

loadProducts();