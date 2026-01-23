// =========== Loading Spinner Design ============
/*
<div class="flex items-center justify-center py-12">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
</div>


// =========== Empty State Design ============

<div class="flex flex-col items-center justify-center py-12 text-center">
    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid fa-search text-gray-400 text-2xl"></i>
    </div>
    <p class="text-gray-500 text-lg">No recipes found</p>
    <p class="text-gray-400 text-sm mt-2">Try searching for something else</p>
</div>
*/


/**
 * Create category card HTML
 */
// ui/components.js

import { appState } from "../state/appState.js"; 

export function renderMeals(meals, onMealClick) {
  const grid = document.getElementById("recipes-grid");
  const list = document.getElementById("recipes-list");
  const count = document.getElementById("recipes-count");

  
  grid.innerHTML = "";
  list.innerHTML = "";

  if (!meals || meals.length === 0) {
    const noMealsHTML = `<p class="col-span-4 text-center text-gray-500">No meals found</p>`;
    grid.innerHTML = noMealsHTML;
    list.innerHTML = noMealsHTML;
    count.textContent = "Showing 0 recipes";
    return;
  }

  count.textContent = `Showing ${meals.length} recipes`;

  meals.forEach(meal => {
    const card = document.createElement("div");

    const content = `
      <div class="relative overflow-hidden ${appState.currentView === 'grid' ? 'h-48' : 'w-48 h-full'}">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
        <div class="absolute bottom-3 left-3 flex gap-2">
          <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">
            <i class="fa-solid fa-tag text-green-600"></i>
            ${meal.strCategory || appState.category || "Unknown"}
          </span>
          <span class="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-semibold rounded-full text-gray-700">
            <i class="fa-solid fa-globe text-blue-500"></i>
            ${meal.strArea || appState.area || "Unknown"}
          </span>
        </div>
      </div>
      <div class="p-4">
        <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
          ${meal.strMeal}
        </h3>
        <p class="text-xs text-gray-600 mb-3 line-clamp-2">
          ${meal.strInstructions ? meal.strInstructions.substring(0, 60) + "..." : "No description available."}
        </p>
  <div class="flex items-center justify-between text-xs">
                    <span class="font-semibold text-gray-900">
                        <i class="fa-solid fa-tag text-green-600"></i>
                      ${meal.strCategory || appState.category || "Unknown"}
                    </span>
                    <span class="font-semibold text-gray-500">
                         <i class="fa-solid fa-globe text-blue-500"></i>
                         ${meal.strArea || appState.area || "Unknown"}
                    </span>
                </div>  
      </div>
    `;

    if (appState.currentView === "grid") {
      card.className = "recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group";
      card.innerHTML = content;
      grid.appendChild(card);
    } else {
      card.className = "recipe-list bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-row h-40";
      card.innerHTML = content;
      list.appendChild(card);
    }

    
    card.addEventListener("click", () => {
      if (onMealClick) onMealClick(meal.idMeal);
    });
  });

  
  grid.style.display = appState.currentView === "grid" ? "grid" : "none";
  list.style.display = appState.currentView === "list" ? "grid" : "none";
}

