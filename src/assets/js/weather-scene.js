import { hashString, createRandom } from "./utils";

export default class WeatherScene {
    #rafId = null;

    constructor(composition, overlay, { baseUrl, zip, cd, units, key } = {}) {
        this.composition = composition;
        this.overlay = overlay;
        if (!this.composition || !this.overlay) return;
        this.zipField = this.overlay.querySelector("#zip");
        this.weatherText = this.overlay.querySelector("#weather-text");
        this.panelLeft = this.composition.querySelector("#panel-left");
        this.panelRight = this.composition.querySelector("#panel-right");
        this.apiConfig = { baseUrl, zip, cd, units, key };
        this.init();
    }

    init = async () => {
        this.#setZip(this.apiConfig.zip);
        this.#initEventListeners();
        this.weatherData = await this.#parseWeatherData();
        this.#createScene(this.weatherData);
    };

    // --------------------------------------------------------------
    // OPEN WEATHER API
    // --------------------------------------------------------------

    // Destructure API config object for ease of use,
    // and build a base URL to fetch weather data from the API.
    #fetchWeatherApi = async () => {
        const { baseUrl, zip, cd, units, key } = this.apiConfig;
        const url = `${baseUrl}?zip=${zip},${cd}&units=${units}&appid=${key}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(resp.statusText);

        return await resp.json();
    };

    // Parse the API data and return an object stripped of unnecessary entries.
    #parseWeatherData = async () => {
        try {
            const { name, weather, wind, main } = await this.#fetchWeatherApi();
            return {
                city: name,
                mood: weather[0].description,
                windSpeed: Math.round(wind.speed),
                temperature: Math.round(main.temp),
                humidity: Math.round(main.humidity),
            };
        } catch (error) {
            throw new Error(`Error parsing the data: ${error}`);
        }
    };

    // --------------------------------------------------------------
    // GRADIENT
    // --------------------------------------------------------------

    #createScene = (weatherData) => {
        this.#createGradient(weatherData);
        this.#createWording(weatherData);
    };

    // Build the colors of the composition from the weather data.
    // A dominant hue is shared by both panels, the other tones vary per panel.
    #createPalette = (weatherData, between) => {
        const { temperature } = weatherData;
        const hsl = (hue, saturation, lightness) =>
            `hsl(${Math.round(((hue % 360) + 360) % 360)}deg ${Math.round(saturation)}% ${Math.round(lightness)}%)`;

        // Dominant hue, warm (red to yellow) or cool (green to purple) depending on the weather temperature
        const isWeatherWarm = temperature >= 20;
        const baseHue = isWeatherWarm ? between(-60, 70) : between(150, 290);

        // The accent stays close to the dominant hue (on either side) to keep the palette harmonious
        const accentShift = between(15, 60) * (between(0, 1) < 0.5 ? -1 : 1);

        return {
            vivid: hsl(baseHue, between(80, 100), between(42, 55)),
            pale: hsl(between(0, 360), between(15, 45), between(82, 92)),
            accent: hsl(baseHue + accentShift, between(70, 95), between(45, 60)),
            deepLeft: hsl(between(0, 360), between(50, 90), between(6, 16)),
            darkRight: hsl(between(0, 360), between(40, 80), between(10, 20)),
            deepRight: hsl(between(0, 360), between(60, 100), between(5, 12)),
        };
    };

    #createGradient = (weatherData) => {
        const { city, mood, windSpeed, temperature, humidity } = weatherData;

        // Every random value of the composition comes from one seed built from the ZIP code
        // and all the weather data: the same place with the same weather gives the same composition
        const seed = hashString(
            [this.apiConfig.zip, city, mood, windSpeed, temperature, humidity].join("|"),
        );
        const random = createRandom(seed);
        const between = (min, max) => min + random() * (max - min);
        const deg = (min, max) => `${between(min, max).toFixed(1)}deg`;

        const p = this.#createPalette(weatherData, between);

        // Both conic gradients share the same center: the middle of the seam.
        // Only half of each gradient is visible, so the stops are placed
        // in that half (180-360deg on the left, 0-180deg on the right).
        // Each gradient ends with its first color so the rotation stays seamless.
        // Stop positions also vary, within ranges that keep them in order.
        this.panelLeft.style.background = `conic-gradient(from calc(var(--angle, 0) * 1deg) at 100% 50%,
            ${p.pale} 0deg, ${p.accent} 180deg, ${p.deepLeft} ${deg(184, 195)}, ${p.deepLeft} ${deg(200, 235)},
            ${p.vivid} ${deg(250, 285)}, ${p.pale} ${deg(305, 335)}, ${p.pale} 360deg)`;
        this.panelRight.style.background = `conic-gradient(from calc(var(--angle, 0) * 1deg) at 0% 50%,
            ${p.darkRight} 0deg, ${p.vivid} ${deg(60, 105)}, ${p.deepRight} ${deg(120, 150)}, ${p.deepRight} ${deg(160, 175)},
            ${p.accent} 180deg, ${p.darkRight} 360deg)`;

        if (this.#rafId) cancelAnimationFrame(this.#rafId);

        // Rotate both gradients together, as one movement, at a speed driven by the wind
        const updateClockHand = (time) => {
            let speed = windSpeed / 1000;
            let secondAngle = (time * speed) % 360;
            this.composition.style.setProperty("--angle", secondAngle);
            this.#rafId = requestAnimationFrame(updateClockHand);
        };

        this.#rafId = requestAnimationFrame(updateClockHand);
    };

    // --------------------------------------------------------------
    // WORDING
    // --------------------------------------------------------------

    #timeWhenFetched = () => {
        let currentDate = new Date();
        let day = String(currentDate.getDate()).padStart(2, "0");
        let month = String(currentDate.getMonth() + 1).padStart(2, "0");
        let year = currentDate.getFullYear();
        let hours = String(currentDate.getHours()).padStart(2, "0");
        let minutes = String(currentDate.getMinutes()).padStart(2, "0");
        return { day, month, year, hours, minutes };
    };

    #createWording = (weatherData) => {
        const { city, mood, windSpeed, temperature, humidity } = weatherData;
        const { day, month, year, hours, minutes } = this.#timeWhenFetched();
        this.weatherText.textContent = `${city}, ${temperature}° celcius, ${mood}, wind speed ${windSpeed} mph, humidity ${humidity}%. values fetched on ${day}/${month}/${year} at ${hours}:${minutes}`;
    };

    // --------------------------------------------------------------
    // UPDATE SCENE
    // --------------------------------------------------------------

    // Write a ZIP code in the editable part of the sentence
    #setZip = (zip) => {
        this.zipField.textContent = zip;
    };

    // Update the weather data based on the new ZIP code and refreshes the scene.
    // An invalid or unknown ZIP code puts the previous one back.
    #updateWeatherData = async () => {
        const newZip = this.zipField.textContent.trim();
        const previousZip = this.apiConfig.zip;
        if (newZip.length !== 5 || newZip === String(previousZip)) {
            this.#setZip(previousZip);
            return;
        }

        this.apiConfig.zip = newZip;
        try {
            this.weatherData = await this.#parseWeatherData();
            this.#createScene(this.weatherData);
        } catch (error) {
            console.error(error);
            this.apiConfig.zip = previousZip;
            this.#setZip(previousZip);
        }
    };

    // --------------------------------------------------------------
    // EVENT LISTENERS
    // --------------------------------------------------------------

    // Enter (or clicking away) validates, Escape cancels
    #initEventListeners = () => {
        const field = this.zipField;

        // Only let digits in, 5 at most, and no line breaks
        field.addEventListener("beforeinput", (event) => {
            if (!event.inputType.startsWith("insert")) return;
            const text = event.data ?? event.dataTransfer?.getData("text/plain") ?? "";
            const selected = window.getSelection().toString().length;
            const length = field.textContent.length - selected + text.length;
            if (!/^\d+$/.test(text) || length > 5) event.preventDefault();
        });
        field.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                field.blur();
            }
            if (event.key === "Escape") {
                this.#setZip(this.apiConfig.zip);
                field.blur();
            }
        });
        field.addEventListener("blur", this.#updateWeatherData);
    };
}
