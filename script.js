const API_URL = "https://dummyjson.com/products";

let products = [];
let editingProductId = null;

// Сохранённые локальные данные
let customProducts = JSON.parse(localStorage.getItem("myProducts")) || [];
let updatedProducts = JSON.parse(localStorage.getItem("updatedProducts")) || {};
let deletedProductIds = JSON.parse(localStorage.getItem("deletedProductIds")) || [];


// ========================================
// ВКЛАДКИ
// ========================================

function openTab(tabName) {
    document.querySelectorAll(".tab-content").forEach(function(tab) {
        tab.classList.remove("active");
    });

    document.getElementById(tabName).classList.add("active");
}


// ========================================
// СОХРАНЕНИЕ
// ========================================

function saveLocalData() {
    localStorage.setItem("myProducts", JSON.stringify(customProducts));
    localStorage.setItem("updatedProducts", JSON.stringify(updatedProducts));
    localStorage.setItem("deletedProductIds", JSON.stringify(deletedProductIds));
}


// ========================================
// ЗАГРУЗКА ТОВАРОВ
// ========================================

async function loadProducts() {
    const container = document.getElementById("productsContainer");
    container.innerHTML = "<p>Loading products...</p>";

    try {
        const response = await fetch(API_URL + "?limit=100");

        if (!response.ok) {
            throw new Error("Failed to load products");
        }

        const data = await response.json();

        const apiProducts = data.products
            .filter(function(product) {
                return !deletedProductIds.includes(product.id);
            })
            .map(function(product) {
                return updatedProducts[product.id]
                    ? { ...product, ...updatedProducts[product.id] }
                    : product;
            });

        products = [...customProducts, ...apiProducts];

        populateCategories();
        renderProducts();

    } catch (error) {
        console.error(error);

        // Показываем сохранённые товары, даже если API недоступен
        products = [...customProducts];

        if (products.length > 0) {
            populateCategories();
            renderProducts();
        } else {
            container.innerHTML =
                "<p>Could not load products. Check your internet connection and try again.</p>";
        }
    }
}


// ========================================
// КАТЕГОРИИ
// ========================================

function populateCategories() {
    const categoryFilter = document.getElementById("categoryFilter");
    const categoryOptions = document.getElementById("categoryOptions");

    const selectedCategory = categoryFilter.value;

    const categories = [...new Set(
        products.map(function(product) {
            return product.category || "Other";
        })
    )].sort();

    categoryFilter.innerHTML = '<option value="">All categories</option>';
    categoryOptions.innerHTML = "";

    categories.forEach(function(category) {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);

        const dataOption = document.createElement("option");
        dataOption.value = category;
        categoryOptions.appendChild(dataOption);
    });

    categoryFilter.value = categories.includes(selectedCategory)
        ? selectedCategory
        : "";
}


// ========================================
// ПОИСК, ФИЛЬТР И СОРТИРОВКА
// ========================================

