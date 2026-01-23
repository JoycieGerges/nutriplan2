/**
 * NutriPlan - Main Entry Point
 * 
 * This is the main entry point for the application.
 * Import your modules and initialize the app here.
 */

import MealsService from "./api/mealdb.js";
import { appState } from "./state/appState.js";
import { renderMeals } from "./ui/components.js";

/* =========================================
   NAVIGATION SYSTEM
========================================= */
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("section");

function activateLink(link) {
  const targetId = link.dataset.target;
  const targetSection = document.getElementById(targetId);
  if (!targetSection) return;

  sections.forEach(section => section.classList.add("hidden"));
  targetSection.classList.remove("hidden");
  navLinks.forEach(l => l.classList.remove("active-link"));
  link.classList.add("active-link");
}

navLinks.forEach(link => {
  link.addEventListener("click", () => activateLink(link));
});

const defaultLink = document.querySelector('.nav-link[data-target="meals"]');
if (defaultLink) activateLink(defaultLink);

/* =========================================
  Variables
========================================= */
const mealsService = new MealsService();
let currentProduct = null;
let lastProducts = [];
let currentMealNutrition = null;
let currentMealData = null;


const DAILY_LIMITS = {
  calories: 2000,
  protein: 50,
  carbs: 250,
  fat: 65
};

/* =========================================
   STORAGE HELPERS
========================================= */
function getFoodLog() {
  try {
    return JSON.parse(localStorage.getItem("foodLog")) || [];
  } catch {
    return [];
  }
}

function saveFoodLog(log) {
  localStorage.setItem("foodLog", JSON.stringify(log));
}

/* =========================================
   MEAL DETAILS
========================================= */
async function showMealDetails(mealId) {
  const meal = await mealsService.getMealById(mealId);
  if (!meal) return;

  const mealsSection = document.getElementById("meals");
  const detailsSection = document.getElementById("meal-details");
  
  if (mealsSection) mealsSection.style.display = "none";
  detailsSection.style.display = "block";


  const heroImg = detailsSection.querySelector("div.bg-white.rounded-2xl img");
  const heroTitle = detailsSection.querySelector("h1");
  
  if (heroImg) {
    heroImg.src = meal.strMealThumb;
    heroImg.alt = meal.strMeal;
  }
  if (heroTitle) heroTitle.textContent = meal.strMeal;


  const tagsContainer = detailsSection.querySelector(".flex.items-center.gap-3.mb-3");
  if (tagsContainer) {
    let tagsHTML = "";
    if (meal.strCategory) {
      tagsHTML += `<span class="px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">${meal.strCategory}</span>`;
    }
    if (meal.strArea) {
      tagsHTML += `<span class="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">${meal.strArea}</span>`;
    }
    if (meal.strTags) {
      meal.strTags.split(",").forEach(tag => {
        tagsHTML += `<span class="px-3 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full">${tag}</span>`;
      });
    }
    tagsContainer.innerHTML = tagsHTML;
  }

  
  const ingredientsContainer = detailsSection.querySelector(".ingredients-container");
  const ingredientList = [];
  let ingredientsHTML = `
    <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
      <i class="fa-solid fa-list-check text-green-500"></i>
      Ingredients
      <span class="text-sm font-normal text-gray-500 ml-auto">${countIngredients(meal)} items</span>
    </h2>
    <div class="space-y-4">
  `;

  for (let i = 1; i <= 20; i++) {
    const ing = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      const safeMeasure = measure?.trim() || "100g";
      ingredientList.push(`${safeMeasure} ${ing.trim()}`);
      ingredientsHTML += `
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
          <input type="checkbox" class="w-5 h-5 text-emerald-600 rounded border-gray-300">
          <span class="text-gray-700"><span class="font-medium text-gray-900">${safeMeasure}</span> ${ing}</span>
        </div>
      `;
    }
  }
  
  ingredientsHTML += "</div>";
  ingredientsContainer.innerHTML = ingredientsHTML;


  await loadNutritionFacts(ingredientList, detailsSection);


  renderInstructions(meal, detailsSection);


  const videoFrame = detailsSection.querySelector("iframe");
  if (videoFrame && meal.strYoutube) {
    videoFrame.src = meal.strYoutube.replace("watch?v=", "embed/");
  }


  const backBtn = detailsSection.querySelector("#back-to-meals-btn");
  if (backBtn) {
    backBtn.onclick = () => {
      detailsSection.style.display = "none";
      if (mealsSection) mealsSection.style.display = "block";
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }

currentMealData = meal;

const logMealBtn = detailsSection.querySelector("#log-meal-btn");
if (logMealBtn) {
  logMealBtn.onclick = () => {
    if (!currentMealNutrition || !currentMealData) {
      alert("Nutrition info not available");
      return;
    }

    addFoodToLog({
      id: currentMealData.idMeal,
      name: currentMealData.strMeal,
      calories: currentMealNutrition.calories,
      protein: currentMealNutrition.protein,
      carbs: currentMealNutrition.carbs,
      fat: currentMealNutrition.fat,
      fiber: currentMealNutrition.fiber,
      sugar: currentMealNutrition.sugar,
      type: "Meal"
    });

    alert("Meal logged successfully ✅");
  };
}



  detailsSection.scrollIntoView({ behavior: "smooth" });
}

