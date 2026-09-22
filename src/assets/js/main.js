import "../scss/style.scss";
import WeatherScene from "./weather-scene";

const composition = document.getElementById("composition");
const overlay = document.getElementById("overlay-text");

new WeatherScene(composition, overlay, {
    baseUrl: "https://api.openweathermap.org/data/2.5/weather",
    zip: 75000,
    cd: "FR",
    units: "metric",
    key: import.meta.env.VITE_API_KEY,
});