function renderProducts() {
    const searchText = document.getElementById("searchInput").value
        .toLowerCase()
        .trim();

    const category = document.getElementById("categoryFilter").value;
    const sortValue = document.getElementById("sortSelect").value;

    let filteredProducts = products.filter(function(product) {
        const matchesSearch =
            product.title.toLowerCase().includes(searchText) ||
            (product.description || "").toLowerCase().includes(searchText) ||
            (product.tags || []).some(function(tag) {
                return tag.toLowerCase().includes(searchText);
            });

        const matchesCategory = !category || product.category === category;

        return matchesSearch && matchesCategory;
    });

    if (sortValue === "title-asc") {
        filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortValue === "title-desc") {
        filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortValue === "price-asc") {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortValue === "price-desc") {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortValue === "rating-desc") {
        filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    displayProducts(filteredProducts);
}


// ========================================
// КАРТОЧКИ ТОВАРОВ
// ========================================

function displayProducts(productList) {
    const container = document.getElementById("productsContainer");
    container.innerHTML = "";

    if (productList.length === 0) {
        container.innerHTML = "<p>No products found.</p>";
        return;
    }

    productList.forEach(function(product) {
        const card = document.createElement("article");
        card.className = "product-card";

        const imageButton = document.createElement("button");
        imageButton.className = "product-image-button";
        imageButton.type = "button";
        imageButton.setAttribute("aria-label", "View " + product.title);

        const image = document.createElement("img");
        image.src = product.thumbnail || product.images?.[0] || product.image || "";
        image.alt = product.title;
        image.loading = "lazy";

        image.onerror = function() {
            image.style.display = "none";
        };

        imageButton.appendChild(image);
        imageButton.addEventListener("click", function() {
            showProductDetails(product.id);
        });

        const info = document.createElement("div");
        info.className = "product-info";

        const title = document.createElement("h3");
        title.textContent = product.title;
        title.addEventListener("click", function() {
            showProductDetails(product.id);
        });

        const category = document.createElement("span");
        category.className = "product-category";
        category.textContent = product.category || "Other";

        const description = document.createElement("p");
        description.className = "product-description";
        description.textContent = product.description || "No description";

        const price = document.createElement("div");
        price.className = "product-price";
        price.textContent = "$" + Number(product.price).toFixed(2);

        const rating = document.createElement("div");
        rating.className = "product-rating";
        rating.textContent = "⭐ " + (product.rating || 0) + " / 5";

        const tags = document.createElement("div");
        (product.tags || []).forEach(function(tagText) {
            const tag = document.createElement("span");
            tag.className = "product-tag";
            tag.textContent = tagText;
            tags.appendChild(tag);
        });

        const actions = document.createElement("div");
        actions.className = "product-actions";

        const editButton = document.createElement("button");
        editButton.className = "edit-button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", function() {
            openEditModal(product.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", function() {
            deleteProduct(product.id);
        });

        actions.append(editButton, deleteButton);
        info.append(title, category, description, price, rating, tags, actions);
        card.append(imageButton, info);
        container.appendChild(card);
    });
}


// ========================================
// МОДАЛЬНОЕ ОКНО: ДОБАВЛЕНИЕ
// ========================================

function openAddModal() {
    editingProductId = null;

    document.getElementById("productForm").reset();
    document.getElementById("modalTitle").textContent = "Add Product";
    document.getElementById("productModal").classList.add("show");
}

function closeProductModal() {
    document.getElementById("productModal").classList.remove("show");
    editingProductId = null;
}


// ========================================
// МОДАЛЬНОЕ ОКНО: РЕДАКТИРОВАНИЕ
// ========================================

function openEditModal(id) {
    const product = products.find(function(item) {
        return item.id === id;
    });

    if (!product) return;

    editingProductId = id;

    document.getElementById("modalTitle").textContent = "Edit Product";
    document.getElementById("productTitle").value = product.title;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productCategory").value = product.category || "";
    document.getElementById("productTags").value = (product.tags || []).join(", ");
    document.getElementById("productImage").value =
        product.thumbnail || product.images?.[0] || product.image || "";
    document.getElementById("productDescription").value = product.description || "";
    document.getElementById("productRating").value = product.rating || 0;

    document.getElementById("productModal").classList.add("show");
}


// ========================================
// СОХРАНЕНИЕ ФОРМЫ
// ========================================

document.getElementById("productForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const title = document.getElementById("productTitle").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const category = document.getElementById("productCategory").value.trim() || "Other";
    const tags = document.getElementById("productTags").value
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean);
    const image = document.getElementById("productImage").value.trim();
    const description = document.getElementById("productDescription").value.trim();
    const rating = Number(document.getElementById("productRating").value) || 0;

    if (!title || !description || !Number.isFinite(price) || price <= 0) {
        alert("Enter a product name, a valid price, and a description.");
        return;
    }

    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
        alert("Rating must be between 0 and 5.");
        return;
    }

    const productData = {
        title,
        price,
        category,
        tags,
        thumbnail: image,
        description,
        rating
    };

    if (editingProductId === null) {
        const newProduct = {
            id: Date.now(),
            ...productData,
            reviews: []
        };

        customProducts.unshift(newProduct);
        products.unshift(newProduct);

    } else {
        const existingProduct = products.find(function(item) {
            return item.id === editingProductId;
        });

        if (!existingProduct) return;

        const updatedProduct = {
            ...existingProduct,
            ...productData
        };

        products = products.map(function(item) {
            return item.id === editingProductId ? updatedProduct : item;
        });

        const customIndex = customProducts.findIndex(function(item) {
            return item.id === editingProductId;
        });

        if (customIndex !== -1) {
            customProducts[customIndex] = updatedProduct;
        } else {
            updatedProducts[editingProductId] = {
                ...updatedProducts[editingProductId],
                ...productData
            };
        }
    }

    saveLocalData();
    populateCategories();
    renderProducts();
    closeProductModal();
});


// ========================================
// УДАЛЕНИЕ ТОВАРА
// ========================================