function countIngredients(meal) {
  let count = 0;
  for (let i = 1; i <= 20; i++) {
    if (meal[`strIngredient${i}`]?.trim()) count++;
  }
  return count;
}

async function loadNutritionFacts(ingredientList, detailsSection) {
  const container = detailsSection.querySelector("#nutrition-facts-container");
  container.innerHTML = "<p class='text-gray-500'>Loading nutrition info...</p>";

  try {
    const res = await fetch("https://nutriplan-api.vercel.app/api/nutrition/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "ceRegq9m0lb5YWVEnCqYWJOJTab4e8N3dilNpOmY"
      },
      body: JSON.stringify({ ingredients: ingredientList })
    });
    
    const nutritionData = await res.json();

   if (nutritionData?.success && nutritionData?.data?.perServing) {
  const n = nutritionData.data.perServing;
  const total = nutritionData.data.totals;


  currentMealNutrition = n;

      container.innerHTML = `
        <p class="text-sm text-gray-500 mb-4">Per serving</p>
        <div class="text-center py-4 mb-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
          <p class="text-sm text-gray-600">Calories per serving</p>
          <p class="text-4xl font-bold text-emerald-600">${n.calories}</p>
          <p class="text-xs text-gray-500 mt-1">Total: ${total.calories} cal</p>
        </div>
        <div class="space-y-4">
          ${createMacroBar("Protein", n.protein, "g", "emerald", n.protein, 100)}
          ${createMacroBar("Carbs", n.carbs, "g", "blue", n.carbs, 300)}
          ${createMacroBar("Fat", n.fat, "g", "purple", n.fat, 100)}
          ${createMacroBar("Fiber", n.fiber, "g", "orange", n.fiber, 40)}
          ${createMacroBar("Sugar", n.sugar, "g", "pink", n.sugar, 50)}
          ${createMacroBar("Saturated Fat", n.saturatedFat, "g", "red", n.saturatedFat, 20)}
        </div>
        <div class="mt-6 pt-6 border-t border-gray-100">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">Other</h3>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600">Cholesterol</span>
              <span class="font-medium">${n.cholesterol} mg</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Sodium</span>
              <span class="font-medium">${n.sodium} mg</span>
            </div>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = "<p class='text-red-500'>Nutrition info not available.</p>";
    }
  } catch (err) {
    console.error("Nutrition API error:", err);
    container.innerHTML = "<p class='text-red-500'>Error loading nutrition info.</p>";
  }
}

function createMacroBar(label, value, unit, color, current, max) {
  const percent = Math.min(Math.round((current / max) * 100), 100);
  return `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-${color}-500"></div>
        <span class="text-gray-700">${label}</span>
      </div>
      <span class="font-bold text-gray-900">${value}${unit}</span>
    </div>
    <div class="w-full bg-gray-100 rounded-full h-2">
      <div class="bg-${color}-500 h-2 rounded-full" style="width: ${percent}%"></div>
    </div>
  `;
}

function renderInstructions(meal, detailsSection) {
  const container = detailsSection.querySelector(".instructions-container");
  const steps = meal.strInstructions.split("\n").filter(l => l.trim());
  
  let html = `
    <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
      <i class="fa-solid fa-shoe-prints text-green-500"></i>
      Instructions
    </h2>
    <div class="space-y-4">
  `;

  steps.forEach((line, index) => {
    html += `
      <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
        <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
          ${index + 1}
        </div>
        <p class="text-gray-700 leading-relaxed pt-2">${line}</p>
      </div>
    `;
  });

  html += "</div>";
  container.innerHTML = html;
}

/* =========================================
   LOAD MEALS
========================================= */
async function loadMeals() {
  let meals = [];

  if (appState.search) {
    meals = await mealsService.searchMeals(appState.search);
  } else if (appState.area !== "All") {
    meals = await mealsService.filterByArea(appState.area);
  } else if (appState.category !== "All") {
    meals = await mealsService.filterByCategory(appState.category);
  } else {
    meals = await mealsService.searchMeals("");
  }

  renderMeals(meals, showMealDetails);
}

/* =========================================
   SEARCH & FILTERS
========================================= */
let searchTimeout;
const searchInput = document.getElementById("search-input");
if (searchInput) {
  searchInput.addEventListener("input", e => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      appState.search = e.target.value;
      appState.area = "All";
      appState.category = "All";
      loadMeals();
    }, 400);
  });
}

document.querySelectorAll("[data-area]").forEach(btn => {
  btn.addEventListener("click", () => {
    appState.area = btn.dataset.area;
    appState.search = "";
    appState.category = "All";

    document.querySelectorAll("[data-area]").forEach(b => {
      b.style.backgroundColor = "";
      b.style.color = "";
    });
    btn.style.backgroundColor = "#007A55";
    btn.style.color = "white";

    loadMeals();
  });
});

document.querySelectorAll(".category-card").forEach(card => {
  card.addEventListener("click", () => {
    appState.category = card.dataset.category;
    appState.search = "";
    appState.area = "All";
    loadMeals();
  });
});

const gridBtn = document.getElementById("grid-view-btn");
const listBtn = document.getElementById("list-view-btn");

if (gridBtn && listBtn) {
  gridBtn.addEventListener("click", () => {
    appState.currentView = "grid";
    loadMeals();
    gridBtn.classList.add("bg-white", "shadow-sm");
    listBtn.classList.remove("bg-white", "shadow-sm");
  });

  listBtn.addEventListener("click", () => {
    appState.currentView = "list";
    loadMeals();
    listBtn.classList.add("bg-white", "shadow-sm");
    gridBtn.classList.remove("bg-white", "shadow-sm");
  });
}

/* =========================================
   PRODUCT SEARCH
========================================= */
const productSearchInput = document.getElementById("product-search-input");
const searchBtn = document.getElementById("search-product-btn");
const productsGrid = document.getElementById("products-grid");
const productsEmpty = document.getElementById("products-empty");

if (productsEmpty) productsEmpty.classList.remove("hidden");

function renderProducts(products) {
  productsGrid.innerHTML = "";

  if (!products?.length) {
    productsEmpty.classList.remove("hidden");
    return;
  }

  productsEmpty.classList.add("hidden");

  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group";
    card.dataset.barcode = product.barcode;

    const nutrients = product.nutrients || {};
    const calories = nutrients.calories || 0;
    const protein = nutrients.protein || 0;
    const carbs = nutrients.carbs || 0;
    const fat = nutrients.fat || 0;
    const sugar = nutrients.sugar || 0;

    card.innerHTML = `
      <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        <img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" 
             src="${product.image || 'https://via.placeholder.com/150'}" 
             alt="${product.name}" 
             loading="lazy"
             onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center\'><i class=\'fa-solid fa-box text-gray-400 text-2xl\'></i></div>'">
        
        <div class="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded uppercase">
          NUTRI ${product.nutritionGrade?.toUpperCase() || 'N/A'}
        </div>

        <div class="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
          ${product.novaGroup || '?'}
        </div>
      </div>

      <div class="p-4">
        <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${product.brand || 'Unknown Brand'}</p>
        <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          ${product.name}
        </h3>
        
        <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span><i class="mr-1 fa-solid fa-fire"></i>${calories.toFixed(1)} kcal/100g</span>
        </div>

        <div class="grid grid-cols-4 gap-1 text-center">
          <div class="bg-emerald-50 rounded p-1.5">
            <p class="text-xs font-bold text-emerald-700">${protein.toFixed(1)}g</p>
            <p class="text-[10px] text-gray-500">Protein</p>
          </div>
          <div class="bg-blue-50 rounded p-1.5">
            <p class="text-xs font-bold text-blue-700">${carbs.toFixed(1)}g</p>
            <p class="text-[10px] text-gray-500">Carbs</p>
          </div>
          <div class="bg-purple-50 rounded p-1.5">
            <p class="text-xs font-bold text-purple-700">${fat.toFixed(1)}g</p>
            <p class="text-[10px] text-gray-500">Fat</p>
          </div>
          <div class="bg-orange-50 rounded p-1.5">
            <p class="text-xs font-bold text-orange-700">${sugar.toFixed(1)}g</p>
            <p class="text-[10px] text-gray-500">Sugar</p>
          </div>
        </div>
      </div>
    `;

    productsGrid.appendChild(card);
  });
}

async function searchProducts() {
  const query = productSearchInput.value.trim();
  if (!query) {
    productsGrid.innerHTML = "";
    productsEmpty.classList.remove("hidden");
    lastProducts = [];
    return;
  }

  try {
    const res = await fetch(`https://nutriplan-api.vercel.app/api/products/search?q=${encodeURIComponent(query)}&page=1&limit=24`);
    const response = await res.json();

    lastProducts = response.results || [];
    renderProducts(lastProducts);
  } catch (err) {
    console.error("Error fetching products:", err);
    productsGrid.innerHTML = "";
    productsEmpty.classList.remove("hidden");
    lastProducts = [];
  }
}

