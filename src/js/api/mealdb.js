// const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

/**
 * Get all meal categories
 */
// api/mealdb.js
export default class MealsService {
  constructor() {
    this.baseURL = "https://www.themealdb.com/api/json/v1/1/";
  }

  async searchMeals(query) {
    const res = await fetch(`${this.baseURL}search.php?s=${query}`);
    const data = await res.json();
    return data.meals;
  }

  async filterByCategory(category) {
    const res = await fetch(`${this.baseURL}filter.php?c=${category}`);
    const data = await res.json();
    return data.meals;
  }

  async filterByArea(area) {
    const res = await fetch(`${this.baseURL}filter.php?a=${area}`);
    const data = await res.json();
    return data.meals;
  }

async getMealById(id) {
  const res = await fetch(`${this.baseURL}lookup.php?i=${id}`);
  const data = await res.json();
  return data.meals ? data.meals[0] : null;
}

}