function deleteProduct(id) {
    const confirmed = confirm("Are you sure you want to delete this product?");

    if (!confirmed) return;

    products = products.filter(function(product) {
        return product.id !== id;
    });

    customProducts = customProducts.filter(function(product) {
        return product.id !== id;
    });

    if (!deletedProductIds.includes(id)) {
        deletedProductIds.push(id);
    }

    delete updatedProducts[id];

    saveLocalData();
    populateCategories();
    renderProducts();
}


// ========================================
// ПОДРОБНОСТИ ТОВАРА И ОТЗЫВЫ
// ========================================

async function showProductDetails(id) {
    const product = products.find(function(item) {
        return item.id === id;
    });

    if (!product) return;

    const details = document.getElementById("productDetails");
    const modal = document.getElementById("detailsModal");

    modal.classList.add("show");
    details.innerHTML = "<p>Loading product details and reviews...</p>";

    let fullProduct = product;

    // Для товара из API пытаемся получить его полные данные, включая отзывы
    if (id < 1000000000000 && !customProducts.some(item => item.id === id)) {
        try {
            const response = await fetch(API_URL + "/" + id);

            if (response.ok) {
                const apiProduct = await response.json();
                fullProduct = updatedProducts[id]
                    ? { ...apiProduct, ...updatedProducts[id] }
                    : apiProduct;
            }
        } catch (error) {
            console.error("Could not load product reviews:", error);
        }
    }

    details.innerHTML = "";

    const title = document.createElement("h2");
    title.textContent = fullProduct.title;

    const image = document.createElement("img");
    image.className = "details-image";
    image.src = fullProduct.thumbnail || fullProduct.images?.[0] || fullProduct.image || "";
    image.alt = fullProduct.title;

    const description = document.createElement("p");
    description.textContent = fullProduct.description || "No description";

    const price = document.createElement("h3");
    price.textContent = "Price: $" + Number(fullProduct.price).toFixed(2);

    const category = document.createElement("p");
    category.textContent = "Category: " + (fullProduct.category || "Other");

    const rating = document.createElement("p");
    rating.textContent = "Rating: ⭐ " + (fullProduct.rating || 0) + " / 5";

    const tags = document.createElement("div");
    tags.className = "details-tags";

    (fullProduct.tags || []).forEach(function(tagText) {
        const tag = document.createElement("span");
        tag.className = "product-tag";
        tag.textContent = tagText;
        tags.appendChild(tag);
    });

    const reviewsHeading = document.createElement("h3");
    reviewsHeading.textContent = "Customer reviews";

    const reviewsList = document.createElement("div");
    reviewsList.className = "reviews-list";

    const reviews = fullProduct.reviews || [];

    if (reviews.length === 0) {
        const noReviews = document.createElement("p");
        noReviews.textContent = "No reviews available for this product.";
        reviewsList.appendChild(noReviews);
    } else {
        reviews.forEach(function(review) {
            const reviewCard = document.createElement("article");
            reviewCard.className = "review-card";

            const author = document.createElement("strong");
            author.textContent = review.reviewerName || "Customer";

            const reviewRating = document.createElement("p");
            reviewRating.textContent = "⭐ " + review.rating + " / 5";

            const reviewText = document.createElement("p");
            reviewText.textContent = review.comment || "";

            const date = document.createElement("p");
            date.className = "review-date";
            date.textContent = review.date
                ? new Date(review.date).toLocaleDateString()
                : "";

            reviewCard.append(author, reviewRating, reviewText, date);
            reviewsList.appendChild(reviewCard);
        });
    }

    details.append(
        title,
        image,
        description,
        price,
        category,
        rating,
        tags,
        reviewsHeading,
        reviewsList
    );
}

function closeDetailsModal() {
    document.getElementById("detailsModal").classList.remove("show");
}


// ========================================
// ЗАКРЫТИЕ ПО КЛИКУ И ESC
// ========================================

document.getElementById("productModal").addEventListener("click", function(event) {
    if (event.target === this) closeProductModal();
});

document.getElementById("detailsModal").addEventListener("click", function(event) {
    if (event.target === this) closeDetailsModal();
});

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closeProductModal();
        closeDetailsModal();
    }
});


// ========================================
// ПОИСК, ФИЛЬТР И СОРТИРОВКА
// ========================================

document.getElementById("searchInput").addEventListener("input", renderProducts);
document.getElementById("categoryFilter").addEventListener("change", renderProducts);
document.getElementById("sortSelect").addEventListener("change", renderProducts);


// ========================================
// ЗАПУСК
// ========================================

loadProducts();