if (searchBtn) searchBtn.addEventListener("click", searchProducts);
if (productSearchInput) {
  productSearchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") searchProducts();
  });
}

/* =========================================
   PRODUCT MODAL
========================================= */
const productModal = document.getElementById("product-detail-modal");

function openProductModal(product) {
  if (!productModal) return;

  const nutrients = product.nutrients || {};

  productModal.innerHTML = `
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative">
      <div class="p-6">
        <button class="close-product-modal text-gray-400 hover:text-gray-600 text-3xl font-bold absolute top-4 right-4">
          &times;
        </button>

        <div class="flex items-start gap-6 mb-6">
          <div class="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src="${product.image || 'https://via.placeholder.com/150'}" class="w-full h-full object-contain" alt="${product.name}" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-emerald-600 font-semibold mb-1">${product.brand || 'Unknown Brand'}</p>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">${product.name}</h2>
            <div class="flex items-center gap-3">
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50">
                <span class="w-8 h-8 rounded flex items-center justify-center text-white font-bold bg-red-600">
                  ${product.nutritionGrade?.toUpperCase() || 'N/A'}
                </span>
                <div>
                  <p class="text-xs font-bold text-red-700">Nutri-Score</p>
                </div>
              </div>
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50">
                <span class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-red-600">
                  ${product.novaGroup || '?'}
                </span>
                <div>
                  <p class="text-xs font-bold text-red-700">NOVA</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 mb-6 border border-emerald-200">
          <h3 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
            Nutrition Facts <span class="text-sm font-normal text-gray-500">(per 100g)</span>
          </h3>
          <div class="text-center mb-4 pb-4 border-b border-emerald-200">
            <p class="text-4xl font-bold text-gray-900">${(nutrients.calories || 0).toFixed(1)}</p>
            <p class="text-sm text-gray-500">Calories</p>
          </div>
          <div class="grid grid-cols-4 gap-4">
            <div class="text-center">
              <p class="text-lg font-bold text-emerald-600">${(nutrients.protein || 0).toFixed(1)}g</p>
              <p class="text-xs text-gray-500">Protein</p>
            </div>
            <div class="text-center">
              <p class="text-lg font-bold text-blue-600">${(nutrients.carbs || 0).toFixed(1)}g</p>
              <p class="text-xs text-gray-500">Carbs</p>
            </div>
            <div class="text-center">
              <p class="text-lg font-bold text-purple-600">${(nutrients.fat || 0).toFixed(1)}g</p>
              <p class="text-xs text-gray-500">Fat</p>
            </div>
            <div class="text-center">
              <p class="text-lg font-bold text-orange-600">${(nutrients.sugar || 0).toFixed(1)}g</p>
              <p class="text-xs text-gray-500">Sugar</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 rounded-xl p-5 mb-6">
          <h3 class="font-bold text-gray-900 mb-3">Ingredients</h3>
          <p class="text-sm text-gray-600 leading-relaxed">
            ${product.ingredients_text || product.ingredients_text_en || 'N/A'}
          </p>
        </div>

        <div class="flex gap-3">
          <button class="add-product-to-log flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all" data-barcode="${product.barcode}">
            <i class="fa-solid fa-plus"></i> Log This Food
          </button>
          <button class="close-product-modal flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
  `;

  productModal.classList.remove("hidden");

  productModal.querySelectorAll(".close-product-modal").forEach(btn => {
    btn.addEventListener("click", () => {
      productModal.classList.add("hidden");
    });
  });

  currentProduct = product;
}

