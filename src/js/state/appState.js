// state/appState.js

class AppState {
  constructor() {
    this.search = "";
    this.area = "All";
    this.category = "All";
    this.currentView = "grid"; 
  }

  resetFilters() {
    this.search = "";
    this.area = "All";
    this.category = "All";
  }
}

export const appState = new AppState();







