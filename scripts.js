document.addEventListener('DOMContentLoaded', () => {
    const apiKey = '299e8bcdb3d84d58afb103321251102'; 
    const searchBtn = document.getElementById('search-btn');
    const cityInput = document.getElementById('city-input');
    const themeToggle = document.getElementById('theme-toggle');
    let forecastChart;
    let currentWeatherData = null;

    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
    });

    const defaultCity = localStorage.getItem('defaultCity');
    if (defaultCity) {
        cityInput.value = defaultCity;
        getWeatherData(defaultCity);
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            getWeatherDataByCoords(latitude, longitude);
        }, error => {
            console.error('Geolocation error:', error);
            displayError('Unable to retrieve your location. Please enter a city.');
        });
    }

    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            localStorage.setItem('defaultCity', city);
            getWeatherData(city);
        } else {
            displayError('Please enter a city name.');
        }
    });

    window.addEventListener('resize', () => {
        if (currentWeatherData) {
            displayWeatherForecast(currentWeatherData);
        }
    });

    function getWeatherData(city) {
        displayError(''); 

        const endpoint = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=5&aqi=no&alerts=no`;

        fetchData(endpoint);
    }

    function getWeatherDataByCoords(lat, lon) {
        displayError('');

        const endpoint = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=5&aqi=no&alerts=no`;

        fetchData(endpoint);
    }

    function fetchData(endpoint) {
        fetch(endpoint)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`City not found: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                currentWeatherData = data;
                displayCurrentWeather(data);
                displayWeatherForecast(data);
            })
            .catch(error => {
                console.error('Error fetching weather data:', error);
                displayError(`Error fetching weather data: ${error.message}`);
            });
    }

    function displayCurrentWeather(data) {
        const weatherCurrentDiv = document.getElementById('weather-current');

        const localTime = new Date(data.location.localtime);

        const options = {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
        };
        const formattedDateTime = localTime.toLocaleString('en-US', options);

        weatherCurrentDiv.innerHTML = `
            <h2>${data.location.name}, ${data.location.country}</h2>
            <img src="${data.current.condition.icon.startsWith('//') ? 'https:' + data.current.condition.icon : data.current.condition.icon}" alt="${data.current.condition.text}">
            <p><strong>${data.current.condition.text}</strong></p>
            <p>Temperature: ${data.current.temp_c}°C</p>
            <p>Feels Like: ${data.current.feelslike_c}°C</p>
            <p>Humidity: ${data.current.humidity}%</p>
            <p>Wind: ${data.current.wind_kph} kph</p>
            <p>Date & Time: ${formattedDateTime}</p>
        `;

        applyWeatherBackground(data.current.condition.text.toLowerCase());
    }

    function displayWeatherForecast(data) {
        const forecastDays = data.forecast.forecastday;

        const screenWidth = window.innerWidth;
        const isMobile = screenWidth <= 600;

        if (isMobile) {
            document.querySelector('.chart-container').style.display = 'none';
            document.getElementById('forecastCards').style.display = 'flex';
            displayForecastCards(forecastDays);
        } else {
            document.querySelector('.chart-container').style.display = 'block';
            document.getElementById('forecastCards').style.display = 'none';
            displayForecastChart(forecastDays);
        }
    }

    function displayForecastCards(forecastDays) {
        const forecastCardsDiv = document.getElementById('forecastCards');
        forecastCardsDiv.innerHTML = ''; 

        const limitedForecast = forecastDays.slice(0, 4);

        limitedForecast.forEach(day => {
            const date = day.date;
            const icon = day.day.condition.icon.startsWith('//') ? 'https:' + day.day.condition.icon : day.day.condition.icon;
            const condition = day.day.condition.text;
            const maxTemp = day.day.maxtemp_c;
            const minTemp = day.day.mintemp_c;

            const card = document.createElement('div');
            card.classList.add('forecast-card');

            card.innerHTML = `
                <h3>${date}</h3>
                <img src="${icon}" alt="${condition}">
                <p><strong>${condition}</strong></p>
                <p>Max: ${maxTemp}°C</p>
                <p>Min: ${minTemp}°C</p>
            `;

            forecastCardsDiv.appendChild(card);
        });
    }

    function displayForecastChart(forecastDays) {
        const dates = forecastDays.map(day => day.date);
        const temperatures = forecastDays.map(day => day.day.avgtemp_c);

        const ctx = document.getElementById('forecastChart').getContext('2d');

        if (forecastChart) {
            forecastChart.destroy();
        }

        forecastChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Avg Temperature (°C)',
                    data: temperatures,
                    backgroundColor: 'rgba(255, 215, 0, 0.2)',
                    borderColor: 'rgba(255, 215, 0, 1)',
                    borderWidth: 3,
                    pointBackgroundColor: 'rgba(255, 215, 0, 1)',
                    tension: 0.4,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Date',
                            color: '#fff',
                            font: {
                                size: 18
                            }
                        },
                        ticks: {
                            color: '#fff',
                            font: {
                                size: 16
                            }
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Temperature (°C)',
                            color: '#fff',
                            font: {
                                size: 18
                            }
                        },
                        ticks: {
                            color: '#fff',
                            font: {
                                size: 16
                            }
                        },
                        grid: {
                            color: '#fff'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff',
                            font: {
                                size: 18
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.parsed.y}°C`;
                            }
                        }
                    }
                },
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        top: 20,
                        bottom: 10
                    }
                },
                interaction: {
                    mode: 'nearest',
                    intersect: false,
                },
            }
        });
    }

    

    function applyWeatherBackground(conditionText) {
        document.body.classList.remove('rainy', 'sunny', 'cloudy', 'snowy', 'clear', 'default-weather');

        if (conditionText.includes('rain') || conditionText.includes('drizzle') || conditionText.includes('thunderstorm')) {
            document.body.classList.add('rainy');
        } else if (conditionText.includes('sunny') || conditionText.includes('clear')) {
            document.body.classList.add('sunny');
        } else if (conditionText.includes('cloud')) {
            document.body.classList.add('cloudy');
        } else if (conditionText.includes('snow') || conditionText.includes('sleet')) {
            document.body.classList.add('snowy');
        } else {
            document.body.classList.add('default-weather');
        }
    }

    function displayError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.textContent = message;
    }
});