if (productsGrid) {
  productsGrid.addEventListener("click", (e) => {
    const card = e.target.closest(".product-card");
    if (!card) return;

    const barcode = card.dataset.barcode;
    const product = lastProducts.find(p => p.barcode === barcode);
    if (product) openProductModal(product);
  });
}

/* =========================================
   BARCODE LOOKUP
========================================= */
const barcodeInput = document.getElementById("barcode-input");
const lookupBtn = document.getElementById("lookup-barcode-btn");

if (lookupBtn) {
  lookupBtn.addEventListener("click", async () => {
    const barcode = barcodeInput.value.trim();
    if (!barcode) {
      alert("Please enter a barcode!");
      return;
    }

    try {
      const res = await fetch(`https://nutriplan-api.vercel.app/api/products/barcode/${barcode}`);
      const data = await res.json();
      
      if (data && data.name) {
        openProductModal(data);
      } else {
        alert("Product not found!");
      }
    } catch (err) {
      console.error("Barcode lookup error:", err);
      alert("Error fetching product. Please try again.");
    }
  });
}

/* =========================================
   PRODUCT CATEGORIES
========================================= */
document.querySelectorAll(".product-category-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const category = btn.dataset.category;
    productsGrid.innerHTML = "";
    productsEmpty.classList.add("hidden");

    try {
      const res = await fetch(`https://nutriplan-api.vercel.app/api/products/category/${category}`);
      const data = await res.json();

      const products = (data.products || data.results || []).map(p => ({
        ...p,
        barcode: p.barcode || p.code || p.id
      }));

      if (products.length) {
        lastProducts = products;
        renderProducts(lastProducts);
      } else {
        productsEmpty.classList.remove("hidden");
      }
    } catch (err) {
      console.error("Category fetch error:", err);
      productsEmpty.classList.remove("hidden");
    }
  });
});

