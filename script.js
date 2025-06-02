const BLYNK_TOKEN = 'ntlJEMQqQnaJaBMD2DlcJIJd-FlqBqQb';

const virtualPins = {
  pm25: 'V0',
  mq135: 'V1',
  temp: 'V2',
  humidity: 'V3'
};
const dangerLevels = {
  pm25: 75,
  mq135: 400,
  temp: 50,
  humidity: 85
};

const ctx = document.getElementById('pmChart').getContext('2d');
const pmChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [],
    datasets: [
      {
        label: 'Hazardous Gas (MQ135)',
        data: [],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.3)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Outdoor Dust (PM2.5)',
        data: [],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.3)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Temperature (°C)',
        data: [],
        borderColor: 'rgb(7, 0, 100)',
        backgroundColor: 'rgba(7, 0, 100, 0.3)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Humidity (%)',
        data: [],
        borderColor: 'rgb(0, 97, 21)',
        backgroundColor: 'rgba(0, 97, 21, 0.3)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#fff',
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#fff' },
        grid: { color: '#444' },
      },
      y: {
        ticks: { color: '#fff' },
        grid: { color: '#444' },
      }
    }
  }
});

function updateProgress(circleId, textId, value, max, unit) {
  const circle = document.getElementById(circleId);
  const text = document.getElementById(textId);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  const val = Math.min(Math.max(value, 0), max);
  const offset = circumference - (val / max) * circumference;
  circle.style.strokeDashoffset = offset;

  let strokeColor = '#2ecc71';
  if (val > max * 0.75) strokeColor = '#e74c3c';
  else if (val > max * 0.5) strokeColor = '#f1c40f';

  circle.style.stroke = strokeColor;
  text.textContent = `${value} ${unit}`;
}
function checkForDanger(data) {
  const isDanger =
    data.pm25 > dangerLevels.pm25 &&
    data.mq135 > dangerLevels.mq135 &&
    data.temp > dangerLevels.temp &&
    data.humidity > dangerLevels.humidity;

  const banner = document.getElementById('warningBanner');
  const alarm = document.getElementById('alarmSound');

  if (isDanger) {
    banner.style.display = 'block';
    alarm.play();
  } else {
    banner.style.display = 'none';
    alarm.pause();
    alarm.currentTime = 0;
  }
}

async function getSensorData() {
  try {
    const params = Object.values(virtualPins).map(pin => `&${pin}`).join('');
    const response = await fetch(`https://blynk.cloud/external/api/get?token=${BLYNK_TOKEN}${params}`);
    const data = await response.json();

    return {
      pm25: parseFloat(data[virtualPins.pm25]),
      mq135: parseFloat(data[virtualPins.mq135]),
      temp: parseFloat(data[virtualPins.temp]),
      humidity: parseFloat(data[virtualPins.humidity])
    };
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    return null;
  }
}

async function updateCircleProgress() {
  const data = await getSensorData();
  if (!data) return;

  updateProgress('pm25Circle', 'pm25Text', data.pm25, 100, 'µg/m³');
  updateProgress('mq135Circle', 'mq135Text', data.mq135, 500, 'ppm');
  updateProgress('tempCircle', 'tempText', data.temp, 50, '°C');
  updateProgress('humidityCircle', 'humidityText', data.humidity, 100, '%');

  checkForDanger(data);
}

async function updateLiveChartData() {
  const data = await getSensorData();
  if (!data) return;

  const maxPoints = 30;
  pmChart.data.datasets[0].data.push(data.mq135);
  pmChart.data.datasets[1].data.push(data.pm25);
  pmChart.data.datasets[2].data.push(data.temp);
  pmChart.data.datasets[3].data.push(data.humidity);

  pmChart.data.datasets.forEach(ds => {
    ds.data = ds.data.slice(-maxPoints);
  });

  const now = new Date();
  const label = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  pmChart.data.labels.push(label);
  pmChart.data.labels = pmChart.data.labels.slice(-maxPoints);

  pmChart.update();
}

let circleInterval = null;
let chartInterval = null;

function startLiveUpdates() {
  updateCircleProgress();
  updateLiveChartData();

  circleInterval = setInterval(updateCircleProgress, 3000);
  chartInterval = setInterval(updateLiveChartData, 60000);
}

function stopLiveUpdates() {
  if (circleInterval) {
    clearInterval(circleInterval);
    circleInterval = null;
  }
  if (chartInterval) {
    clearInterval(chartInterval);
    chartInterval = null;
  }
}

const dashboard = document.querySelector('.dashboard');
const dropdownWrapper = document.createElement('div');
dropdownWrapper.style.textAlign = 'center';
dropdownWrapper.style.marginBottom = '20px';

const dropdown = document.createElement('select');
dropdown.id = 'dateSelector';

const span = document.createElement('span');
span.style.color = 'black';
span.textContent = 'Select Date / Hourly: ';
dropdownWrapper.appendChild(span);

dropdownWrapper.appendChild(document.createTextNode(''));
dropdownWrapper.appendChild(dropdown);
dashboard.insertBefore(dropdownWrapper, dashboard.querySelector('.chart-section'));

function populateDropdown() {
  const startDate = new Date('2025-05-20');
  const endDate = new Date();
  dropdown.innerHTML = '';

  const hourlyOption = document.createElement('option');
  hourlyOption.value = 'hour';
  hourlyOption.text = 'Hourly (Live Data)';
  dropdown.appendChild(hourlyOption);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const option = document.createElement('option');
    option.value = d.toISOString().slice(0, 10);
    option.text = d.toDateString();
    dropdown.appendChild(option);
  }
}

async function fetchLoggedData(intervalOrDate) {
  try {
    if (intervalOrDate === 'hour') {
      startLiveUpdates();
      return;
    } else {
      stopLiveUpdates();
      const url = `fetch_logs.php?interval=hour&date=${intervalOrDate}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      if (data.length === 0) {
        alert('No data available for the selected date.');
        return;
      }

      updateChartWithLoggedData(data);
    }
  } catch (error) {
    console.error('Error fetching logged data:', error);
  }
}

function updateChartWithLoggedData(data) {
  pmChart.data.labels = [];
  pmChart.data.datasets.forEach(ds => ds.data = []);

  data.sort((a, b) => a.label > b.label ? 1 : -1);

  data.forEach(item => {
    pmChart.data.labels.push(item.label);
    pmChart.data.datasets[0].data.push(parseFloat(item.mq135));
    pmChart.data.datasets[1].data.push(parseFloat(item.pm25));
    pmChart.data.datasets[2].data.push(parseFloat(item.temperature));
    pmChart.data.datasets[3].data.push(parseFloat(item.humidity));
  });

  pmChart.update();
}

dropdown.addEventListener('change', (e) => {
  const val = e.target.value;
  if (val === 'hour') {
    pmChart.data.labels = [];
    pmChart.data.datasets.forEach(ds => ds.data = []);
    pmChart.update();
    startLiveUpdates();
  } else {
    stopLiveUpdates();
    fetchLoggedData(val);
  }
});

populateDropdown();
dropdown.value = 'hour';
startLiveUpdates();