/* =========================================
   FOOD LOG MANAGEMENT
========================================= */
function addFoodToLog(item) {
  const foodLog = getFoodLog();
  foodLog.push({
    ...item,
    id: item.id || Date.now(),
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  });
  saveFoodLog(foodLog);
  renderFoodLog();
  updateNutritionProgress();
  updateWeeklyOverview();
  updateCaloriesDisplay();
}

function renderFoodLog() {
  const foodLog = getFoodLog();
  const container = document.getElementById("food-log-container");
  const emptyState = document.querySelector(".foodlog-empty");
  const countEl = document.getElementById("logged-count");
  const clearBtn = document.getElementById("clear-foodlog");

  if (countEl) countEl.textContent = foodLog.length;

  if (!foodLog.length) {
    container.innerHTML = "";
    emptyState?.classList.remove("hidden");
    clearBtn?.classList.add("hidden");
    updateNutritionProgress();
    return;
  }

  emptyState?.classList.add("hidden");
  clearBtn?.classList.remove("hidden");

  container.innerHTML = foodLog.map(item => `
    <div class="flex items-center justify-between bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-all">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
          <i class="fa-solid fa-box text-blue-600 text-xl"></i>
        </div>
        <div>
          <p class="font-semibold text-gray-900">${item.name}</p>
          <p class="text-sm text-gray-500">${item.brand || ""} • <span class="text-blue-600">${item.type || "Product"}</span></p>
          <p class="text-xs text-gray-400 mt-1">${item.time}</p>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p class="text-lg font-bold text-emerald-600">${item.calories || 0}</p>
          <p class="text-xs text-gray-500">kcal</p>
        </div>
        <div class="hidden md:flex gap-2 text-xs text-gray-500">
          <span class="px-2 py-1 bg-blue-50 rounded">${item.protein || 0}g P</span>
          <span class="px-2 py-1 bg-amber-50 rounded">${item.carbs || 0}g C</span>
          <span class="px-2 py-1 bg-purple-50 rounded">${item.fat || 0}g F</span>
        </div>
        <button class="remove-foodlog-item text-gray-400 hover:text-red-500 transition-all p-2" data-id="${item.id}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join("");

  updateNutritionProgress();
}

/* =========================================
   NUTRITION PROGRESS
========================================= */
function updateNutritionProgress() {
  const foodLog = getFoodLog();

  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  };

  foodLog.forEach(item => {
    totals.calories += Number(item.calories) || 0;
    totals.protein += Number(item.protein) || 0;
    totals.carbs += Number(item.carbs) || 0;
    totals.fat += Number(item.fat) || 0;
  });

  updateProgressBar("calories", totals.calories);
  updateProgressBar("protein", totals.protein);
  updateProgressBar("carbs", totals.carbs);
  updateProgressBar("fat", totals.fat);
}

function updateProgressBar(type, value) {
  const percent = Math.min(Math.round((value / DAILY_LIMITS[type]) * 100), 100);

  const valueEl = document.getElementById(`${type}-value`);
  const percentEl = document.getElementById(`${type}-percent`);
  const barEl = document.getElementById(`${type}-bar`);

  if (valueEl) {
    valueEl.textContent = type === "calories" ? `${Math.round(value)} kcal` : `${Math.round(value)} g`;
  }
  if (percentEl) percentEl.textContent = `${percent}%`;
  if (barEl) barEl.style.width = `${percent}%`;
}

/* =========================================
   WEEKLY OVERVIEW
========================================= */
function updateWeeklyOverview() {
  const foodLog = getFoodLog();
  const today = new Date();
  const weekContainer = document.querySelector(".grid-cols-7");
  if (!weekContainer) return;

  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    week.push({
      date: d.toISOString().split("T")[0],
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      calories: 0,
      items: 0
    });
  }

  week.forEach(day => {
    const itemsToday = foodLog.filter(item => item.date === day.date);
    day.items = itemsToday.length;
    day.calories = itemsToday.reduce((sum, item) => sum + Number(item.calories || 0), 0);
  });

  weekContainer.innerHTML = week.map(day => {
    const isToday = day.date === today.toISOString().split("T")[0];
    return `
      <div class="text-center ${isToday ? 'bg-indigo-100 rounded-xl p-2' : ''}">
        <p class="text-xs text-gray-500 mb-1">${day.day}</p>
        <p class="text-sm font-medium text-gray-900">${new Date(day.date).getDate()}</p>
        <div class="mt-2 ${day.calories > 0 ? 'text-emerald-600' : 'text-gray-300'}">
          <p class="text-lg font-bold">${Math.round(day.calories)}</p>
          <p class="text-xs">kcal</p>
        </div>
        ${day.items > 0 ? `<p class="text-xs text-gray-400 mt-1">${day.items} items</p>` : ''}
      </div>
    `;
  }).join('');
}

function updateCaloriesDisplay() {
  const totalCaloriesEl = document.getElementById("total-kcal");
  if (!totalCaloriesEl) return;

  const foodLog = getFoodLog();
  const totalCalories = foodLog.reduce((sum, item) => sum + Number(item.calories || 0), 0);
  totalCaloriesEl.textContent = Math.round(totalCalories);
}

/* =========================================
   DATE DISPLAY
========================================= */
function formatDate(date) {
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

const fullDate = document.getElementById('full-date');
if (fullDate) {
  fullDate.textContent = formatDate(new Date());
}

/* =========================================
   EVENT LISTENERS
========================================= */
document.addEventListener("click", function(e) {

  const logBtn = e.target.closest(".add-product-to-log");
  if (logBtn && currentProduct) {
    const foodItem = {
      id: currentProduct.barcode || Date.now(),
      name: currentProduct.name,
      brand: currentProduct.brand || "",
      calories: currentProduct.nutrients?.calories || 0,
      protein: currentProduct.nutrients?.protein || 0,
      carbs: currentProduct.nutrients?.carbs || 0,
      fat: currentProduct.nutrients?.fat || 0,
      sugar: currentProduct.nutrients?.sugar || 0,
      type: "Product"
    };

    addFoodToLog(foodItem);
    productModal?.classList.add("hidden");
  }


  const removeBtn = e.target.closest(".remove-foodlog-item");
  if (removeBtn) {
    const id = removeBtn.dataset.id;
    let foodLog = getFoodLog();
    foodLog = foodLog.filter(item => String(item.id) !== String(id));
    saveFoodLog(foodLog);
    renderFoodLog();
    updateWeeklyOverview();
    updateCaloriesDisplay();
  }
});


const clearBtn = document.getElementById("clear-foodlog");
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all logged foods?")) {
      localStorage.removeItem("foodLog");
      renderFoodLog();
      updateWeeklyOverview();
      updateCaloriesDisplay();
    }
  });
}

/* =========================================
   NAVIGATION HELPERS
========================================= */
const browseBtn = document.getElementById("browse-recipes-btn");
const mealsSection = document.getElementById("meals");
const foodLogSection = document.getElementById("food-log");

if (browseBtn) {
  browseBtn.addEventListener("click", function(e) {
    e.preventDefault();
    if (mealsSection) {
      mealsSection.classList.remove("hidden");
      mealsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (foodLogSection) foodLogSection.classList.add("hidden");
  });
}

const scanBtn = document.querySelector('a[href="#product-scanner"]');
const productScannerSection = document.getElementById("product-scanner");

if (scanBtn) {
  scanBtn.addEventListener("click", function(e) {
    e.preventDefault();
    if (productScannerSection) {
      productScannerSection.classList.remove("hidden");
      productScannerSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (mealsSection) mealsSection.classList.add("hidden");
    if (foodLogSection) foodLogSection.classList.add("hidden");
  });
}

/* =========================================
   INITIALIZATION
========================================= */
window.addEventListener("DOMContentLoaded", () => {
  const detailsSection = document.getElementById("meal-details");
  if (detailsSection) detailsSection.style.display = "none";

  loadMeals();
  renderFoodLog();
  updateNutritionProgress();
  updateWeeklyOverview();
  updateCaloriesDisplay();
});